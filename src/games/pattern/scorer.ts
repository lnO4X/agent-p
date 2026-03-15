import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

export const patternScorer: GameScorer = {
  perfectRawScore: 15,
  higherIsBetter: true,
  distribution: {
    mean: 10,
    stdDev: 3,
  },
  normalize(rawScore: number): number {
    // rawScore = number of correct answers (0-15)
    const clamped = Math.max(0, Math.min(15, rawScore));
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
