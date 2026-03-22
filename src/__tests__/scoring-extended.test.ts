import { describe, it, expect } from "vitest";
import { recommendGenres, RANK_COLORS } from "@/lib/scoring";
import type { TalentCategory } from "@/types/talent";

describe("recommendGenres", () => {
  it("includes fps-related genres for high reaction_speed + hand_eye_coord", () => {
    const scores: Partial<Record<TalentCategory, number>> = {
      reaction_speed: 95,
      hand_eye_coord: 90,
      spatial_awareness: 60,
      decision_speed: 70,
    };
    const result = recommendGenres(scores, 5);
    const genreIds = result.map((r) => r.genre);
    // fps and racing both weight reaction_speed + hand_eye_coord heavily
    expect(
      genreIds.includes("fps") || genreIds.includes("racing")
    ).toBe(true);
  });

  it("includes strategy-related genres for high strategy_logic", () => {
    const scores: Partial<Record<TalentCategory, number>> = {
      strategy_logic: 95,
      resource_mgmt: 85,
      risk_assessment: 80,
      decision_speed: 60,
      multitasking: 50,
    };
    const result = recommendGenres(scores, 5);
    const genreIds = result.map((r) => r.genre);
    expect(
      genreIds.includes("strategy") || genreIds.includes("simulation")
    ).toBe(true);
  });

  it("returns multiple genres for balanced scores", () => {
    const scores: Partial<Record<TalentCategory, number>> = {
      reaction_speed: 60,
      hand_eye_coord: 60,
      spatial_awareness: 60,
      memory: 60,
      strategy_logic: 60,
      rhythm_sense: 60,
      pattern_recog: 60,
      multitasking: 60,
      decision_speed: 60,
      emotional_control: 60,
      teamwork_tendency: 60,
      risk_assessment: 60,
      resource_mgmt: 60,
    };
    const result = recommendGenres(scores, 10);
    expect(result.length).toBeGreaterThanOrEqual(5);
    // fitScores should be relatively close for balanced input
    const maxFit = result[0].fitScore;
    const minFit = result[result.length - 1].fitScore;
    expect(maxFit - minFit).toBeLessThan(20);
  });

  it("handles empty scores gracefully", () => {
    const result = recommendGenres({});
    expect(Array.isArray(result)).toBe(true);
    // All fitScores should be 0 since no talent scores provided
    for (const r of result) {
      expect(r.fitScore).toBe(0);
    }
  });

  it("respects topN parameter", () => {
    const scores: Partial<Record<TalentCategory, number>> = {
      reaction_speed: 80,
      strategy_logic: 70,
    };
    const top3 = recommendGenres(scores, 3);
    expect(top3.length).toBe(3);

    const top1 = recommendGenres(scores, 1);
    expect(top1.length).toBe(1);
  });

  it("returns results sorted by fitScore descending", () => {
    const scores: Partial<Record<TalentCategory, number>> = {
      reaction_speed: 90,
      hand_eye_coord: 85,
      strategy_logic: 40,
    };
    const result = recommendGenres(scores, 10);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].fitScore).toBeLessThanOrEqual(result[i - 1].fitScore);
    }
  });

  it("includes name and nameZh in each result", () => {
    const scores: Partial<Record<TalentCategory, number>> = {
      reaction_speed: 70,
    };
    const result = recommendGenres(scores, 3);
    for (const r of result) {
      expect(r.name).toBeDefined();
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.nameZh).toBeDefined();
      expect(r.nameZh.length).toBeGreaterThan(0);
    }
  });

  it("defaults topN to 5", () => {
    const scores: Partial<Record<TalentCategory, number>> = {
      reaction_speed: 70,
    };
    const result = recommendGenres(scores);
    expect(result.length).toBe(5);
  });

  it("high rhythm_sense favors rhythm genre", () => {
    const scores: Partial<Record<TalentCategory, number>> = {
      rhythm_sense: 95,
      reaction_speed: 70,
      hand_eye_coord: 65,
      pattern_recog: 60,
    };
    const result = recommendGenres(scores, 3);
    const genreIds = result.map((r) => r.genre);
    expect(genreIds.includes("rhythm")).toBe(true);
  });
});

describe("RANK_COLORS", () => {
  it("has entries for all five ranks", () => {
    expect(RANK_COLORS).toHaveProperty("S");
    expect(RANK_COLORS).toHaveProperty("A");
    expect(RANK_COLORS).toHaveProperty("B");
    expect(RANK_COLORS).toHaveProperty("C");
    expect(RANK_COLORS).toHaveProperty("D");
  });

  it("each rank color string contains Tailwind classes", () => {
    for (const rank of ["S", "A", "B", "C", "D"] as const) {
      expect(RANK_COLORS[rank]).toMatch(/text-/);
      expect(RANK_COLORS[rank]).toMatch(/bg-/);
      expect(RANK_COLORS[rank]).toMatch(/border-/);
    }
  });
});
