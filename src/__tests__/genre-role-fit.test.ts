import { describe, it, expect } from "vitest";
import {
  GENRE_PROFILES,
  computeGenreFit,
  type GameGenreId,
} from "@/lib/genre-cognitive-fit";
import {
  ROLE_PROFILES,
  computeRoleFit,
  getTopRoleFits,
} from "@/lib/role-cognitive-fit";
import { TALENT_CATEGORIES, type TalentCategory, type TalentProfile } from "@/types/talent";

/**
 * Build a TalentProfile with all dims at a base value, then override
 * specific dims (e.g., to simulate a "perfect scorer" for a genre).
 */
function buildProfile(
  base: number,
  overrides: Partial<Record<TalentCategory, number>> = {}
): TalentProfile {
  const scores = {} as Record<TalentCategory, number>;
  for (const cat of TALENT_CATEGORIES) {
    scores[cat] = overrides[cat] ?? base;
  }
  const avg =
    Object.values(scores).reduce((a, b) => a + b, 0) /
    TALENT_CATEGORIES.length;
  return {
    scores,
    overallScore: avg,
    overallRank: "C",
  };
}

/** Build a profile where the listed genre's key dims are maxed, others are floor. */
function maxProfileForGenre(genreId: GameGenreId, floor = 0): TalentProfile {
  const genre = GENRE_PROFILES.find((g) => g.id === genreId);
  if (!genre) throw new Error(`genre ${genreId} not found`);
  const overrides: Partial<Record<TalentCategory, number>> = {};
  for (const { cat } of genre.keyDimensions) {
    overrides[cat] = 100;
  }
  return buildProfile(floor, overrides);
}

describe("GENRE_PROFILES", () => {
  it("has 10 or more genres", () => {
    expect(GENRE_PROFILES.length).toBeGreaterThanOrEqual(10);
  });

  it("every genre has at least one key dimension", () => {
    for (const g of GENRE_PROFILES) {
      expect(g.keyDimensions.length).toBeGreaterThan(0);
    }
  });

  it("every weight is between 0 and 1", () => {
    for (const g of GENRE_PROFILES) {
      for (const kd of g.keyDimensions) {
        expect(kd.weight).toBeGreaterThan(0);
        expect(kd.weight).toBeLessThanOrEqual(1);
      }
    }
  });

  it("all genre ids are unique", () => {
    const ids = GENRE_PROFILES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("ROLE_PROFILES", () => {
  it("has 10 or more roles", () => {
    expect(ROLE_PROFILES.length).toBeGreaterThanOrEqual(10);
  });

  it("covers FPS, MOBA, and RTS at minimum", () => {
    const genreIds = new Set(ROLE_PROFILES.map((r) => r.genreId));
    expect(genreIds.has("fps")).toBe(true);
    expect(genreIds.has("moba")).toBe(true);
    expect(genreIds.has("rts")).toBe(true);
  });

  it("every role has at least one key dimension", () => {
    for (const r of ROLE_PROFILES) {
      expect(r.keyDimensions.length).toBeGreaterThan(0);
    }
  });

  it("all role ids are unique", () => {
    const ids = ROLE_PROFILES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("computeGenreFit", () => {
  it("returns one result per genre", () => {
    const profile = buildProfile(50);
    const results = computeGenreFit(profile);
    expect(results.length).toBe(GENRE_PROFILES.length);
  });

  it("returns results sorted by fitScore descending", () => {
    const profile = buildProfile(50, { reaction_speed: 100, hand_eye_coord: 100 });
    const results = computeGenreFit(profile);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].fitScore).toBeGreaterThanOrEqual(results[i].fitScore);
    }
  });

  it("perfect scorer on FPS dims → top genre is 'fps'", () => {
    const profile = maxProfileForGenre("fps", 0);
    const results = computeGenreFit(profile);
    expect(results[0].genre.id).toBe("fps");
  });

  it("perfect scorer on MOBA dims → top genre is 'moba'", () => {
    const profile = maxProfileForGenre("moba", 0);
    const results = computeGenreFit(profile);
    expect(results[0].genre.id).toBe("moba");
  });

  it("every fitScore is between 0 and 100", () => {
    const profile = buildProfile(50, { reaction_speed: 100, memory: 0 });
    const results = computeGenreFit(profile);
    for (const r of results) {
      expect(r.fitScore).toBeGreaterThanOrEqual(0);
      expect(r.fitScore).toBeLessThanOrEqual(100);
    }
  });

  it("all-50 profile yields fitScore of ~50 for every genre", () => {
    const profile = buildProfile(50);
    const results = computeGenreFit(profile);
    for (const r of results) {
      expect(r.fitScore).toBe(50);
    }
  });

  it("each result has a non-empty 'why' array", () => {
    const profile = buildProfile(60);
    const results = computeGenreFit(profile);
    for (const r of results) {
      expect(r.why.length).toBeGreaterThan(0);
    }
  });
});

describe("computeRoleFit", () => {
  it("returns only FPS roles when genreId='fps'", () => {
    const profile = buildProfile(50);
    const results = computeRoleFit(profile, "fps");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.role.genreId).toBe("fps");
    }
  });

  it("returns only MOBA roles when genreId='moba'", () => {
    const profile = buildProfile(50);
    const results = computeRoleFit(profile, "moba");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.role.genreId).toBe("moba");
    }
  });

  it("returns all roles when no genreId given", () => {
    const profile = buildProfile(50);
    const results = computeRoleFit(profile);
    expect(results.length).toBe(ROLE_PROFILES.length);
  });

  it("returns results sorted by fitScore descending", () => {
    const profile = buildProfile(50, {
      reaction_speed: 95,
      hand_eye_coord: 95,
      memory: 20,
    });
    const results = computeRoleFit(profile);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].fitScore).toBeGreaterThanOrEqual(results[i].fitScore);
    }
  });

  it("every fitScore is between 0 and 100", () => {
    const profile = buildProfile(0, { reaction_speed: 100, memory: 100 });
    const results = computeRoleFit(profile);
    for (const r of results) {
      expect(r.fitScore).toBeGreaterThanOrEqual(0);
      expect(r.fitScore).toBeLessThanOrEqual(100);
    }
  });
});

describe("getTopRoleFits", () => {
  it("returns 3 results by default", () => {
    const profile = buildProfile(50);
    const results = getTopRoleFits(profile, 3);
    expect(results.length).toBe(3);
  });

  it("returns n results when given n", () => {
    const profile = buildProfile(50);
    expect(getTopRoleFits(profile, 1).length).toBe(1);
    expect(getTopRoleFits(profile, 5).length).toBe(5);
  });

  it("returns results sorted by fitScore descending", () => {
    const profile = buildProfile(50, { memory: 100, strategy_logic: 100 });
    const results = getTopRoleFits(profile, 5);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].fitScore).toBeGreaterThanOrEqual(results[i].fitScore);
    }
  });
});

describe("all-50 profile diagnostic", () => {
  it("reports top FPS role and top MOBA role for a flat 50 profile", () => {
    const profile = buildProfile(50);
    const topFps = computeRoleFit(profile, "fps")[0];
    const topMoba = computeRoleFit(profile, "moba")[0];
    expect(topFps.fitScore).toBe(50);
    expect(topMoba.fitScore).toBe(50);
    // Diagnostic assertions so the report values are stable.
    expect(topFps.role.genreId).toBe("fps");
    expect(topMoba.role.genreId).toBe("moba");
    // Log the specific top role id for reporting
    console.log(
      `[diagnostic] all-50 top FPS role = ${topFps.role.id} (${topFps.role.nameEn}); top MOBA role = ${topMoba.role.id} (${topMoba.role.nameEn})`
    );
  });
});
