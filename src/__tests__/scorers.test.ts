import { describe, it, expect } from "vitest";

// Import all game scorers
import { reactionSpeedScorer } from "@/games/reaction-speed/scorer";
import { handEyeScorer } from "@/games/hand-eye/scorer";
import { spatialScorer } from "@/games/spatial/scorer";
import { memoryScorer } from "@/games/memory/scorer";
import { strategyScorer } from "@/games/strategy/scorer";
import { rhythmScorer } from "@/games/rhythm/scorer";
import { patternScorer } from "@/games/pattern/scorer";
import { posnerScorer } from "@/games/posner/scorer";
import { multitaskScorer } from "@/games/multitask/scorer";
import { decisionScorer } from "@/games/decision/scorer";
import { emotionalScorer } from "@/games/emotional/scorer";
import { teamworkScorer } from "@/games/teamwork/scorer";
import { riskScorer } from "@/games/risk/scorer";
import { resourceScorer } from "@/games/resource/scorer";

const scorers = [
  { name: "reaction-speed", scorer: reactionSpeedScorer, sampleScores: [150, 250, 300, 400, 600] },
  { name: "hand-eye", scorer: handEyeScorer, sampleScores: [20, 50, 60, 75, 95] },
  { name: "spatial", scorer: spatialScorer, sampleScores: [2, 5, 7, 10, 12] },
  { name: "memory", scorer: memoryScorer, sampleScores: [3, 5, 6, 8, 12] },
  { name: "strategy", scorer: strategyScorer, sampleScores: [10, 30, 50, 75, 95] },
  { name: "rhythm", scorer: rhythmScorer, sampleScores: [80, 60, 30, 20, 10] },
  { name: "pattern", scorer: patternScorer, sampleScores: [0, 5, 10, 12, 15] },
  { name: "posner", scorer: posnerScorer, sampleScores: [0, 20, 40, 60, 100] },
  { name: "multitask", scorer: multitaskScorer, sampleScores: [15, 35, 55, 75, 95] },
  { name: "decision", scorer: decisionScorer, sampleScores: [-30, -10, 0, 12, 30] },
  { name: "emotional", scorer: emotionalScorer, sampleScores: [0.4, 0.7, 0.8, 1.0, 1.15] },
  { name: "teamwork", scorer: teamworkScorer, sampleScores: [20, 50, 75, 100, 130] },
  { name: "risk", scorer: riskScorer, sampleScores: [15, 40, 60, 80, 120] },
  { name: "resource", scorer: resourceScorer, sampleScores: [10, 35, 55, 75, 95] },
];

describe("All game scorers", () => {
  for (const { name, scorer, sampleScores } of scorers) {
    describe(`${name} scorer`, () => {
      it("has valid configuration", () => {
        expect(scorer.perfectRawScore).toBeDefined();
        expect(typeof scorer.higherIsBetter).toBe("boolean");
        expect(scorer.distribution.mean).toBeGreaterThan(0);
        expect(scorer.distribution.stdDev).toBeGreaterThan(0);
      });

      it("returns values between 0 and 100 for all sample scores", () => {
        for (const raw of sampleScores) {
          const normalized = scorer.normalize(raw);
          expect(normalized).toBeGreaterThanOrEqual(0);
          expect(normalized).toBeLessThanOrEqual(100);
        }
      });

      it("returns finite numbers for extreme inputs", () => {
        const extremes = [0, -100, 1000, 0.001, Infinity, -Infinity];
        for (const raw of extremes) {
          const normalized = scorer.normalize(raw);
          if (Number.isFinite(raw)) {
            expect(Number.isFinite(normalized)).toBe(true);
          }
        }
      });

      it("monotonically increases/decreases based on higherIsBetter", () => {
        const sorted = [...sampleScores].sort((a, b) => a - b);
        const normalized = sorted.map((s) => scorer.normalize(s));

        for (let i = 1; i < normalized.length; i++) {
          if (scorer.higherIsBetter) {
            // Higher raw → higher normalized
            expect(normalized[i]).toBeGreaterThanOrEqual(normalized[i - 1]);
          } else {
            // Higher raw → lower normalized (e.g., reaction time)
            expect(normalized[i]).toBeLessThanOrEqual(normalized[i - 1]);
          }
        }
      });

      it("normalizes mean to approximately 50", () => {
        const atMean = scorer.normalize(scorer.distribution.mean);
        expect(atMean).toBeGreaterThan(40);
        expect(atMean).toBeLessThan(60);
      });
    });
  }
});

// Specific scorer edge case tests
describe("Specific scorer edge cases", () => {
  it("reaction-speed: very fast (150ms) scores much higher than slow (600ms)", () => {
    const fast = reactionSpeedScorer.normalize(150);
    const slow = reactionSpeedScorer.normalize(600);
    expect(fast).toBeGreaterThan(70);
    expect(slow).toBeLessThan(30);
  });

  it("rhythm (SMS): excellent 20ms asynchrony lands in top ~20% (>=78th percentile)", () => {
    // Mean 30ms, SD 12ms → 20ms = +0.83 SD above mean (lower is better)
    // Normal CDF(0.83) ≈ 0.797 → 79.7th percentile
    const excellent = rhythmScorer.normalize(20);
    expect(excellent).toBeGreaterThanOrEqual(78);
  });

  it("rhythm (SMS): typical 30ms asynchrony normalizes to ~50th percentile", () => {
    const typical = rhythmScorer.normalize(30);
    expect(typical).toBeGreaterThan(45);
    expect(typical).toBeLessThan(55);
  });

  it("rhythm (SMS): poor 60ms asynchrony lands in bottom ~20% (<=20th percentile)", () => {
    const poor = rhythmScorer.normalize(60);
    expect(poor).toBeLessThanOrEqual(20);
  });

  it("rhythm (SMS): >30% missed beats caps normalized score at 25", () => {
    // Even with perfect 10ms asynchrony on the minority matched, >30% missed
    // means the subject couldn't follow the rhythm. Cap at 25.
    const capped = rhythmScorer.normalize(10, undefined, { missedBeats: 15 });
    expect(capped).toBeLessThanOrEqual(25);
  });

  it("rhythm (SMS): <=30% missed beats does NOT trigger cap", () => {
    // 9 missed (28%) should not cap; 20ms asynchrony stays in the top band.
    const notCapped = rhythmScorer.normalize(20, undefined, { missedBeats: 9 });
    expect(notCapped).toBeGreaterThan(25);
  });

  it("spatial: perfect 12/12 scores very high", () => {
    const perfect = spatialScorer.normalize(12);
    expect(perfect).toBeGreaterThan(85);
  });

  it("memory: sequence length 3 (minimum) scores low", () => {
    const minimum = memoryScorer.normalize(3);
    expect(minimum).toBeLessThan(30);
  });

  it("teamwork: all correct with bonuses (~130) scores very high", () => {
    const excellent = teamworkScorer.normalize(130);
    expect(excellent).toBeGreaterThan(80);
  });

  it("resource: balanced high score (90) normalizes well", () => {
    const good = resourceScorer.normalize(90);
    expect(good).toBeGreaterThan(75);
  });

  it("emotional: ratio of 1.0 (perfectly consistent) normalizes above average", () => {
    const consistent = emotionalScorer.normalize(1.0);
    expect(consistent).toBeGreaterThan(55);
  });

  it("decision (IGT): typical net score +12 normalizes to ~50th percentile", () => {
    const typical = decisionScorer.normalize(12);
    expect(typical).toBeGreaterThan(45);
    expect(typical).toBeLessThan(55);
  });

  it("decision (IGT): strong net score +30 lands in top ~10% (>=85th percentile)", () => {
    const strong = decisionScorer.normalize(30);
    expect(strong).toBeGreaterThanOrEqual(85);
  });

  it("decision (IGT): poor net score -30 lands in bottom ~10% (<=15th percentile)", () => {
    const poor = decisionScorer.normalize(-30);
    expect(poor).toBeLessThanOrEqual(15);
  });

  it("decision (IGT): raw score clamps to [-60, +60]", () => {
    const capHigh = decisionScorer.normalize(500);
    const capHighest = decisionScorer.normalize(60);
    expect(capHigh).toBeCloseTo(capHighest, 1);

    const capLow = decisionScorer.normalize(-500);
    const capLowest = decisionScorer.normalize(-60);
    expect(capLow).toBeCloseTo(capLowest, 1);
  });

  // ---- Pattern (Find the Odd One) — Quick-tier color discrimination ----

  it("pattern (Find the Odd One): typical 10-11/15 correct normalizes near 50th percentile", () => {
    const typical = patternScorer.normalize(10.5);
    expect(typical).toBeGreaterThan(45);
    expect(typical).toBeLessThan(55);
  });

  it("pattern (Find the Odd One): perfect 15/15 scores near the top", () => {
    const perfect = patternScorer.normalize(15);
    expect(perfect).toBeGreaterThan(80);
  });

  it("pattern (Find the Odd One): low 5/15 scores well below average", () => {
    const low = patternScorer.normalize(5);
    expect(low).toBeLessThan(30);
  });

  it("pattern (Find the Odd One): clamps raw scores outside [0, 15]", () => {
    const hiClamp = patternScorer.normalize(500);
    const hiMax = patternScorer.normalize(15);
    expect(hiClamp).toBeCloseTo(hiMax, 1);
    const loClamp = patternScorer.normalize(-10);
    const loMin = patternScorer.normalize(0);
    expect(loClamp).toBeCloseTo(loMin, 1);
  });

  // ---- Posner Cueing Task — Pro-tier attention orienting ----

  it("posner: validity effect of 0ms scores high", () => {
    // A 0ms validity effect means attention reorients instantly — ~2 SDs better than mean.
    const perfect = posnerScorer.normalize(0);
    expect(perfect).toBeGreaterThan(80);
  });

  it("posner: typical 40ms validity effect normalizes to ~50th percentile", () => {
    const typical = posnerScorer.normalize(40);
    expect(typical).toBeGreaterThan(45);
    expect(typical).toBeLessThan(55);
  });

  it("posner: 80ms validity effect (slow reorienting) scores below average", () => {
    const slow = posnerScorer.normalize(80);
    expect(slow).toBeLessThan(30);
  });

  it("posner: low accuracy (<70%) caps score at 30", () => {
    // Even with a perfect 0ms validity effect, <70% accuracy signals guessing.
    const capped = posnerScorer.normalize(0, undefined, { accuracy: 0.5 });
    expect(capped).toBeLessThanOrEqual(30);
  });

  it("posner: good accuracy (>=70%) does NOT trigger the cap", () => {
    const notCapped = posnerScorer.normalize(0, undefined, { accuracy: 0.9 });
    expect(notCapped).toBeGreaterThan(30);
  });
});
