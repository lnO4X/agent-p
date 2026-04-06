import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

/**
 * @normSource Initial estimate. No validated paradigm match. Pending calibration
 */
export const strategyScorer: GameScorer = {
  perfectRawScore: 100,
  higherIsBetter: true,
  distribution: {
    mean: 50,
    stdDev: 20,
  },
  normalize(rawScore: number): number {
    // rawScore = percentage of enemies killed (0-100)
    const clamped = Math.max(0, Math.min(100, rawScore));
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
