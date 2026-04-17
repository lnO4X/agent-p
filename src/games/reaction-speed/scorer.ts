import type { GameScorer } from "@/types/game";
import { percentileNormalize } from "@/lib/scoring";

/**
 * @normSource Human Benchmark 81M+ clicks, median 273ms. Bridges et al. 2020
 */
export const reactionSpeedScorer: GameScorer = {
  perfectRawScore: 150,
  higherIsBetter: false, // lower reaction time is better
  distribution: {
    mean: 273,
    stdDev: 50,
  },
  normalize(rawScore: number): number {
    // rawScore = average reaction time in ms (lower is better)
    // Clamp minimum to prevent cheating
    const clamped = Math.max(100, rawScore);
    return percentileNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      false
    );
  },
};
