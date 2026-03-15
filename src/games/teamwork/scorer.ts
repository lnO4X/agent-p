import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

export const teamworkScorer: GameScorer = {
  perfectRawScore: 140,
  higherIsBetter: true,
  distribution: {
    mean: 75,
    stdDev: 22,
  },
  normalize(rawScore: number): number {
    // rawScore = total points from 8 rounds of clue-based decisions
    // correct = full reward (5-16) + time bonus (0-3), wrong = 30% reward
    // typical range: 30 (poor) - 136 (perfect), average ~75
    const clamped = Math.max(0, rawScore);
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
