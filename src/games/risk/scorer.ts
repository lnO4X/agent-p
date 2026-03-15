import type { GameScorer } from "@/types/game";
import { sigmoidNormalize } from "@/lib/scoring";

export const riskScorer: GameScorer = {
  perfectRawScore: 150,
  higherIsBetter: true,
  distribution: {
    mean: 60,
    stdDev: 15,
  },
  normalize(rawScore: number): number {
    // rawScore = total banked points across 10 rounds
    const clamped = Math.max(0, rawScore);
    return sigmoidNormalize(
      clamped,
      this.distribution.mean,
      this.distribution.stdDev,
      true
    );
  },
};
