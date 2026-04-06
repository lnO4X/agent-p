import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

/**
 * @normSource Initial estimate based on pursuit rotor literature. Pending calibration
 */
export const handEyeScorer: GameScorer = {
  perfectRawScore: 100,
  higherIsBetter: true,
  distribution: {
    mean: 60,
    stdDev: 15,
  },
  normalize(rawScore: number): number {
    // rawScore = percentage of time cursor was on target (0-100)
    const clamped = Math.max(0, Math.min(100, rawScore));
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
