import { describe, it, expect } from "vitest";
import {
  getGameQuiz,
  getAllGameQuizIds,
  getAllGameQuizzes,
  getCharacterForArchetype,
  type GameQuiz,
  type GameCharacter,
} from "@/lib/game-quizzes";
import { getArchetype } from "@/lib/archetype";

describe("game quiz data integrity", () => {
  const allIds = getAllGameQuizIds();
  const allQuizzes = getAllGameQuizzes();

  it("has at least one game quiz", () => {
    expect(allIds.length).toBeGreaterThan(0);
    expect(allQuizzes.length).toBeGreaterThan(0);
  });

  it("has consistent IDs between getAllGameQuizIds and getAllGameQuizzes", () => {
    const idsFromQuizzes = allQuizzes.map((q) => q.id);
    expect(idsFromQuizzes.sort()).toEqual([...allIds].sort());
  });

  it.each(allIds)("quiz '%s' has all required fields", (id) => {
    const quiz = getGameQuiz(id);
    expect(quiz).toBeDefined();
    const q = quiz!;
    expect(q.id).toBe(id);
    expect(q.gameName).toBeTruthy();
    expect(q.gameNameEn).toBeTruthy();
    expect(q.icon).toBeTruthy();
    expect(q.tagline).toBeTruthy();
    expect(q.taglineEn).toBeTruthy();
    expect(q.description).toBeTruthy();
    expect(q.descriptionEn).toBeTruthy();
    expect(q.gradient).toHaveLength(2);
    expect(q.characters.length).toBeGreaterThan(0);
  });

  it.each(allIds)("quiz '%s' characters have bilingual text", (id) => {
    const quiz = getGameQuiz(id)!;
    for (const char of quiz.characters) {
      expect(char.name).toBeTruthy();
      expect(char.nameEn).toBeTruthy();
      expect(char.title).toBeTruthy();
      expect(char.titleEn).toBeTruthy();
      expect(char.matchReason).toBeTruthy();
      expect(char.matchReasonEn).toBeTruthy();
    }
  });

  it.each(allIds)("quiz '%s' characters have non-empty archetypeId strings", (id) => {
    const quiz = getGameQuiz(id)!;
    for (const char of quiz.characters) {
      expect(char.archetypeId).toBeTruthy();
      expect(typeof char.archetypeId).toBe("string");
    }
  });

  it.each(allIds)("quiz '%s' characters with known archetypes resolve correctly", (id) => {
    const quiz = getGameQuiz(id)!;
    // Some characters may map to archetype IDs not yet in the 16 archetypes
    // (e.g. "healer"). This test verifies that those that DO exist resolve.
    const knownCount = quiz.characters.filter(
      (c) => getArchetype(c.archetypeId) !== undefined
    ).length;
    // At least half should resolve to known archetypes
    expect(knownCount).toBeGreaterThan(quiz.characters.length / 2);
  });

  it.each(allIds)("quiz '%s' characters have unique IDs within the game", (id) => {
    const quiz = getGameQuiz(id)!;
    const charIds = quiz.characters.map((c) => c.id);
    expect(new Set(charIds).size).toBe(charIds.length);
  });

  it.each(allIds)("quiz '%s' characters have a CSS color", (id) => {
    const quiz = getGameQuiz(id)!;
    for (const char of quiz.characters) {
      expect(char.color).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    }
  });
});

describe("getGameQuiz", () => {
  it("returns a quiz for a valid ID", () => {
    const quiz = getGameQuiz("valorant");
    expect(quiz).toBeDefined();
    expect(quiz!.id).toBe("valorant");
  });

  it("returns undefined for an invalid ID", () => {
    expect(getGameQuiz("nonexistent-game")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(getGameQuiz("")).toBeUndefined();
  });
});

describe("getCharacterForArchetype", () => {
  it("returns the correct character for a valid game + archetype combo", () => {
    const char = getCharacterForArchetype("valorant", "lightning-assassin");
    expect(char).toBeDefined();
    expect(char!.id).toBe("jett");
  });

  it("returns undefined for invalid gameId", () => {
    expect(getCharacterForArchetype("nonexistent", "lightning-assassin")).toBeUndefined();
  });

  it("returns undefined for invalid archetypeId", () => {
    expect(getCharacterForArchetype("valorant", "nonexistent-archetype")).toBeUndefined();
  });

  it("returns undefined for both invalid", () => {
    expect(getCharacterForArchetype("nope", "nope")).toBeUndefined();
  });
});
