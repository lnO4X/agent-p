import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRequest } from "../helpers/mock-request";
import { mockDbChain } from "../helpers/mock-db";

// Hoist mocks
const mockDb = vi.hoisted(() => {
  const db = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return db;
});

const mockCheckRateLimit = vi.hoisted(() => vi.fn());
const mockCreateToken = vi.hoisted(() => vi.fn());
const mockSetAuthCookie = vi.hoisted(() => vi.fn());
const mockBcryptCompare = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  users: { id: "id", username: "username", email: "email", googleId: "googleId" },
}));
vi.mock("@/lib/redis", () => ({ checkRateLimit: mockCheckRateLimit }));
vi.mock("@/lib/auth", () => ({
  createToken: mockCreateToken,
  setAuthCookie: mockSetAuthCookie,
  AUTH_COOKIE_NAME: "auth-token",
  AUTH_COOKIE_MAX_AGE: 2592000,
  LOGGED_IN_COOKIE_NAME: "logged-in",
}));
vi.mock("bcryptjs", () => ({
  default: { compare: mockBcryptCompare, hash: vi.fn() },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
  or: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  desc: vi.fn((col: unknown) => col),
  asc: vi.fn((col: unknown) => col),
  sql: vi.fn(),
}));

// Import AFTER mocks
import { POST } from "@/app/api/auth/login/route";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetInSeconds: 300 });
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const req = createRequest("POST", "http://localhost:3000/api/auth/login", {
      body: { username: "testuser", password: "password123" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("RATE_LIMITED");
  });

  it("returns 400 for invalid input (empty username)", async () => {
    const req = createRequest("POST", "http://localhost:3000/api/auth/login", {
      body: { username: "", password: "x" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 when user not found", async () => {
    const chain = mockDbChain([]);
    mockDb.select.mockReturnValue(chain);

    const req = createRequest("POST", "http://localhost:3000/api/auth/login", {
      body: { username: "nonexistent", password: "password123" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 for OAuth-only user (no password)", async () => {
    const chain = mockDbChain([{
      id: "u1", username: "googleuser", passwordHash: null,
      failedLoginAttempts: 0, lockedUntil: null,
    }]);
    mockDb.select.mockReturnValue(chain);

    const req = createRequest("POST", "http://localhost:3000/api/auth/login", {
      body: { username: "googleuser", password: "password123" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("NO_PASSWORD");
  });

  it("returns 423 for locked account", async () => {
    const chain = mockDbChain([{
      id: "u1", username: "locked", passwordHash: "hash",
      failedLoginAttempts: 5, lockedUntil: new Date(Date.now() + 600000),
    }]);
    mockDb.select.mockReturnValue(chain);

    const req = createRequest("POST", "http://localhost:3000/api/auth/login", {
      body: { username: "locked", password: "password123" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(423);
    expect(json.error.code).toBe("ACCOUNT_LOCKED");
  });

  it("returns 401 and increments attempts on wrong password", async () => {
    mockBcryptCompare.mockResolvedValue(false);

    const selectChain = mockDbChain([{
      id: "u1", username: "testuser", passwordHash: "$2a$12$hash",
      failedLoginAttempts: 2, lockedUntil: null,
    }]);
    mockDb.select.mockReturnValue(selectChain);

    const updateChain = mockDbChain();
    mockDb.update.mockReturnValue(updateChain);

    const req = createRequest("POST", "http://localhost:3000/api/auth/login", {
      body: { username: "testuser", password: "wrongpass" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 200 with token on successful login", async () => {
    mockBcryptCompare.mockResolvedValue(true);

    const selectChain = mockDbChain([{
      id: "u1", username: "testuser", displayName: "Test", passwordHash: "$2a$12$hash",
      failedLoginAttempts: 0, lockedUntil: null,
    }]);
    mockDb.select.mockReturnValue(selectChain);

    mockCreateToken.mockResolvedValue("jwt.token.here");
    mockSetAuthCookie.mockResolvedValue(undefined);

    const req = createRequest("POST", "http://localhost:3000/api/auth/login", {
      body: { username: "testuser", password: "correctpass" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.token).toBe("jwt.token.here");
    expect(json.data.username).toBe("testuser");
  });
});
