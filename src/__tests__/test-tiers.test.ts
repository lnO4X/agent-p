import { describe, it, expect } from "vitest";
import { TIER_CONFIGS, getTierConfig, getUserTestTier, getChatLimit, getTestLimit } from "@/lib/test-tiers";
import { gameRegistry } from "@/games";

describe("TIER_CONFIGS", () => {
  it("quick tier is free and no auth", () => {
    const quick = TIER_CONFIGS.quick;
    expect(quick.requiresAuth).toBe(false);
    expect(quick.requiresPayment).toBe(false);
    expect(quick.priceUsd).toBe(0);
    expect(quick.gameIds).toHaveLength(3);
  });

  it("standard tier is free and no auth", () => {
    const standard = TIER_CONFIGS.standard;
    expect(standard.requiresAuth).toBe(false);
    expect(standard.requiresPayment).toBe(false);
    expect(standard.priceUsd).toBe(0);
    expect(standard.gameIds).toHaveLength(7);
  });

  it("pro tier requires auth AND payment", () => {
    const pro = TIER_CONFIGS.pro;
    expect(pro.requiresAuth).toBe(true);
    expect(pro.requiresPayment).toBe(true);
    expect(pro.priceUsd).toBe(3.99);
    expect(pro.gameIds).toHaveLength(18);
  });

  it("all tier game IDs exist in the game registry", () => {
    for (const tier of ["quick", "standard", "pro"] as const) {
      const config = TIER_CONFIGS[tier];
      for (const gameId of config.gameIds) {
        const plugin = gameRegistry.get(gameId);
        expect(plugin, `Game "${gameId}" in tier "${tier}" not found in registry`).toBeDefined();
      }
    }
  });

  it("pro tier game IDs are a superset of standard", () => {
    const standardIds = new Set(TIER_CONFIGS.standard.gameIds);
    const proIds = new Set(TIER_CONFIGS.pro.gameIds);
    for (const id of standardIds) {
      expect(proIds.has(id), `Standard game "${id}" missing from pro tier`).toBe(true);
    }
  });
});

describe("payment gate logic", () => {
  // Simulates the payment gate check from quiz/page.tsx startTest()
  function shouldAllowStart(
    tier: "quick" | "standard" | "pro",
    userTier: "free" | "premium" | undefined
  ): "allow" | "need_auth" | "need_payment" {
    const config = TIER_CONFIGS[tier];
    if (config.requiresAuth && !userTier) return "need_auth";
    if (config.requiresPayment && userTier !== "premium") return "need_payment";
    return "allow";
  }

  it("quick tier allows anyone", () => {
    expect(shouldAllowStart("quick", undefined)).toBe("allow");
    expect(shouldAllowStart("quick", "free")).toBe("allow");
    expect(shouldAllowStart("quick", "premium")).toBe("allow");
  });

  it("standard tier allows anyone", () => {
    expect(shouldAllowStart("standard", undefined)).toBe("allow");
    expect(shouldAllowStart("standard", "free")).toBe("allow");
    expect(shouldAllowStart("standard", "premium")).toBe("allow");
  });

  it("pro tier blocks unauthenticated users", () => {
    expect(shouldAllowStart("pro", undefined)).toBe("need_auth");
  });

  it("pro tier blocks free users (payment gate)", () => {
    expect(shouldAllowStart("pro", "free")).toBe("need_payment");
  });

  it("pro tier allows premium users", () => {
    expect(shouldAllowStart("pro", "premium")).toBe("allow");
  });
});

describe("helper functions", () => {
  it("getTierConfig returns correct config", () => {
    expect(getTierConfig("quick").id).toBe("quick");
    expect(getTierConfig("pro").priceUsd).toBe(3.99);
  });

  it("getUserTestTier maps correctly", () => {
    expect(getUserTestTier("free")).toBe("standard");
    expect(getUserTestTier("premium")).toBe("pro");
  });

  it("getChatLimit returns tier-appropriate limits", () => {
    expect(getChatLimit("free")).toBe(TIER_CONFIGS.standard.dailyChatLimit);
    expect(getChatLimit("premium")).toBe(TIER_CONFIGS.pro.dailyChatLimit);
    expect(getChatLimit("premium")).toBeGreaterThan(getChatLimit("free"));
  });

  it("getTestLimit returns tier-appropriate limits", () => {
    expect(getTestLimit("free")).toBe(TIER_CONFIGS.standard.dailyTestLimit);
    expect(getTestLimit("premium")).toBe(TIER_CONFIGS.pro.dailyTestLimit);
  });
});
