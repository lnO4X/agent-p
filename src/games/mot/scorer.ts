import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

/**
 * @normSource Pylyshyn & Storm 1988; Meyerhoff et al. 2017 meta-analysis.
 * Accuracy ~65% for 4-target tracking among untrained adults.
 */
export const motScorer: GameScorer = {
  perfectRawScore: 100,
  higherIsBetter: true,
  distribution: {
    mean: 65,
    stdDev: 15,
  },
  normalize(rawScore: number): number {
    // rawScore = average accuracy percentage across all trials (0-100)
    const clamped = Math.max(0, Math.min(100, rawScore));
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
