import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

export const resourceScorer: GameScorer = {
  perfectRawScore: 100,
  higherIsBetter: true,
  distribution: {
    mean: 55,
    stdDev: 15,
  },
  normalize(rawScore: number): number {
    // rawScore = composite score (resources + demand bonus + balance bonus - zero penalty)
    // already clamped 0-100 by the game, typical range: 20-90
    const clamped = Math.max(0, Math.min(100, rawScore));
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
