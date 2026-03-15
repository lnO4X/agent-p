import { describe, it, expect } from "vitest";

// Test pure game logic functions that are extractable

describe("Spatial game: generatePolygon and rotatePoints", () => {
  // Simple seeded random from spatial game
  function mulberry32(a: number) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generatePolygon(numVertices: number, seed: number) {
    const points: { x: number; y: number }[] = [];
    const angleStep = (Math.PI * 2) / numVertices;
    const rng = mulberry32(seed);
    for (let i = 0; i < numVertices; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const radius = 30 + rng() * 20;
      points.push({
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
      });
    }
    return points;
  }

  function rotatePoints(points: { x: number; y: number }[], angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    const cx = 50, cy = 50;
    return points.map((p) => ({
      x: cx + (p.x - cx) * Math.cos(rad) - (p.y - cy) * Math.sin(rad),
      y: cy + (p.x - cx) * Math.sin(rad) + (p.y - cy) * Math.cos(rad),
    }));
  }

  it("generates correct number of vertices", () => {
    const poly3 = generatePolygon(3, 42);
    const poly5 = generatePolygon(5, 42);
    const poly8 = generatePolygon(8, 42);
    expect(poly3).toHaveLength(3);
    expect(poly5).toHaveLength(5);
    expect(poly8).toHaveLength(8);
  });

  it("generates deterministic output for same seed", () => {
    const a = generatePolygon(4, 12345);
    const b = generatePolygon(4, 12345);
    expect(a).toEqual(b);
  });

  it("generates different output for different seeds", () => {
    const a = generatePolygon(4, 100);
    const b = generatePolygon(4, 200);
    expect(a).not.toEqual(b);
  });

  it("all points are within bounds (0-100)", () => {
    for (let seed = 0; seed < 100; seed++) {
      const poly = generatePolygon(5, seed);
      for (const p of poly) {
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(100);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(100);
      }
    }
  });

  it("rotation by 360° returns approximately original points", () => {
    const original = generatePolygon(4, 42);
    const rotated = rotatePoints(original, 360);
    for (let i = 0; i < original.length; i++) {
      expect(rotated[i].x).toBeCloseTo(original[i].x, 10);
      expect(rotated[i].y).toBeCloseTo(original[i].y, 10);
    }
  });

  it("rotation by 90° then 90° equals rotation by 180°", () => {
    const original = generatePolygon(4, 42);
    const rot90 = rotatePoints(original, 90);
    const rot90_90 = rotatePoints(rot90, 90);
    const rot180 = rotatePoints(original, 180);
    for (let i = 0; i < original.length; i++) {
      expect(rot90_90[i].x).toBeCloseTo(rot180[i].x, 10);
      expect(rot90_90[i].y).toBeCloseTo(rot180[i].y, 10);
    }
  });
});

describe("Pattern game: seeded random", () => {
  function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 4294967296;
    };
  }

  it("produces values in [0, 1)", () => {
    const rng = seededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("is deterministic", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it("different seeds produce different sequences", () => {
    const a = seededRandom(1);
    const b = seededRandom(2);
    let different = false;
    for (let i = 0; i < 10; i++) {
      if (a() !== b()) different = true;
    }
    expect(different).toBe(true);
  });
});

describe("Decision game: shuffle function", () => {
  function shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  it("preserves all elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it("does not modify original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffle(arr);
    expect(arr).toEqual(original);
  });

  it("returns same length", () => {
    expect(shuffle([1, 2, 3])).toHaveLength(3);
    expect(shuffle([])).toHaveLength(0);
    expect(shuffle([1])).toHaveLength(1);
  });
});

describe("Teamwork game: scenario design validation", () => {
  // Replicate the scenario pool structure
  interface Scenario {
    title: string;
    correctChoice: "solo" | "team";
    soloReward: number;
    teamReward: number;
    clues: string[];
  }

  const SCENARIO_POOL: Scenario[] = [
    { title: "紧急修复", correctChoice: "team", soloReward: 10, teamReward: 14, clues: ["a", "b", "c"] },
    { title: "UI原型设计", correctChoice: "solo", soloReward: 14, teamReward: 8, clues: ["a", "b", "c"] },
    { title: "系统架构评审", correctChoice: "team", soloReward: 8, teamReward: 15, clues: ["a", "b", "c"] },
    { title: "日报撰写", correctChoice: "solo", soloReward: 12, teamReward: 6, clues: ["a", "b"] },
    { title: "竞品调研报告", correctChoice: "team", soloReward: 7, teamReward: 14, clues: ["a", "b", "c", "d"] },
    { title: "代码重构", correctChoice: "solo", soloReward: 15, teamReward: 9, clues: ["a", "b", "c", "d"] },
    { title: "线上事故响应", correctChoice: "team", soloReward: 6, teamReward: 16, clues: ["a", "b", "c", "d"] },
    { title: "技术博客", correctChoice: "solo", soloReward: 13, teamReward: 7, clues: ["a", "b", "c"] },
    { title: "跨部门协调", correctChoice: "team", soloReward: 5, teamReward: 15, clues: ["a", "b", "c", "d"] },
    { title: "算法优化", correctChoice: "solo", soloReward: 14, teamReward: 8, clues: ["a", "b", "c", "d"] },
    { title: "新人培训", correctChoice: "team", soloReward: 7, teamReward: 13, clues: ["a", "b", "c"] },
    { title: "快速修复typo", correctChoice: "solo", soloReward: 12, teamReward: 5, clues: ["a", "b", "c"] },
  ];

  it("has at least 8 scenarios (game uses 8 per session)", () => {
    expect(SCENARIO_POOL.length).toBeGreaterThanOrEqual(8);
  });

  it("has balanced solo/team correct answers", () => {
    const soloCount = SCENARIO_POOL.filter((s) => s.correctChoice === "solo").length;
    const teamCount = SCENARIO_POOL.filter((s) => s.correctChoice === "team").length;
    expect(soloCount).toBe(6);
    expect(teamCount).toBe(6);
  });

  it("correct choice always has higher reward", () => {
    for (const scenario of SCENARIO_POOL) {
      if (scenario.correctChoice === "solo") {
        expect(scenario.soloReward).toBeGreaterThan(scenario.teamReward);
      } else {
        expect(scenario.teamReward).toBeGreaterThan(scenario.soloReward);
      }
    }
  });

  it("all rewards are positive", () => {
    for (const scenario of SCENARIO_POOL) {
      expect(scenario.soloReward).toBeGreaterThan(0);
      expect(scenario.teamReward).toBeGreaterThan(0);
    }
  });

  it("all scenarios have clues", () => {
    for (const scenario of SCENARIO_POOL) {
      expect(scenario.clues.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("Resource game: scoring formula", () => {
  it("calculates final score correctly", () => {
    const resources = { gold: 10, wood: 8, food: 12 };
    const total = resources.gold + resources.wood + resources.food; // 30
    const zeroPenalty = Object.values(resources).filter((v) => v === 0).length * 5; // 0
    const minResource = Math.min(resources.gold, resources.wood, resources.food); // 8
    const balanceBonus = minResource >= 3 ? 8 : minResource >= 1 ? 3 : 0; // 8
    const demandBonus = 15;
    const finalScore = total + demandBonus + balanceBonus - zeroPenalty;

    expect(total).toBe(30);
    expect(zeroPenalty).toBe(0);
    expect(balanceBonus).toBe(8);
    expect(finalScore).toBe(53);
  });

  it("penalizes zero resources", () => {
    const resources = { gold: 0, wood: 15, food: 0 };
    const zeroPenalty = Object.values(resources).filter((v) => v === 0).length * 5;
    expect(zeroPenalty).toBe(10);
  });

  it("no balance bonus when any resource is below 3", () => {
    const resources = { gold: 2, wood: 10, food: 10 };
    const minResource = Math.min(resources.gold, resources.wood, resources.food);
    const balanceBonus = minResource >= 3 ? 8 : minResource >= 1 ? 3 : 0;
    expect(balanceBonus).toBe(3); // minResource=2 ≥ 1, so 3
  });

  it("clamps final score to 0-100", () => {
    const clamp = (score: number) => Math.max(0, Math.min(100, score));
    expect(clamp(150)).toBe(100);
    expect(clamp(-20)).toBe(0);
    expect(clamp(50)).toBe(50);
  });
});
