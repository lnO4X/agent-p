import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

/**
 * @normSource Initial estimate based on sensorimotor synchronization literature. Pending calibration
 */
export const rhythmScorer: GameScorer = {
  perfectRawScore: 10,
  higherIsBetter: false, // lower ms deviation = better
  distribution: {
    mean: 80,
    stdDev: 30,
  },
  normalize(rawScore: number): number {
    // rawScore = average timing deviation in ms (lower is better)
    const clamped = Math.max(0, rawScore);
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      false
    );
  },
};
