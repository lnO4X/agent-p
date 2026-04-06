import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

/**
 * @normSource Corsi block-tapping span, Kessels et al. 2000 meta-analysis: mean=6.0, SD=1.5-2.0
 */
export const memoryScorer: GameScorer = {
  perfectRawScore: 15,
  higherIsBetter: true,
  distribution: {
    mean: 6,
    stdDev: 2,
  },
  normalize(rawScore: number): number {
    // rawScore = max sequence length achieved
    const clamped = Math.max(0, rawScore);
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
