import type { GameScorer } from "@/types/game";
import { percentileNormalize } from "@/lib/scoring";

/**
 * Sensorimotor Synchronization (SMS) tapping task scorer.
 *
 * Paradigm: Subject taps along with an isochronous 120 BPM metronome (500ms
 * inter-onset interval). Raw score = mean absolute asynchrony (ms) between
 * tap onset and the nearest metronome beat across 32 scored taps.
 *
 * Norms: Repp 2005 review; Drake et al. 2000. Healthy adult mean ≈ 30ms,
 * SD ≈ 12ms. Novice musicians can reach 40-60ms. Lower = better
 * synchronization.
 *
 * @normSource Repp 2005 review; Drake et al. 2000
 */
export const rhythmScorer: GameScorer = {
  perfectRawScore: 0,
  higherIsBetter: false, // lower mean absolute asynchrony = better
  distribution: {
    mean: 30,
    stdDev: 12,
  },
  normalize(
    rawScore: number,
    _durationMs?: number,
    metadata?: Record<string, unknown>
  ): number {
    // rawScore = mean absolute asynchrony in ms (lower is better)
    // Clamp to plausible range: floor 5ms (below = hardware/timing noise),
    // ceil 150ms (above = effectively random tapping)
    const clamped = Math.max(5, Math.min(150, rawScore));
    const missedBeats = typeof metadata?.missedBeats === "number"
      ? metadata.missedBeats
      : 0;
    const missedRatio = missedBeats / 32;

    // If >30% of scored beats were missed (no tap within window), the subject
    // failed to follow the rhythm — cap the normalized score at 25 to reflect
    // that timing accuracy on the minority of taps is not representative.
    if (missedRatio > 0.3) {
      return Math.min(
        25,
        percentileNormalize(clamped, this.distribution.mean, this.distribution.stdDev, false)
      );
    }

    return percentileNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      false
    );
  },
};

export default rhythmScorer;
