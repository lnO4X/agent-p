import type { GameScorer } from "@/types/game";
import { percentileNormalize } from "@/lib/scoring";

/**
 * Iowa Gambling Task (IGT) scorer.
 *
 * Metric: Net Score = (C+D advantageous picks) - (A+B disadvantageous picks)
 * computed over the last 60 scored trials (trials 41-100 of 100 total, after
 * a 10-trial practice phase; equivalent to IGT blocks 3-5).
 *
 * Source: Bechara, Damasio, Damasio & Anderson (1994) "Insensitivity to future
 * consequences following damage to human prefrontal cortex". Cognition 50:7-15.
 * Bechara (2001) "Neurobiology of decision-making: risk and reward".
 *
 * Healthy adult control norms (Bechara 2001, later replications):
 *   - Mean net score ≈ +10 to +20 over the final blocks
 *   - SD ≈ 15
 *   - Higher = learned to choose advantageous decks (better decision-making
 *     under uncertainty with delayed feedback)
 *   - Negative = stuck on disadvantageous (high-reward high-loss) decks
 */
export const decisionScorer: GameScorer = {
  perfectRawScore: 60, // all 60 scored trials picked advantageous decks
  higherIsBetter: true,
  distribution: {
    mean: 12,
    stdDev: 15,
  },
  normalize(rawScore: number): number {
    // rawScore = net score over last 60 scored trials, range [-60, +60]
    const clamped = Math.max(-60, Math.min(60, rawScore));
    return percentileNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
