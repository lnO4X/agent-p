import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

/**
 * Perspective Taking scorer.
 *
 * Composite: accuracy * 100 - avgRT * 0.01
 * Higher = better perspective-taking ability.
 *
 * @normSource Michelon & Zacks 2006; Samson et al. 2010. Mean ~65, SD ~18
 */
export const teamworkScorer: GameScorer = {
  perfectRawScore: 100,
  higherIsBetter: true,
  distribution: {
    mean: 65,
    stdDev: 18,
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
