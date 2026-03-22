import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRequest } from "../helpers/mock-request";

// Hoist mocks
const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const mockGetAuthFromCookie = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  users: { id: "id", username: "username", displayName: "displayName" },
  communityPosts: {
    id: "id", authorId: "authorId", archetypeId: "archetypeId",
    content: "content", likeCount: "likeCount", replyCount: "replyCount",
    createdAt: "createdAt",
  },
  communityPostLikes: { postId: "postId", userId: "userId" },
}));
vi.mock("@/lib/auth", () => ({
  getAuthFromCookie: mockGetAuthFromCookie,
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
  or: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  desc: vi.fn((col: unknown) => col),
  asc: vi.fn((col: unknown) => col),
  sql: vi.fn(() => 0),
  inArray: vi.fn((...args: unknown[]) => args),
}));
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "mock-post-id"),
}));

/**
 * Creates a thenable chain mock — every method returns the chain,
 * and awaiting the chain resolves to the given value.
 */
function createThenableChain(resolvedValue: unknown) {
  const chain: Record<string, any> = {};
  const methods = [
    "from", "where", "limit", "offset", "orderBy",
    "innerJoin", "leftJoin", "groupBy", "set", "values", "returning",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Make the chain thenable (awaitable)
  chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
    return Promise.resolve(resolvedValue).then(resolve, reject);
  };
  return chain;
}

// Import AFTER mocks
import { GET, POST } from "@/app/api/community/route";

describe("GET /api/community", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthFromCookie.mockResolvedValue(null);
  });

  it("returns posts array", async () => {
    const mockPosts = [
      {
        id: "p1", authorId: "u1", authorUsername: "user1", authorDisplayName: "User 1",
        archetypeId: "strategist", content: "Hello world",
        likeCount: 3, replyCount: 1, createdAt: new Date(),
      },
    ];

    const postsChain = createThenableChain(mockPosts);
    const countChain = createThenableChain([{ count: 1 }]);

    mockDb.select
      .mockReturnValueOnce(postsChain)
      .mockReturnValueOnce(countChain);

    const req = createRequest("GET", "http://localhost:3000/api/community");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].id).toBe("p1");
    expect(json.data[0].liked).toBe(false);
    expect(json.meta.total).toBe(1);
  });

  it("returns posts with liked status for authenticated user", async () => {
    mockGetAuthFromCookie.mockResolvedValue({ sub: "u1", username: "user1" });

    const mockPosts = [
      {
        id: "p1", authorId: "u2", authorUsername: "user2", authorDisplayName: "User 2",
        archetypeId: "strategist", content: "Post content",
        likeCount: 5, replyCount: 0, createdAt: new Date(),
      },
    ];

    const postsChain = createThenableChain(mockPosts);
    const likesChain = createThenableChain([{ postId: "p1" }]);
    const countChain = createThenableChain([{ count: 1 }]);

    mockDb.select
      .mockReturnValueOnce(postsChain)
      .mockReturnValueOnce(likesChain)
      .mockReturnValueOnce(countChain);

    const req = createRequest("GET", "http://localhost:3000/api/community");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data[0].liked).toBe(true);
  });

  it("supports sort=hot query parameter", async () => {
    const postsChain = createThenableChain([]);
    const countChain = createThenableChain([{ count: 0 }]);

    mockDb.select
      .mockReturnValueOnce(postsChain)
      .mockReturnValueOnce(countChain);

    const req = createRequest("GET", "http://localhost:3000/api/community?sort=hot");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(0);
  });
});

describe("POST /api/community", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthFromCookie.mockResolvedValue(null);

    const req = createRequest("POST", "http://localhost:3000/api/community", {
      body: { archetypeId: "strategist", content: "Hello" },
    });

    const res = await POST(req as unknown as Request);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 for invalid input (missing content)", async () => {
    mockGetAuthFromCookie.mockResolvedValue({ sub: "u1", username: "user1" });

    const req = createRequest("POST", "http://localhost:3000/api/community", {
      body: { archetypeId: "strategist", content: "" },
    });

    const res = await POST(req as unknown as Request);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("creates post successfully", async () => {
    mockGetAuthFromCookie.mockResolvedValue({ sub: "u1", username: "user1" });

    const mockNewPost = {
      id: "mock-post-id", authorId: "u1", archetypeId: "strategist",
      content: "Great post!", likeCount: 0, replyCount: 0,
      createdAt: new Date(),
    };

    const insertChain = createThenableChain(undefined);
    // Override returning to resolve with the new post
    insertChain.returning = vi.fn().mockReturnValue({
      then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
        Promise.resolve([mockNewPost]).then(resolve, reject),
    });
    mockDb.insert.mockReturnValue(insertChain);

    const req = createRequest("POST", "http://localhost:3000/api/community", {
      body: { archetypeId: "strategist", content: "Great post!" },
    });

    const res = await POST(req as unknown as Request);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("mock-post-id");
    expect(json.data.content).toBe("Great post!");
  });
});
