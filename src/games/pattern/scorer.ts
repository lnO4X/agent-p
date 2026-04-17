import type { GameScorer } from "@/types/game";
import { percentileNormalize } from "@/lib/scoring";

/**
 * @normSource Initial estimate, pending calibration with N>500 user data
 */
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
    return percentileNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
