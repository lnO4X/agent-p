import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("mock-captcha-token"),
}));

// All mock fns must be created inside vi.hoisted so they exist before vi.mock factories run
const mockFns = vi.hoisted(() => {
  const select = vi.fn();
  const from = vi.fn();
  const where = vi.fn();
  const limit = vi.fn();
  const insert = vi.fn();
  const values = vi.fn();
  const del = vi.fn();

  const db: Record<string, ReturnType<typeof vi.fn>> = {
    select, from, where, limit, insert, values, delete: del,
  };

  // Chain setup
  select.mockReturnValue(db);
  from.mockReturnValue(db);
  where.mockReturnValue(db);
  limit.mockResolvedValue([]);
  insert.mockReturnValue(db);
  values.mockResolvedValue(undefined);
  del.mockReturnValue(db);

  return { db, select, from, where, limit, insert, values, del };
});

vi.mock("@/db", () => ({
  db: mockFns.db,
}));

// Mock drizzle-orm operators
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  lt: vi.fn((...args: unknown[]) => ({ type: "lt", args })),
}));

// Mock schema
vi.mock("@/db/schema", () => ({
  captchaSessions: {
    id: "captchaSessions.id",
    answer: "captchaSessions.answer",
    expiresAt: "captchaSessions.expiresAt",
  },
}));

import {
  generateCaptcha,
  verifyCaptcha,
  cleanupExpiredCaptchas,
} from "@/lib/captcha";

function resetDbChain() {
  const { db, select, from, where, limit, insert, values, del } = mockFns;
  select.mockReturnValue(db);
  from.mockReturnValue(db);
  where.mockReturnValue(db);
  limit.mockResolvedValue([]);
  insert.mockReturnValue(db);
  values.mockResolvedValue(undefined);
  del.mockReturnValue(db);
}

describe("captcha", () => {
  beforeEach(() => {
    const { select, from, where, limit, insert, values, del } = mockFns;
    select.mockClear();
    from.mockClear();
    where.mockClear();
    limit.mockClear();
    insert.mockClear();
    values.mockClear();
    del.mockClear();
    resetDbChain();
  });

  describe("generateCaptcha", () => {
    it("returns token and svg", async () => {
      const result = await generateCaptcha();
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("svg");
      expect(result.token).toBe("mock-captcha-token");
    });

    it("returns a valid SVG string", async () => {
      const result = await generateCaptcha();
      expect(result.svg).toContain("<svg");
      expect(result.svg).toContain("</svg>");
      expect(result.svg).toContain("xmlns");
    });

    it("SVG contains text elements for the math expression", async () => {
      const result = await generateCaptcha();
      expect(result.svg).toContain("<text");
    });

    it("inserts captcha session into DB", async () => {
      await generateCaptcha();
      expect(mockFns.insert).toHaveBeenCalled();
      expect(mockFns.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mock-captcha-token",
          answer: expect.any(String),
          expiresAt: expect.any(Date),
        })
      );
    });
  });

  describe("generateMathCaptcha (via generateCaptcha)", () => {
    it("produces valid math answers over many iterations", async () => {
      for (let i = 0; i < 50; i++) {
        await generateCaptcha();
        const call = mockFns.values.mock.calls[i][0];
        const answer = parseInt(call.answer, 10);
        expect(Number.isInteger(answer)).toBe(true);
      }
    });
  });

  describe("verifyCaptcha", () => {
    it("returns false when token not found in DB", async () => {
      mockFns.limit.mockResolvedValueOnce([]);
      const result = await verifyCaptcha("unknown-token", "42");
      expect(result).toBe(false);
    });

    it("returns true for correct answer", async () => {
      const futureDate = new Date(Date.now() + 60000);
      mockFns.limit.mockResolvedValueOnce([
        { id: "tok", answer: "42", expiresAt: futureDate },
      ]);
      const result = await verifyCaptcha("tok", "42");
      expect(result).toBe(true);
    });

    it("returns true for answer with whitespace (trimmed)", async () => {
      const futureDate = new Date(Date.now() + 60000);
      mockFns.limit.mockResolvedValueOnce([
        { id: "tok", answer: "42", expiresAt: futureDate },
      ]);
      const result = await verifyCaptcha("tok", "  42  ");
      expect(result).toBe(true);
    });

    it("returns false for wrong answer", async () => {
      const futureDate = new Date(Date.now() + 60000);
      mockFns.limit.mockResolvedValueOnce([
        { id: "tok", answer: "42", expiresAt: futureDate },
      ]);
      const result = await verifyCaptcha("tok", "99");
      expect(result).toBe(false);
    });

    it("returns false for expired captcha", async () => {
      const pastDate = new Date(Date.now() - 60000);
      mockFns.limit.mockResolvedValueOnce([
        { id: "tok", answer: "42", expiresAt: pastDate },
      ]);
      const result = await verifyCaptcha("tok", "42");
      expect(result).toBe(false);
    });

    it("always deletes the captcha (one-time use)", async () => {
      mockFns.limit.mockResolvedValueOnce([
        { id: "tok", answer: "42", expiresAt: new Date(Date.now() + 60000) },
      ]);
      await verifyCaptcha("tok", "42");
      expect(mockFns.del).toHaveBeenCalled();
    });
  });

  describe("cleanupExpiredCaptchas", () => {
    it("deletes expired captcha sessions", async () => {
      await cleanupExpiredCaptchas();
      expect(mockFns.del).toHaveBeenCalled();
      expect(mockFns.where).toHaveBeenCalled();
    });
  });
});
