import { describe, it, expect } from "vitest";
import { TALENT_LABELS, GENRE_TALENT_MAP, TALENT_ICON_NAMES } from "@/lib/constants";
import { TALENT_CATEGORIES, type TalentCategory } from "@/types/talent";

describe("TALENT_LABELS", () => {
  it("has entries for all 13 talent categories", () => {
    expect(Object.keys(TALENT_LABELS)).toHaveLength(13);
    for (const cat of TALENT_CATEGORIES) {
      expect(TALENT_LABELS[cat]).toBeDefined();
    }
  });

  it("each entry has zh and en labels", () => {
    for (const cat of TALENT_CATEGORIES) {
      const label = TALENT_LABELS[cat];
      expect(label.zh).toBeTruthy();
      expect(label.en).toBeTruthy();
    }
  });

  it("has no extra keys beyond the 13 categories", () => {
    const keys = Object.keys(TALENT_LABELS);
    for (const key of keys) {
      expect(TALENT_CATEGORIES).toContain(key);
    }
  });
});

describe("TALENT_ICON_NAMES", () => {
  it("has entries for all 13 talent categories", () => {
    expect(Object.keys(TALENT_ICON_NAMES)).toHaveLength(13);
    for (const cat of TALENT_CATEGORIES) {
      expect(TALENT_ICON_NAMES[cat]).toBeTruthy();
    }
  });

  it("each icon name is a non-empty string", () => {
    for (const cat of TALENT_CATEGORIES) {
      expect(typeof TALENT_ICON_NAMES[cat]).toBe("string");
      expect(TALENT_ICON_NAMES[cat].length).toBeGreaterThan(0);
    }
  });
});

describe("GENRE_TALENT_MAP", () => {
  const expectedGenres = [
    "fps",
    "moba",
    "rpg",
    "rhythm",
    "puzzle",
    "strategy",
    "battle_royale",
    "racing",
    "simulation",
    "card",
  ];

  it("has all expected genres", () => {
    for (const genre of expectedGenres) {
      expect(GENRE_TALENT_MAP[genre]).toBeDefined();
    }
  });

  it("has exactly the expected number of genres", () => {
    expect(Object.keys(GENRE_TALENT_MAP)).toHaveLength(expectedGenres.length);
  });

  it("each genre has name, nameZh, and requiredTalents", () => {
    for (const genre of expectedGenres) {
      const entry = GENRE_TALENT_MAP[genre];
      expect(entry.name).toBeTruthy();
      expect(entry.nameZh).toBeTruthy();
      expect(entry.requiredTalents.length).toBeGreaterThan(0);
    }
  });

  it("each genre's requiredTalents reference valid talent categories", () => {
    for (const [genreKey, genre] of Object.entries(GENRE_TALENT_MAP)) {
      for (const talent of genre.requiredTalents) {
        expect(TALENT_CATEGORIES).toContain(talent.category);
      }
    }
  });

  it("each genre's talent weights sum to approximately 1.0", () => {
    for (const [genreKey, genre] of Object.entries(GENRE_TALENT_MAP)) {
      const sum = genre.requiredTalents.reduce((s, t) => s + t.weight, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  it("each genre's talent weights are positive", () => {
    for (const genre of Object.values(GENRE_TALENT_MAP)) {
      for (const talent of genre.requiredTalents) {
        expect(talent.weight).toBeGreaterThan(0);
      }
    }
  });

  it("no duplicate talent categories within a single genre", () => {
    for (const [genreKey, genre] of Object.entries(GENRE_TALENT_MAP)) {
      const cats = genre.requiredTalents.map((t) => t.category);
      expect(new Set(cats).size).toBe(cats.length);
    }
  });
});
