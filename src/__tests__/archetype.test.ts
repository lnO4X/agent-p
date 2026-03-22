import { describe, it, expect } from "vitest";
import {
  getArchetype,
  getAllArchetypes,
  scoreToArchetype,
  quickScoresToArchetype,
  ARCHETYPES,
} from "@/lib/archetype";
import { TALENT_CATEGORIES, type TalentCategory } from "@/types/talent";

describe("getArchetype", () => {
  it("returns an archetype for a valid ID", () => {
    const arch = getArchetype("lightning-assassin");
    expect(arch).toBeDefined();
    expect(arch!.id).toBe("lightning-assassin");
    expect(arch!.name).toBe("闪电刺客");
  });

  it("returns undefined for an invalid ID", () => {
    const arch = getArchetype("nonexistent-id");
    expect(arch).toBeUndefined();
  });
});

describe("getAllArchetypes", () => {
  it("returns 16 archetypes", () => {
    const all = getAllArchetypes();
    expect(all).toHaveLength(16);
  });

  it("all archetypes have required fields", () => {
    const all = getAllArchetypes();
    for (const arch of all) {
      expect(arch.id).toBeTruthy();
      expect(arch.name).toBeTruthy();
      expect(arch.nameEn).toBeTruthy();
      expect(arch.icon).toBeTruthy();
      expect(arch.gradient).toHaveLength(2);
      expect(arch.genres.length).toBeGreaterThan(0);
      expect(arch.nemesisId).toBeTruthy();
      expect(arch.allyId).toBeTruthy();
    }
  });

  it("all nemesisId references point to valid archetype IDs", () => {
    const all = getAllArchetypes();
    const ids = new Set(all.map((a) => a.id));
    for (const arch of all) {
      expect(ids.has(arch.nemesisId)).toBe(true);
    }
  });

  it("all allyId references point to valid archetype IDs", () => {
    const all = getAllArchetypes();
    const ids = new Set(all.map((a) => a.id));
    for (const arch of all) {
      expect(ids.has(arch.allyId)).toBe(true);
    }
  });

  it("all evolutionId references point to valid archetype IDs", () => {
    const all = getAllArchetypes();
    const ids = new Set(all.map((a) => a.id));
    for (const arch of all) {
      expect(ids.has(arch.evolutionId)).toBe(true);
    }
  });

  it("all strongTalent and weakTalent are valid talent categories", () => {
    const validTalents = new Set<string>(TALENT_CATEGORIES);
    const all = getAllArchetypes();
    for (const arch of all) {
      expect(validTalents.has(arch.strongTalent)).toBe(true);
      expect(validTalents.has(arch.weakTalent)).toBe(true);
    }
  });
});

describe("scoreToArchetype", () => {
  it("returns an archetype given full talent scores", () => {
    const scores: Partial<Record<TalentCategory, number>> = {};
    for (const cat of TALENT_CATEGORIES) {
      scores[cat] = 50;
    }
    const arch = scoreToArchetype(scores);
    expect(arch).toBeDefined();
    expect(arch.id).toBeTruthy();
    expect(arch.name).toBeTruthy();
  });

  it("returns an archetype for extreme high-reflexive scores", () => {
    const scores: Partial<Record<TalentCategory, number>> = {
      reaction_speed: 95,
      hand_eye_coord: 90,
      rhythm_sense: 80,
      strategy_logic: 20,
      memory: 25,
      pattern_recog: 30,
      emotional_control: 30,
      decision_speed: 85,
      risk_assessment: 70,
    };
    const arch = scoreToArchetype(scores);
    expect(arch).toBeDefined();
    expect(arch.id).toBeTruthy();
  });

  it("returns an archetype for strategic-defensive scores", () => {
    const scores: Partial<Record<TalentCategory, number>> = {
      reaction_speed: 30,
      hand_eye_coord: 35,
      strategy_logic: 80,
      memory: 75,
      pattern_recog: 70,
      emotional_control: 85,
      resource_mgmt: 80,
      spatial_awareness: 65,
    };
    const arch = scoreToArchetype(scores);
    expect(arch).toBeDefined();
    expect(arch.id).toBeTruthy();
  });

  it("returns an archetype even with empty scores (defaults to 50)", () => {
    const arch = scoreToArchetype({});
    expect(arch).toBeDefined();
    expect(arch.id).toBeTruthy();
  });
});

describe("quickScoresToArchetype", () => {
  it("returns an archetype given 3 quick scores", () => {
    const arch = quickScoresToArchetype(70, 40, 60);
    expect(arch).toBeDefined();
    expect(arch.id).toBeTruthy();
    expect(arch.name).toBeTruthy();
  });

  it("balanced scores → shapeshifter", () => {
    // spread < 12
    const arch = quickScoresToArchetype(50, 50, 50);
    expect(arch.id).toBe("shapeshifter");
  });

  it("high reaction + bold → reflexive-bold quadrant", () => {
    // reflexive > strategic, bold > 55 (100-riskScore > 55 → riskScore < 45)
    const arch = quickScoresToArchetype(80, 30, 20);
    expect(["lightning-assassin", "berserker"]).toContain(arch.id);
  });

  it("high pattern + steady → strategic-steady quadrant", () => {
    // strategic > reflexive, bold < 45 (100-riskScore < 45 → riskScore > 55)
    const arch = quickScoresToArchetype(30, 80, 80);
    expect(["oracle", "fortress"]).toContain(arch.id);
  });

  it("always returns a valid archetype for various inputs", () => {
    const testCases = [
      [0, 0, 0],
      [100, 100, 100],
      [100, 0, 50],
      [0, 100, 50],
      [50, 50, 0],
      [50, 50, 100],
    ];
    for (const [r, p, k] of testCases) {
      const arch = quickScoresToArchetype(r, p, k);
      expect(arch).toBeDefined();
      expect(arch.id).toBeTruthy();
    }
  });
});
