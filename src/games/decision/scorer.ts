import type { GameScorer } from "@/types/game";
import { percentileNormalize } from "@/lib/scoring";

/**
 * @normSource Initial estimate. Loosely based on WCST response speed literature. Pending calibration
 */
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
    return percentileNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
