import { describe, it, expect, vi } from "vitest";

// Mock the db module so we can drive lookup outcomes without a real Postgres.
const mockDbState: {
  row: {
    id: string;
    orgId: string;
    tokenHash: string;
    revokedAt: Date | null;
    expiresAt: Date | null;
  } | null;
} = { row: null };

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (mockDbState.row ? [mockDbState.row] : []),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  apiTokens: {
    id: "id",
    tokenHash: "tokenHash",
    lastUsedAt: "lastUsedAt",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: () => null,
}));

import { hashApiToken, validateApiToken } from "@/lib/api-token-auth";

describe("hashApiToken", () => {
  it("produces a stable 64-char hex sha256 digest", () => {
    const hash = hashApiToken("gtn_abcdef");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // Determinism
    expect(hashApiToken("gtn_abcdef")).toBe(hash);
  });

  it("produces different digests for different inputs", () => {
    expect(hashApiToken("gtn_a")).not.toBe(hashApiToken("gtn_b"));
  });
});

describe("validateApiToken", () => {
  it("rejects tokens without the gtn_ prefix", async () => {
    expect(await validateApiToken("abc123")).toBeNull();
    expect(await validateApiToken("")).toBeNull();
  });

  it("returns null when no matching row exists", async () => {
    mockDbState.row = null;
    expect(await validateApiToken("gtn_nope")).toBeNull();
  });

  it("returns null when the matching token is revoked", async () => {
    mockDbState.row = {
      id: "t1",
      orgId: "org1",
      tokenHash: hashApiToken("gtn_revoked"),
      revokedAt: new Date("2026-01-01"),
      expiresAt: null,
    };
    expect(await validateApiToken("gtn_revoked")).toBeNull();
  });

  it("returns null when the matching token is expired", async () => {
    mockDbState.row = {
      id: "t2",
      orgId: "org2",
      tokenHash: hashApiToken("gtn_expired"),
      revokedAt: null,
      expiresAt: new Date("2020-01-01"),
    };
    expect(await validateApiToken("gtn_expired")).toBeNull();
  });

  it("returns the orgId for a valid, non-expired, non-revoked token", async () => {
    mockDbState.row = {
      id: "t3",
      orgId: "org3",
      tokenHash: hashApiToken("gtn_valid"),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    expect(await validateApiToken("gtn_valid")).toBe("org3");
  });

  it("returns the orgId when expiresAt is null (never expires)", async () => {
    mockDbState.row = {
      id: "t4",
      orgId: "org4",
      tokenHash: hashApiToken("gtn_eternal"),
      revokedAt: null,
      expiresAt: null,
    };
    expect(await validateApiToken("gtn_eternal")).toBe("org4");
  });
});
