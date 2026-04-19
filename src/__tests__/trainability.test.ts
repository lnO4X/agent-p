import { describe, it, expect } from "vitest";
import {
  TRAINABILITY,
  projectScoreAfterTraining,
  getTrainability,
} from "@/lib/trainability";
import { TALENT_CATEGORIES, type TalentCategory } from "@/types/talent";

describe("TRAINABILITY", () => {
  it("has an entry for every TalentCategory", () => {
    expect(Object.keys(TRAINABILITY)).toHaveLength(TALENT_CATEGORIES.length);
    for (const cat of TALENT_CATEGORIES) {
      expect(TRAINABILITY[cat]).toBeDefined();
    }
  });

  it("has no extra keys beyond the valid TalentCategory set", () => {
    for (const key of Object.keys(TRAINABILITY)) {
      expect(TALENT_CATEGORIES).toContain(key);
    }
  });

  it("each entry's category field matches its key", () => {
    for (const cat of TALENT_CATEGORIES) {
      expect(TRAINABILITY[cat].category).toBe(cat);
    }
  });

  it("trainabilityPct is in the honest 10-35 range (no 'unlimited' claims)", () => {
    for (const cat of TALENT_CATEGORIES) {
      const pct = TRAINABILITY[cat].trainabilityPct;
      expect(pct).toBeGreaterThanOrEqual(10);
      expect(pct).toBeLessThanOrEqual(35);
    }
  });

  it("practiceHours is realistic (30-60)", () => {
    for (const cat of TALENT_CATEGORIES) {
      const hours = TRAINABILITY[cat].practiceHours;
      expect(hours).toBeGreaterThanOrEqual(30);
      expect(hours).toBeLessThanOrEqual(60);
    }
  });

  it("evidenceStrength is a valid enum value", () => {
    const valid = new Set(["high", "medium", "low"]);
    for (const cat of TALENT_CATEGORIES) {
      expect(valid.has(TRAINABILITY[cat].evidenceStrength)).toBe(true);
    }
  });

  it("each entry has non-empty methodEn, methodZh, and source", () => {
    for (const cat of TALENT_CATEGORIES) {
      const entry = TRAINABILITY[cat];
      expect(entry.methodEn.length).toBeGreaterThan(0);
      expect(entry.methodZh.length).toBeGreaterThan(0);
      expect(entry.source.length).toBeGreaterThan(0);
    }
  });
});

describe("getTrainability", () => {
  it("returns the entry for a known category", () => {
    const entry = getTrainability("memory");
    expect(entry.category).toBe("memory");
    expect(entry.trainabilityPct).toBe(15);
  });

  it("returns entries that match TRAINABILITY table", () => {
    for (const cat of TALENT_CATEGORIES) {
      expect(getTrainability(cat)).toEqual(TRAINABILITY[cat]);
    }
  });
});

describe("projectScoreAfterTraining", () => {
  it("returns the same score when hoursPracticed is 0", () => {
    expect(projectScoreAfterTraining(50, "memory", 0)).toBe(50);
  });

  it("produces an improvement after full practiceHours", () => {
    const improved = projectScoreAfterTraining(50, "memory", 40);
    expect(improved).toBeGreaterThan(50);
  });

  it("clamps the projected score to 99 even with absurdly large practice", () => {
    expect(projectScoreAfterTraining(50, "memory", 10000)).toBeLessThanOrEqual(99);
    expect(projectScoreAfterTraining(95, "spatial_awareness", 10000)).toBeLessThanOrEqual(99);
  });

  it("improvement never exceeds trainabilityPct / 100 * currentScore", () => {
    const hoursToTry = [1, 10, 25, 40, 80, 200, 1000];
    for (const cat of TALENT_CATEGORIES) {
      const t = TRAINABILITY[cat];
      for (const score of [20, 50, 80]) {
        const maxGain = score * (t.trainabilityPct / 100);
        for (const hours of hoursToTry) {
          const projected = projectScoreAfterTraining(score, cat, hours);
          // Allow tiny floating-point tolerance; the algorithmic ceiling is maxGain.
          // (Separate clamp at 99 could only reduce further, not increase.)
          expect(projected - score).toBeLessThanOrEqual(maxGain + 1e-9);
        }
      }
    }
  });

  it("returns currentScore for an unknown category (defensive fallback)", () => {
    // Cast used to simulate a malformed input at runtime — the function
    // defends with an early return.
    const unknown = "not_a_real_category" as unknown as TalentCategory;
    expect(projectScoreAfterTraining(42, unknown, 100)).toBe(42);
  });
});
