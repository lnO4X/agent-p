import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  submitScoreSchema,
  createSessionSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  createPartnerSchema,
  updatePartnerSchema,
  chatMessageSchema,
  memoryExtractionSchema,
  bindEmailSchema,
  PARTNER_ICONS,
} from "@/lib/validations";

// ==================== loginSchema ====================

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({ username: "alice", password: "pass123" });
    expect(result.success).toBe(true);
  });

  it("rejects missing username", () => {
    const result = loginSchema.safeParse({ password: "pass123" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({ username: "alice" });
    expect(result.success).toBe(false);
  });

  it("rejects empty username", () => {
    const result = loginSchema.safeParse({ username: "", password: "pass123" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ username: "alice", password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects non-string types", () => {
    const result = loginSchema.safeParse({ username: 123, password: true });
    expect(result.success).toBe(false);
  });
});

// ==================== registerSchema ====================

describe("registerSchema", () => {
  it("accepts valid input without referredBy", () => {
    const result = registerSchema.safeParse({ username: "bob", password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with referredBy", () => {
    const result = registerSchema.safeParse({ username: "bob", password: "secret123", referredBy: "ABC12345" });
    expect(result.success).toBe(true);
  });

  it("rejects username shorter than 3 chars", () => {
    const result = registerSchema.safeParse({ username: "ab", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects username longer than 20 chars", () => {
    const result = registerSchema.safeParse({ username: "a".repeat(21), password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects username with special characters", () => {
    const result = registerSchema.safeParse({ username: "bob@!", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("accepts username with underscores", () => {
    const result = registerSchema.safeParse({ username: "bob_123", password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 6 chars", () => {
    const result = registerSchema.safeParse({ username: "bob", password: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 50 chars", () => {
    const result = registerSchema.safeParse({ username: "bob", password: "x".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("rejects referredBy longer than 8 chars", () => {
    const result = registerSchema.safeParse({ username: "bob", password: "secret123", referredBy: "123456789" });
    expect(result.success).toBe(false);
  });

  it("rejects missing username", () => {
    const result = registerSchema.safeParse({ password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = registerSchema.safeParse({ username: "bob" });
    expect(result.success).toBe(false);
  });
});

// ==================== submitScoreSchema ====================

describe("submitScoreSchema", () => {
  it("accepts valid input", () => {
    const result = submitScoreSchema.safeParse({
      sessionId: "sess-1",
      gameId: "game-1",
      rawScore: 85.5,
      durationMs: 3000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with metadata", () => {
    const result = submitScoreSchema.safeParse({
      sessionId: "sess-1",
      gameId: "game-1",
      rawScore: 100,
      durationMs: 1500,
      metadata: { level: "hard", combo: 5 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty sessionId", () => {
    const result = submitScoreSchema.safeParse({
      sessionId: "",
      gameId: "game-1",
      rawScore: 50,
      durationMs: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty gameId", () => {
    const result = submitScoreSchema.safeParse({
      sessionId: "sess-1",
      gameId: "",
      rawScore: 50,
      durationMs: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-number rawScore", () => {
    const result = submitScoreSchema.safeParse({
      sessionId: "sess-1",
      gameId: "game-1",
      rawScore: "high",
      durationMs: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive durationMs", () => {
    const result = submitScoreSchema.safeParse({
      sessionId: "sess-1",
      gameId: "game-1",
      rawScore: 50,
      durationMs: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative durationMs", () => {
    const result = submitScoreSchema.safeParse({
      sessionId: "sess-1",
      gameId: "game-1",
      rawScore: 50,
      durationMs: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer durationMs", () => {
    const result = submitScoreSchema.safeParse({
      sessionId: "sess-1",
      gameId: "game-1",
      rawScore: 50,
      durationMs: 1000.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = submitScoreSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ==================== createSessionSchema ====================

describe("createSessionSchema", () => {
  it("accepts empty object", () => {
    const result = createSessionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts with categories array", () => {
    const result = createSessionSchema.safeParse({ categories: ["fps", "moba"] });
    expect(result.success).toBe(true);
  });

  it("accepts with empty categories array", () => {
    const result = createSessionSchema.safeParse({ categories: [] });
    expect(result.success).toBe(true);
  });

  it("rejects non-array categories", () => {
    const result = createSessionSchema.safeParse({ categories: "fps" });
    expect(result.success).toBe(false);
  });
});

// ==================== forgotPasswordSchema ====================

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = forgotPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ==================== resetPasswordSchema ====================

describe("resetPasswordSchema", () => {
  it("accepts valid token and password", () => {
    const result = resetPasswordSchema.safeParse({ token: "abc123", password: "newpass1" });
    expect(result.success).toBe(true);
  });

  it("rejects empty token", () => {
    const result = resetPasswordSchema.safeParse({ token: "", password: "newpass1" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = resetPasswordSchema.safeParse({ token: "abc123", password: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects long password", () => {
    const result = resetPasswordSchema.safeParse({ token: "abc123", password: "x".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(resetPasswordSchema.safeParse({}).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "abc" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "newpass1" }).success).toBe(false);
  });
});

// ==================== changePasswordSchema ====================

describe("changePasswordSchema", () => {
  it("accepts valid input", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass",
      newPassword: "newpass1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty currentPassword", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "newpass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short newPassword", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass",
      newPassword: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects long newPassword", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass",
      newPassword: "x".repeat(51),
    });
    expect(result.success).toBe(false);
  });
});

// ==================== createPartnerSchema ====================

describe("createPartnerSchema", () => {
  it("accepts valid input", () => {
    const result = createPartnerSchema.safeParse({
      name: "TestBot",
      avatar: "Bot",
      definition: "A helpful assistant for testing purposes.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with modelId", () => {
    const result = createPartnerSchema.safeParse({
      name: "TestBot",
      avatar: "Brain",
      definition: "A helpful assistant for testing purposes.",
      modelId: "gpt-4",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null modelId", () => {
    const result = createPartnerSchema.safeParse({
      name: "TestBot",
      avatar: "Bot",
      definition: "A helpful assistant for testing purposes.",
      modelId: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createPartnerSchema.safeParse({
      name: "",
      avatar: "Bot",
      definition: "A helpful assistant for testing purposes.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 20 chars", () => {
    const result = createPartnerSchema.safeParse({
      name: "a".repeat(21),
      avatar: "Bot",
      definition: "A helpful assistant for testing purposes.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid avatar icon", () => {
    const result = createPartnerSchema.safeParse({
      name: "TestBot",
      avatar: "InvalidIcon",
      definition: "A helpful assistant for testing purposes.",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid avatar icons", () => {
    for (const icon of PARTNER_ICONS) {
      const result = createPartnerSchema.safeParse({
        name: "Bot",
        avatar: icon,
        definition: "A helpful assistant for testing purposes.",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects definition shorter than 10 chars", () => {
    const result = createPartnerSchema.safeParse({
      name: "TestBot",
      avatar: "Bot",
      definition: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects definition longer than 2000 chars", () => {
    const result = createPartnerSchema.safeParse({
      name: "TestBot",
      avatar: "Bot",
      definition: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

// ==================== updatePartnerSchema ====================

describe("updatePartnerSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updatePartnerSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update with name only", () => {
    const result = updatePartnerSchema.safeParse({ name: "NewName" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid avatar", () => {
    const result = updatePartnerSchema.safeParse({ avatar: "Nope" });
    expect(result.success).toBe(false);
  });

  it("rejects short definition", () => {
    const result = updatePartnerSchema.safeParse({ definition: "Too short" });
    expect(result.success).toBe(false);
  });
});

// ==================== chatMessageSchema ====================

describe("chatMessageSchema", () => {
  it("accepts valid input", () => {
    const result = chatMessageSchema.safeParse({
      messages: [{ role: "user", content: "Hello" }],
      partnerId: "partner-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty messages array", () => {
    const result = chatMessageSchema.safeParse({
      messages: [],
      partnerId: "partner-1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing partnerId", () => {
    const result = chatMessageSchema.safeParse({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty partnerId", () => {
    const result = chatMessageSchema.safeParse({
      messages: [{ role: "user", content: "Hello" }],
      partnerId: "",
    });
    expect(result.success).toBe(false);
  });
});

// ==================== memoryExtractionSchema ====================

describe("memoryExtractionSchema", () => {
  it("accepts valid text", () => {
    const result = memoryExtractionSchema.safeParse({ conversationText: "Hello world" });
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = memoryExtractionSchema.safeParse({ conversationText: "" });
    expect(result.success).toBe(false);
  });

  it("rejects text longer than 20000 chars", () => {
    const result = memoryExtractionSchema.safeParse({ conversationText: "x".repeat(20001) });
    expect(result.success).toBe(false);
  });

  it("rejects missing field", () => {
    const result = memoryExtractionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ==================== bindEmailSchema ====================

describe("bindEmailSchema", () => {
  it("accepts valid email", () => {
    const result = bindEmailSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = bindEmailSchema.safeParse({ email: "bad-email" });
    expect(result.success).toBe(false);
  });

  it("rejects email longer than 100 chars", () => {
    const result = bindEmailSchema.safeParse({ email: "a".repeat(90) + "@example.com" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = bindEmailSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
