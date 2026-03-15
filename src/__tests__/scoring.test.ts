import { describe, it, expect } from "vitest";
import {
  sigmoidNormalize,
  computeTalentScore,
  scoreToRank,
  computeOverallScore,
} from "@/lib/scoring";

describe("sigmoidNormalize", () => {
  it("returns ~50 when rawScore equals mean", () => {
    const result = sigmoidNormalize(50, 50, 10, true);
    expect(result).toBeCloseTo(50, 0);
  });

  it("returns >50 when rawScore is above mean (higherIsBetter=true)", () => {
    const result = sigmoidNormalize(70, 50, 10, true);
    expect(result).toBeGreaterThan(50);
  });

  it("returns <50 when rawScore is below mean (higherIsBetter=true)", () => {
    const result = sigmoidNormalize(30, 50, 10, true);
    expect(result).toBeLessThan(50);
  });

  it("inverts direction when higherIsBetter=false", () => {
    // For reaction time: lower is better
    const fast = sigmoidNormalize(200, 300, 80, false);
    const slow = sigmoidNormalize(400, 300, 80, false);
    expect(fast).toBeGreaterThan(slow);
  });

  it("clamps between 0 and 100", () => {
    const veryHigh = sigmoidNormalize(1000, 50, 10, true);
    const veryLow = sigmoidNormalize(-1000, 50, 10, true);
    expect(veryHigh).toBeLessThanOrEqual(100);
    expect(veryHigh).toBeGreaterThanOrEqual(0);
    expect(veryLow).toBeLessThanOrEqual(100);
    expect(veryLow).toBeGreaterThanOrEqual(0);
  });

  it("produces asymptotic curve approaching 100 for very high scores", () => {
    const score80 = sigmoidNormalize(80, 50, 10, true);
    const score90 = sigmoidNormalize(90, 50, 10, true);
    const score100 = sigmoidNormalize(100, 50, 10, true);
    expect(score90).toBeGreaterThan(score80);
    expect(score100).toBeGreaterThan(score90);
    // Diminishing returns
    const diff1 = score90 - score80;
    const diff2 = score100 - score90;
    expect(diff2).toBeLessThan(diff1);
  });

  it("handles zero stdDev gracefully", () => {
    // Should not throw or return NaN
    const result = sigmoidNormalize(50, 50, 0, true);
    expect(Number.isFinite(result)).toBe(true);
  });
});

describe("computeTalentScore", () => {
  it("returns 0 for empty scores", () => {
    expect(computeTalentScore([])).toBe(0);
  });

  it("returns the score directly for a single primary source", () => {
    const result = computeTalentScore([
      { normalizedScore: 75, isPrimary: true },
    ]);
    expect(result).toBe(75);
  });

  it("weights primary (1.0) higher than secondary (0.3)", () => {
    const result = computeTalentScore([
      { normalizedScore: 80, isPrimary: true },
      { normalizedScore: 60, isPrimary: false },
    ]);
    // (80*1.0 + 60*0.3) / (1.0+0.3) = 98/1.3 ≈ 75.4
    expect(result).toBeCloseTo(75.4, 0);
  });

  it("handles multiple primary and secondary sources", () => {
    const result = computeTalentScore([
      { normalizedScore: 80, isPrimary: true },
      { normalizedScore: 70, isPrimary: true },
      { normalizedScore: 60, isPrimary: false },
    ]);
    // (80+70+60*0.3) / (1+1+0.3) = 168/2.3 ≈ 73.0
    expect(result).toBeCloseTo(73.0, 0);
  });
});

describe("scoreToRank", () => {
  it("returns S for score >= 90", () => {
    expect(scoreToRank(90)).toBe("S");
    expect(scoreToRank(100)).toBe("S");
    expect(scoreToRank(95)).toBe("S");
  });

  it("returns A for score >= 75 and < 90", () => {
    expect(scoreToRank(75)).toBe("A");
    expect(scoreToRank(89.9)).toBe("A");
  });

  it("returns B for score >= 55 and < 75", () => {
    expect(scoreToRank(55)).toBe("B");
    expect(scoreToRank(74.9)).toBe("B");
  });

  it("returns C for score >= 35 and < 55", () => {
    expect(scoreToRank(35)).toBe("C");
    expect(scoreToRank(54.9)).toBe("C");
  });

  it("returns D for score < 35", () => {
    expect(scoreToRank(34.9)).toBe("D");
    expect(scoreToRank(0)).toBe("D");
  });
});

describe("computeOverallScore", () => {
  it("returns 0 for empty input", () => {
    expect(computeOverallScore({})).toBe(0);
  });

  it("averages all provided talent scores", () => {
    const result = computeOverallScore({
      reaction_speed: 80,
      hand_eye_coord: 60,
      memory: 70,
    });
    expect(result).toBeCloseTo(70, 0);
  });

  it("ignores zero values", () => {
    const result = computeOverallScore({
      reaction_speed: 80,
      hand_eye_coord: 0,
    });
    expect(result).toBe(80);
  });

  it("ignores null/undefined values", () => {
    const result = computeOverallScore({
      reaction_speed: 80,
      hand_eye_coord: undefined as unknown as number,
    });
    expect(result).toBe(80);
  });
});
