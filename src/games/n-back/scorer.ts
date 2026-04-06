import type { GameScorer } from "@/types/game";
import { percentileNormalize } from "@/lib/scoring";

/**
 * @normSource Owen et al. 2005; Jaeggi et al. 2010
 * 2-back spatial accuracy: mean ~70%, SD ~10-12% for naive subjects.
 * Trained subjects reach 85-95%.
 */
export const nBackScorer: GameScorer = {
  perfectRawScore: 100, // 100% accuracy
  higherIsBetter: true,
  distribution: {
    mean: 70,
    stdDev: 10,
  },
  normalize(rawScore: number): number {
    // rawScore = accuracy percentage (0-100)
    const clamped = Math.max(0, Math.min(100, rawScore));
    return percentileNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
