import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

export const reactionSpeedScorer: GameScorer = {
  perfectRawScore: 150,
  higherIsBetter: false, // lower reaction time is better
  distribution: {
    mean: 300,
    stdDev: 80,
  },
  normalize(rawScore: number): number {
    // rawScore = average reaction time in ms (lower is better)
    // Clamp minimum to prevent cheating
    const clamped = Math.max(100, rawScore);
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      false
    );
  },
};
