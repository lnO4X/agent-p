import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

/**
 * Dual-Task scorer.
 *
 * Primary metric: Average dual-task accuracy (visual + classify).
 * Higher = better attention allocation.
 *
 * @normSource Pashler 1994; Wickens 2002. Mean ~65%, SD ~15%
 */
export const multitaskScorer: GameScorer = {
  perfectRawScore: 100,
  higherIsBetter: true,
  distribution: {
    mean: 65,
    stdDev: 15,
  },
  normalize(rawScore: number): number {
    const clamped = Math.max(0, Math.min(100, rawScore));
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
