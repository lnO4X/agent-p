import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

export const emotionalScorer: GameScorer = {
  perfectRawScore: 1.2,
  higherIsBetter: true,
  distribution: {
    mean: 0.8,
    stdDev: 0.15,
  },
  normalize(rawScore: number): number {
    // rawScore = consistency ratio (final_accuracy / initial_accuracy)
    // A ratio of 1.0 means perfectly consistent under pressure
    // >1.0 means improved, <1.0 means degraded
    const clamped = Math.max(0, Math.min(2, rawScore));
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
