import type { GameScorer } from "@/types/game";
import { percentileNormalize } from "@/lib/scoring";

/**
 * Color-discrimination accuracy scorer ("Find the Odd One").
 *
 * Metric: correct / 15 (ratio of correct identifications across 15 rounds).
 * Distribution: typical adult gets 10-12 correct (~70-80%). The difficulty
 * curve (shrinking lightness delta per round) makes a perfect 15/15 unlikely.
 *
 * Note: this is the Quick-tier entry-funnel game. The Pro tier uses Posner
 * Cueing (src/games/posner/) for a research-grade pattern_recog measure.
 * The mean/SD here is an internal estimate, not a published norm.
 */
export const patternScorer: GameScorer = {
  perfectRawScore: 15,
  higherIsBetter: true,
  distribution: {
    mean: 10.5,
    stdDev: 2.5,
  },
  normalize(rawScore: number): number {
    const clamped = Math.max(0, Math.min(15, rawScore));
    return percentileNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};

export default patternScorer;
