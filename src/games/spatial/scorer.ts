import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

export const spatialScorer: GameScorer = {
  perfectRawScore: 12,
  higherIsBetter: true,
  distribution: {
    mean: 7,
    stdDev: 2,
  },
  normalize(rawScore: number): number {
    // rawScore = number of correct answers (0-12)
    const clamped = Math.max(0, Math.min(12, rawScore));
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
