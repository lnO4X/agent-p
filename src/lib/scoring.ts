import type { TalentCategory, Rank, GenreRecommendation } from "@/types/talent";
import { GENRE_TALENT_MAP } from "./constants";

export function sigmoidNormalize(
  rawScore: number,
  mean: number,
  stdDev: number,
  higherIsBetter: boolean = true
): number {
  if (stdDev <= 0) return rawScore >= mean ? 50 : 50;
  const z = higherIsBetter
    ? (rawScore - mean) / stdDev
    : (mean - rawScore) / stdDev;
  const sigmoid = 100 / (1 + Math.exp(-0.7 * z));
  return Math.round(Math.max(0, Math.min(100, sigmoid)) * 10) / 10;
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
