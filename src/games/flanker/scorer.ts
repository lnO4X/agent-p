import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

/**
 * Flanker Effect scorer.
 *
 * Primary metric: Flanker Effect = mean RT(incongruent) - mean RT(congruent)
 * Lower flanker effect = better interference control.
 *
 * @normSource Eriksen & Eriksen 1974; modern replications: mean ~65ms, SD ~25ms
 */
export const flankerScorer: GameScorer = {
  perfectRawScore: 0, // 0ms flanker effect is perfect
  higherIsBetter: false, // lower flanker effect = better
  distribution: {
    mean: 65,
    stdDev: 25,
  },
  normalize(
    rawScore: number,
    _durationMs?: number,
    metadata?: Record<string, unknown>
  ): number {
    // rawScore = flanker effect in ms (lower is better)
    // Clamp to non-negative — negative flanker effect is theoretically impossible
    // but can occur from noise; treat as 0
    const clamped = Math.max(0, rawScore);

    // Penalize low accuracy: if accuracy < 70%, cap normalized score at 30
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
