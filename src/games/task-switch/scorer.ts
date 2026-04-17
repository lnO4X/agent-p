import type { GameScorer } from "@/types/game";
import { percentileNormalize } from "@/lib/scoring";

/**
 * @normSource Monsell 2003; switch cost ~100-200ms. Kiesel et al. 2010 meta-analysis.
 * Mean switch cost ~150ms for untrained adults.
 */
export const taskSwitchScorer: GameScorer = {
  perfectRawScore: 0, // 0ms switch cost is perfect
  higherIsBetter: false,
  distribution: {
    mean: 150,
    stdDev: 60,
  },
  normalize(rawScore: number): number {
    // rawScore = switch cost in ms (lower is better)
    // Clamp to reasonable range
    const clamped = Math.max(0, Math.min(500, rawScore));
    return percentileNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      false
    );
  },
};
