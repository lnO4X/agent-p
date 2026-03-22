import { describe, it, expect } from "vitest";
import { computeCompatibility } from "@/lib/archetype-compat";
import { getAllArchetypes } from "@/lib/archetype";

describe("computeCompatibility", () => {
  it("returns a compatibility result for two valid IDs", () => {
    const result = computeCompatibility("lightning-assassin", "oracle");
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(0);
    expect(result!.score).toBeLessThanOrEqual(100);
  });

  it("returns null for invalid first ID", () => {
    const result = computeCompatibility("nonexistent", "oracle");
    expect(result).toBeNull();
  });

  it("returns null for invalid second ID", () => {
    const result = computeCompatibility("oracle", "nonexistent");
    expect(result).toBeNull();
  });

  it("returns null for two invalid IDs", () => {
    const result = computeCompatibility("fake-a", "fake-b");
    expect(result).toBeNull();
  });

  it("same archetype → score of 75", () => {
    const result = computeCompatibility("oracle", "oracle");
    expect(result).not.toBeNull();
    expect(result!.score).toBe(75);
    expect(result!.labelKey).toBe("compat.mirror");
  });

  it("score is between 10 and 98 for different archetypes", () => {
    const all = getAllArchetypes();
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const result = computeCompatibility(all[i].id, all[j].id);
        expect(result).not.toBeNull();
        expect(result!.score).toBeGreaterThanOrEqual(10);
        expect(result!.score).toBeLessThanOrEqual(98);
      }
    }
  });

  it("result has required fields", () => {
    const result = computeCompatibility("lightning-assassin", "berserker");
    expect(result).not.toBeNull();
    expect(typeof result!.score).toBe("number");
    expect(typeof result!.labelKey).toBe("string");
    expect(typeof result!.dynamic).toBe("string");
    expect(typeof result!.dynamicEn).toBe("string");
    expect(Array.isArray(result!.strengths)).toBe(true);
    expect(Array.isArray(result!.strengthsEn)).toBe(true);
    expect(Array.isArray(result!.challenges)).toBe(true);
    expect(Array.isArray(result!.challengesEn)).toBe(true);
    expect(result!.strengths.length).toBeGreaterThan(0);
    expect(result!.challenges.length).toBeGreaterThan(0);
  });

  it("nemesis pair scores lower than ally pair", () => {
    // lightning-assassin's nemesis is oracle, ally is commander
    const nemesis = computeCompatibility("lightning-assassin", "oracle");
    const ally = computeCompatibility("lightning-assassin", "commander");
    expect(nemesis).not.toBeNull();
    expect(ally).not.toBeNull();
    expect(ally!.score).toBeGreaterThan(nemesis!.score);
  });

  it("approximate symmetry: compat(a,b) close to compat(b,a)", () => {
    const all = getAllArchetypes();
    // Test a sample of pairs
    const pairs = [
      ["lightning-assassin", "oracle"],
      ["berserker", "fortress"],
      ["commander", "lone-wolf"],
      ["gambler", "sentinel"],
    ];
    for (const [a, b] of pairs) {
      const ab = computeCompatibility(a, b);
      const ba = computeCompatibility(b, a);
      expect(ab).not.toBeNull();
      expect(ba).not.toBeNull();
      // Allow some asymmetry due to directional relationships (ally/nemesis)
      expect(Math.abs(ab!.score - ba!.score)).toBeLessThanOrEqual(25);
    }
  });

  it("labelKey varies by score range", () => {
    const all = getAllArchetypes();
    const labels = new Set<string>();
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const result = computeCompatibility(all[i].id, all[j].id);
        if (result) labels.add(result.labelKey);
      }
    }
    // Should have at least 2 different labels across all pairs
    expect(labels.size).toBeGreaterThanOrEqual(2);
  });
});
