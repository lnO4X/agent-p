import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

export const decisionScorer: GameScorer = {
  perfectRawScore: 3.0,
  higherIsBetter: true,
  distribution: {
    mean: 1.2,
    stdDev: 0.3,
  },
  normalize(rawScore: number): number {
    // rawScore = correct decisions per second (higher is better)
    const clamped = Math.max(0, rawScore);
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
