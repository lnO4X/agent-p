import { describe, it, expect } from "vitest";
import {
  QUESTIONS,
  answersToScores,
  getShuffledQuestions,
} from "@/lib/questionnaire";
import { TALENT_CATEGORIES } from "@/types/talent";

describe("answersToScores", () => {
  it("converts 39 valid answers to 13 talent scores", () => {
    const answers: Record<number, number> = {};
    for (const q of QUESTIONS) {
      answers[q.id] = 3; // neutral answer
    }
    const scores = answersToScores(answers);
    const keys = Object.keys(scores);
    expect(keys.length).toBe(13);
  });

  it("all 1s → low scores for positive questions", () => {
    const answers: Record<number, number> = {};
    for (const q of QUESTIONS) {
      answers[q.id] = 1;
    }
    const scores = answersToScores(answers);
    for (const val of Object.values(scores)) {
      // Positive q: (1-1)/4*100=0, Negative q: (5-1)/4*100=100 → avg per talent ~33
      expect(val!).toBeLessThanOrEqual(50);
    }
  });

  it("all 5s → high scores for positive questions", () => {
    const answers: Record<number, number> = {};
    for (const q of QUESTIONS) {
      answers[q.id] = 5;
    }
    const scores = answersToScores(answers);
    for (const val of Object.values(scores)) {
      // Positive q: (5-1)/4*100=100, Negative q: (5-5)/4*100=0 → avg per talent ~67
      expect(val!).toBeGreaterThanOrEqual(50);
    }
  });

  it("inverted questions score correctly (negative polarity)", () => {
    // Pick a negative question (id 2: reaction_speed, positive=false)
    const negQ = QUESTIONS.find((q) => !q.positive)!;
    // Answer 1 (strongly disagree) on negative question → should yield HIGH score
    const answersLow: Record<number, number> = { [negQ.id]: 1 };
    const answersHigh: Record<number, number> = { [negQ.id]: 5 };

    const scoresLow = answersToScores(answersLow);
    const scoresHigh = answersToScores(answersHigh);

    // For negative polarity: answer=1 → (5-1)/4*100=100, answer=5 → (5-5)/4*100=0
    expect(scoresLow[negQ.talent]).toBe(100);
    expect(scoresHigh[negQ.talent]).toBe(0);
  });

  it("missing/partial answers don't crash", () => {
    // Empty answers
    const empty = answersToScores({});
    expect(Object.keys(empty).length).toBe(0);

    // Only 3 answers
    const partial = answersToScores({ 1: 3, 2: 4, 3: 5 });
    expect(partial.reaction_speed).toBeDefined();
  });

  it("all scores are within 0-100 range", () => {
    // Test with extreme values
    const answers: Record<number, number> = {};
    for (const q of QUESTIONS) {
      answers[q.id] = q.positive ? 5 : 1;
    }
    const scores = answersToScores(answers);
    for (const val of Object.values(scores)) {
      expect(val!).toBeGreaterThanOrEqual(0);
      expect(val!).toBeLessThanOrEqual(100);
    }
  });
});

describe("getShuffledQuestions", () => {
  it("returns all 39 questions", () => {
    const questions = getShuffledQuestions();
    expect(questions).toHaveLength(39);
  });

  it("all 13 talent categories are represented", () => {
    const questions = getShuffledQuestions();
    const talents = new Set(questions.map((q) => q.talent));
    for (const cat of TALENT_CATEGORIES) {
      expect(talents.has(cat)).toBe(true);
    }
  });

  it("each question has zh and en text", () => {
    const questions = getShuffledQuestions();
    for (const q of questions) {
      expect(q.zh).toBeTruthy();
      expect(q.en).toBeTruthy();
      expect(typeof q.zh).toBe("string");
      expect(typeof q.en).toBe("string");
    }
  });

  it("contains the same questions as QUESTIONS (no duplicates, no missing)", () => {
    const questions = getShuffledQuestions();
    const ids = questions.map((q) => q.id).sort((a, b) => a - b);
    const originalIds = QUESTIONS.map((q) => q.id).sort((a, b) => a - b);
    expect(ids).toEqual(originalIds);
  });
});
