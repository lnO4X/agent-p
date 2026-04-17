import type { TalentCategory, Rank, GenreRecommendation } from "@/types/talent";
import { GENRE_TALENT_MAP } from "./constants";

/**
 * Percentile-based normalization using the normal CDF (probit).
 * Returns 0-100 where 50 = population median.
 *
 * Unlike the old sigmoid, this maps directly to percentile rank:
 * - Score at mean → 50 (50th percentile)
 * - Score 1 SD above mean → 84.1 (84th percentile)
 * - Score 2 SD above mean → 97.7 (98th percentile)
 *
 * @param rawScore - Raw game score
 * @param mean - Population mean (from published research or N>500 user data)
 * @param stdDev - Population standard deviation
 * @param higherIsBetter - Whether higher raw scores indicate better performance
 */
export function percentileNormalize(
  rawScore: number,
  mean: number,
  stdDev: number,
  higherIsBetter: boolean = true
): number {
  if (stdDev <= 0) return 50;
  const z = higherIsBetter
    ? (rawScore - mean) / stdDev
    : (mean - rawScore) / stdDev;
  // Normal CDF approximation (Abramowitz & Stegun, max error 1.5e-7)
  const percentile = normalCDF(z) * 100;
  return Math.round(Math.max(1, Math.min(99, percentile)) * 10) / 10;
}

/** Standard normal CDF — P(Z ≤ z) */
function normalCDF(z: number): number {
  // Abramowitz & Stegun approximation 26.2.17
  if (z < -8) return 0;
  if (z > 8) return 1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

export function computeTalentScore(
  scores: Array<{ normalizedScore: number; isPrimary: boolean }>
): number {
  if (scores.length === 0) return 0;
  let weightedSum = 0;
  let weightTotal = 0;
  for (const s of scores) {
    const weight = s.isPrimary ? 1.0 : 0.3;
    weightedSum += s.normalizedScore * weight;
    weightTotal += weight;
  }
  return Math.round((weightedSum / weightTotal) * 10) / 10;
}

export function scoreToRank(score: number): Rank {
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 55) return "B";
  if (score >= 35) return "C";
  return "D";
}

export function computeOverallScore(
  talentScores: Partial<Record<TalentCategory, number>>
): number {
  const values = Object.values(talentScores).filter(
    (v): v is number => v != null && v > 0
  );
  if (values.length === 0) return 0;
  return (
    Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
  );
}

export function recommendGenres(
  talentScores: Partial<Record<TalentCategory, number>>,
  topN: number = 5
): GenreRecommendation[] {
  const results = Object.entries(GENRE_TALENT_MAP).map(([genre, config]) => {
    const fitScore = config.requiredTalents.reduce(
      (sum, { category, weight }) => {
        return sum + (talentScores[category] || 0) * weight;
      },
      0
    );
    return {
      genre,
      name: config.name,
      nameZh: config.nameZh,
      fitScore: Math.round(fitScore * 10) / 10,
    };
  });
  return results.sort((a, b) => b.fitScore - a.fitScore).slice(0, topN);
}

export const RANK_COLORS: Record<Rank, string> = {
  S: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  A: "text-teal-400 bg-teal-400/10 border-teal-400/30",
  B: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  C: "text-green-400 bg-green-400/10 border-green-400/30",
  D: "text-gray-400 bg-gray-400/10 border-gray-400/30",
};
