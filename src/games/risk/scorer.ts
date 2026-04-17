import type { GameScorer } from "@/types/game";
import { percentileNormalize } from "@/lib/scoring";

/**
 * @normSource Adapted from BART, Lejuez et al. 2002. Scaled for 10-trial version
 */
export const riskScorer: GameScorer = {
  perfectRawScore: 150,
  higherIsBetter: true,
  distribution: {
    mean: 25,
    stdDev: 8,
  },
  normalize(rawScore: number): number {
    // rawScore = total banked points across 10 rounds
    const clamped = Math.max(0, rawScore);
    return percentileNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
