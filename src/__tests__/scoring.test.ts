import { describe, it, expect } from "vitest";
import {
  percentileNormalize,
  computeTalentScore,
  scoreToRank,
  computeOverallScore,
} from "@/lib/scoring";

describe("percentileNormalize (CDF-based)", () => {
  it("returns ~50 when rawScore equals mean", () => {
    const result = percentileNormalize(50, 50, 10, true);
    expect(result).toBeCloseTo(50, 0);
  });

  it("returns >50 when rawScore is above mean (higherIsBetter=true)", () => {
    const result = percentileNormalize(70, 50, 10, true);
    expect(result).toBeGreaterThan(50);
  });

  it("returns <50 when rawScore is below mean (higherIsBetter=true)", () => {
    const result = percentileNormalize(30, 50, 10, true);
    expect(result).toBeLessThan(50);
  });

  it("inverts direction when higherIsBetter=false", () => {
    // For reaction time: lower is better
    const fast = percentileNormalize(200, 300, 80, false);
    const slow = percentileNormalize(400, 300, 80, false);
    expect(fast).toBeGreaterThan(slow);
  });

  it("clamps between 1 and 99", () => {
    const veryHigh = percentileNormalize(1000, 50, 10, true);
    const veryLow = percentileNormalize(-1000, 50, 10, true);
    expect(veryHigh).toBeLessThanOrEqual(99);
    expect(veryHigh).toBeGreaterThanOrEqual(1);
    expect(veryLow).toBeLessThanOrEqual(99);
    expect(veryLow).toBeGreaterThanOrEqual(1);
  });

  it("maps 1 SD above mean to ~84th percentile", () => {
    const result = percentileNormalize(60, 50, 10, true); // +1 SD
    expect(result).toBeCloseTo(84.1, 0);
  });

  it("maps 2 SD above mean to ~97.7th percentile", () => {
    const result = percentileNormalize(70, 50, 10, true); // +2 SD
    expect(result).toBeCloseTo(97.7, 0);
  });

  it("maps 1 SD below mean to ~15.9th percentile", () => {
    const result = percentileNormalize(40, 50, 10, true); // -1 SD
    expect(result).toBeCloseTo(15.9, 0);
  });

  it("produces monotonically increasing scores within normal range", () => {
    // Within ±2 SD of mean, scores are strictly increasing
    const score40 = percentileNormalize(40, 50, 10, true); // -1 SD
    const score50 = percentileNormalize(50, 50, 10, true); // mean
    const score60 = percentileNormalize(60, 50, 10, true); // +1 SD
    const score70 = percentileNormalize(70, 50, 10, true); // +2 SD
    expect(score50).toBeGreaterThan(score40);
    expect(score60).toBeGreaterThan(score50);
    expect(score70).toBeGreaterThan(score60);
    // Beyond ±3 SD, scores may hit the 1-99 clamp (ceiling/floor effect)
    // This is correct behavior for a CDF-based percentile
    const score80 = percentileNormalize(80, 50, 10, true); // +3 SD
    expect(score80).toBeGreaterThanOrEqual(score70);
  });

  it("handles zero stdDev gracefully", () => {
    const result = percentileNormalize(50, 50, 0, true);
    expect(result).toBe(50);
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
