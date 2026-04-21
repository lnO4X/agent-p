import type { GameScorer } from "@/types/game";
import { percentileNormalize } from "@/lib/scoring";

/**
 * Posner Cueing Task scorer.
 *
 * Primary metric: Validity Effect = mean RT(invalid) - mean RT(valid) in ms.
 * Lower effect = more efficient attention reorienting (better score).
 *
 * @normSource Posner 1980; MacLeod 1991 review; typical healthy-adult
 *   validity effect is 30-60ms (mean ~40, SD ~20).
 */
export const posnerScorer: GameScorer = {
  perfectRawScore: 0, // minimum validity effect (attention perfectly efficient)
  higherIsBetter: false, // lower effect = better
  distribution: {
    mean: 40, // ms
    stdDev: 20,
  },
  normalize(
    rawScore: number,
    _durationMs?: number,
    metadata?: Record<string, unknown>
  ): number {
    // rawScore = validity effect in ms (lower is better)
    // Clamp extreme values. Negative effects can arise from noise but are
    // theoretically unusual; allow a modest negative floor.
    const clamped = Math.max(-50, Math.min(200, rawScore));
    const normalized = percentileNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      false
    );

    // If accuracy < 70%, cap score at 30 (likely guessing)
    const accuracy = metadata?.accuracy as number | undefined;
    if (accuracy !== undefined && accuracy < 0.7) {
      return Math.min(normalized, 30);
    }

    return normalized;
  },
};

export default posnerScorer;
