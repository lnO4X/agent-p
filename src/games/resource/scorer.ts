import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

/**
 * UFOV scorer.
 *
 * Primary metric: threshold duration (ms) for ~71% accuracy (staircase convergence).
 * Lower threshold = broader/faster visual attention.
 *
 * @normSource Ball et al. 1988; Edwards et al. 2005. Mean ~150ms, SD ~60ms
 */
export const resourceScorer: GameScorer = {
  perfectRawScore: 30, // 30ms threshold = exceptional
  higherIsBetter: false,
  distribution: {
    mean: 150,
    stdDev: 60,
  },
  normalize(
    rawScore: number,
    _durationMs?: number,
    metadata?: Record<string, unknown>
  ): number {
    const clamped = Math.max(30, rawScore);
    const accuracy = metadata?.accuracy as number | undefined;
    const normalized = sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      false
    );
    if (accuracy !== undefined && accuracy < 0.4) {
      return Math.min(normalized, 20);
    }
    return normalized;
  },
};
