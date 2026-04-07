import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRequest } from "../helpers/mock-request";
import { mockDbChain } from "../helpers/mock-db";

// Hoist mocks
const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const mockCheckRateLimit = vi.hoisted(() => vi.fn());
const mockCreateToken = vi.hoisted(() => vi.fn());
const mockSetAuthCookie = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  users: { id: "id", username: "username" },
}));
vi.mock("@/lib/redis", () => ({ checkRateLimit: mockCheckRateLimit }));
vi.mock("@/lib/auth", () => ({
  createToken: mockCreateToken,
  setAuthCookie: mockSetAuthCookie,
  AUTH_COOKIE_NAME: "auth-token",
  AUTH_COOKIE_MAX_AGE: 2592000,
  LOGGED_IN_COOKIE_NAME: "logged-in",
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
  or: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  desc: vi.fn((col: unknown) => col),
  asc: vi.fn((col: unknown) => col),
  sql: vi.fn(),
}));
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "mock-nanoid-id"),
}));

// Import AFTER mocks
import { POST } from "@/app/api/auth/register/route";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 5, resetInSeconds: 3600 });
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const req = createRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { username: "newuser", password: "pass123" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("RATE_LIMITED");
  });

  it("returns 400 for invalid input (short username)", async () => {
    const req = createRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { username: "ab", password: "password123" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid input (short password)", async () => {
    const req = createRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { username: "validuser", password: "12345" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 409 when username already exists", async () => {
    // First select: check existing user — found
    const existingChain = mockDbChain([{ id: "existing-id" }]);
    mockDb.select.mockReturnValue(existingChain);

    const req = createRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { username: "takenuser", password: "password123" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("CONFLICT");
  });

  it("returns 200 with token on successful registration", async () => {
    // First select: check existing user — not found
    const existingChain = mockDbChain([]);
    mockDb.select.mockReturnValue(existingChain);

    // Insert user
    const insertChain = mockDbChain();
    mockDb.insert.mockReturnValue(insertChain);

    mockCreateToken.mockResolvedValue("jwt.new.token");
    mockSetAuthCookie.mockResolvedValue(undefined);

    const req = createRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { username: "newuser", password: "password123" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.token).toBe("jwt.new.token");
    expect(json.data.username).toBe("newuser");
    expect(json.data.displayName).toBe("newuser");
  });

  it("creates user without referral tracking", async () => {
    // First select: check existing user — not found
    const existingChain = mockDbChain([]);
    mockDb.select.mockReturnValueOnce(existingChain);

    // Insert user
    const insertChain = mockDbChain();
    mockDb.insert.mockReturnValue(insertChain);

    mockCreateToken.mockResolvedValue("jwt.ref.token");
    mockSetAuthCookie.mockResolvedValue(undefined);

    const req = createRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { username: "newuser", password: "password123" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    // insert called once: for user only
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });
});
