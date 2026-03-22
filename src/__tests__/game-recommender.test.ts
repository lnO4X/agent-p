import { describe, it, expect } from "vitest";

/**
 * game-recommender.ts — SKIPPED
 *
 * All exported functions in game-recommender.ts require database access:
 * - generateGameRecommendations(): queries `games` table, writes to `gameRecommendations`
 * - getRecommendationsForProfile(): queries `gameRecommendations` + `games` + `recommendationFeedback`
 * - buildReason() is private (not exported)
 *
 * These would need integration tests with a test DB or mocked Drizzle instance.
 * Pure scoring logic is tested via scoring.test.ts and scoring-extended.test.ts.
 */
describe("game-recommender", () => {
  it.skip("all functions require DB — integration tests needed", () => {
    // Placeholder: generateGameRecommendations, getRecommendationsForProfile
    // require database connection (drizzle ORM queries).
    // The scoring algorithm (genre fitScore calculation) is indirectly tested
    // via recommendGenres() in scoring-extended.test.ts since it uses
    // the same GENRE_TALENT_MAP weights.
    expect(true).toBe(true);
  });
});
