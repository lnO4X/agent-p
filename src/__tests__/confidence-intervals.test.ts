import { describe, it, expect } from "vitest";
import {
  computeCI95,
  getDimensionCI95,
  formatScoreCI,
  PARADIGM_RELIABILITY,
} from "@/lib/confidence-intervals";
import { TALENT_CATEGORIES } from "@/types/talent";

describe("computeCI95", () => {
  it("returns [score, score] when reliability is perfect (r=1.0)", () => {
    const [lower, upper] = computeCI95(50, 1.0);
    expect(lower).toBe(50);
    expect(upper).toBe(50);
  });

  it("returns full clamped range when reliability is zero", () => {
    const [lower, upper] = computeCI95(50, 0);
    // halfWidth = 1.96 * 25 * sqrt(1) = 49 → [1, 99] after clamp
    expect(lower).toBe(1);
    expect(upper).toBe(99);
  });

  it("produces a sensible CI for r=0.80", () => {
    // halfWidth = 1.96 * 25 * sqrt(0.20) ≈ 21.9
    const [lower, upper] = computeCI95(50, 0.8);
    expect(lower).toBeGreaterThanOrEqual(27);
    expect(lower).toBeLessThanOrEqual(29);
    expect(upper).toBeGreaterThanOrEqual(71);
    expect(upper).toBeLessThanOrEqual(73);
  });

  it("clamps the upper bound to 99 at extreme high scores", () => {
    const [, upper] = computeCI95(99, 0.7);
    expect(upper).toBe(99);
  });

  it("clamps the lower bound to 1 at extreme low scores", () => {
    const [lower] = computeCI95(1, 0.7);
    expect(lower).toBe(1);
  });

  it("treats negative reliability as zero (no uncertainty inversion)", () => {
    // Math.max(0, 1 - r) guards against r > 1 producing NaN
    const [lower, upper] = computeCI95(50, 1.5);
    expect(lower).toBe(50);
    expect(upper).toBe(50);
  });

  it("produces wider CIs for lower reliability (more noise = wider band)", () => {
    const [lowHigh, upHigh] = computeCI95(50, 0.9);
    const [lowLow, upLow] = computeCI95(50, 0.5);
    const widthHigh = upHigh - lowHigh;
    const widthLow = upLow - lowLow;
    expect(widthLow).toBeGreaterThan(widthHigh);
  });

  it("returns integer bounds (rounded)", () => {
    const [lower, upper] = computeCI95(50, 0.73);
    expect(Number.isInteger(lower)).toBe(true);
    expect(Number.isInteger(upper)).toBe(true);
  });
});

describe("getDimensionCI95", () => {
  it("returns a sensible CI for a known dimension", () => {
    const [lower, upper] = getDimensionCI95("reaction_speed", 75);
    // r=0.68, halfWidth = 1.96 * 25 * sqrt(0.32) ≈ 27.7 → [47, 103] clamped to [47, 99]
    expect(lower).toBeGreaterThanOrEqual(1);
    expect(lower).toBeLessThan(75);
    expect(upper).toBeGreaterThan(75);
    expect(upper).toBeLessThanOrEqual(99);
  });

  it("uses the correct reliability for emotional_control (high r ⇒ narrow CI)", () => {
    const [lowerEmo, upperEmo] = getDimensionCI95("emotional_control", 50);
    const [lowerRisk, upperRisk] = getDimensionCI95("risk_assessment", 50);
    const widthEmo = upperEmo - lowerEmo;
    const widthRisk = upperRisk - lowerRisk;
    // emotional_control (r=0.83) should have narrower band than risk_assessment (r=0.55)
    expect(widthEmo).toBeLessThan(widthRisk);
  });

  it("produces bounds within [1, 99] for any dimension", () => {
    for (const category of TALENT_CATEGORIES) {
      const [lower, upper] = getDimensionCI95(category, 50);
      expect(lower).toBeGreaterThanOrEqual(1);
      expect(upper).toBeLessThanOrEqual(99);
      expect(lower).toBeLessThanOrEqual(upper);
    }
  });
});

describe("formatScoreCI", () => {
  it("formats a score with CI using the en-dash separator", () => {
    expect(formatScoreCI(72, [62, 82])).toBe("72 (62\u201382)");
  });

  it("rounds the score before rendering", () => {
    expect(formatScoreCI(72.4, [62, 82])).toBe("72 (62\u201382)");
    expect(formatScoreCI(72.6, [62, 82])).toBe("73 (62\u201382)");
  });

  it("includes the CI bounds verbatim", () => {
    expect(formatScoreCI(50, [1, 99])).toBe("50 (1\u201399)");
  });
});

describe("PARADIGM_RELIABILITY", () => {
  it("has an entry for every TalentCategory", () => {
    for (const category of TALENT_CATEGORIES) {
      expect(PARADIGM_RELIABILITY[category]).toBeDefined();
      expect(typeof PARADIGM_RELIABILITY[category]).toBe("number");
    }
  });

  it("has all reliability values in (0, 1) range", () => {
    for (const category of TALENT_CATEGORIES) {
      const r = PARADIGM_RELIABILITY[category];
      expect(r).toBeGreaterThan(0);
      expect(r).toBeLessThan(1);
    }
  });
});
