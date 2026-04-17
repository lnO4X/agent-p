import type { GameScorer } from "@/types/game";
import { percentileNormalize } from "@/lib/scoring";

/**
 * Go/No-Go scorer.
 *
 * Composite: commissionErrors * 50 + meanGoRT * 0.5
 * Lower = better impulse control + faster Go response.
 *
 * @normSource Donders 1869; Logan 1994. Mean composite ~330, SD ~80
 */
export const strategyScorer: GameScorer = {
  perfectRawScore: 100, // 0 errors + 200ms RT → 100
  higherIsBetter: false,
  distribution: {
    mean: 330,
    stdDev: 80,
  },
  normalize(
    rawScore: number,
    _durationMs?: number,
    metadata?: Record<string, unknown>
  ): number {
    const clamped = Math.max(0, rawScore);
    const normalized = percentileNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      false
    );
    const commErrors = metadata?.commissionErrors as number | undefined;
    if (commErrors !== undefined && commErrors > 5) {
      return Math.min(normalized, 25);
    }
    return normalized;
  },
};
