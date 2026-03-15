import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

export const multitaskScorer: GameScorer = {
  perfectRawScore: 100,
  higherIsBetter: true,
  distribution: {
    mean: 55,
    stdDev: 15,
  },
  normalize(rawScore: number): number {
    // rawScore = weighted score (catch% * 0.5 + math_accuracy% * 0.5), 0-100
    const clamped = Math.max(0, Math.min(100, rawScore));
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
