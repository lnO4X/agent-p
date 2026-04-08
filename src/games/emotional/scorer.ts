import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

/**
 * Stroop Task scorer.
 *
 * Primary metric: Stroop Effect = mean RT(incongruent) - mean RT(congruent)
 * Lower = better cognitive control under interference.
 *
 * @normSource Stroop 1935; MacLeod 1991 meta-analysis: mean ~100ms, SD ~40ms
 */
export const emotionalScorer: GameScorer = {
  perfectRawScore: 0,
  higherIsBetter: false,
  distribution: {
    mean: 100,
    stdDev: 40,
  },
  normalize(
    rawScore: number,
    _durationMs?: number,
    metadata?: Record<string, unknown>
  ): number {
    const clamped = Math.max(0, rawScore);
    const accuracy = metadata?.accuracy as number | undefined;
    const normalized = sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      false
    );
    if (accuracy !== undefined && accuracy < 0.7) {
      return Math.min(normalized, 30);
    }
    return normalized;
  },
};
