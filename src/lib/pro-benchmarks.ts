/**
 * Pro Player Benchmark Data — estimated ranges for the 3 quick-test dimensions.
 * Used on result pages to show how users compare against professional esports players.
 *
 * Calibration basis:
 * - Reaction speed proAvg=82 corresponds to ~180ms on our sigmoid scale (known FPS pro range)
 * - Pattern recognition and risk decision calibrated proportionally
 * - Data labeled as "estimated benchmarks" — can be replaced with real test data later
 */

export interface ProBenchmark {
  dimension: string;
  labelZh: string;
  labelEn: string;
  casualAvg: number;  // normalized 0-100: average casual gamer
  proMin: number;     // normalized: bottom of pro range
  proAvg: number;     // normalized: average pro player
  proElite: number;   // normalized: top 1% pro
}

export const PRO_BENCHMARKS: ProBenchmark[] = [
  {
    dimension: "reaction",
    labelZh: "反应速度",
    labelEn: "Reaction Speed",
    casualAvg: 45,
    proMin: 72,
    proAvg: 82,
    proElite: 95,
  },
  {
    dimension: "pattern",
    labelZh: "模式识别",
    labelEn: "Pattern Recognition",
    casualAvg: 48,
    proMin: 68,
    proAvg: 78,
    proElite: 92,
  },
  {
    dimension: "risk",
    labelZh: "风险决策",
    labelEn: "Risk & Decision",
    casualAvg: 42,
    proMin: 65,
    proAvg: 75,
    proElite: 90,
  },
];

export type TalentTier =
  | "pro-elite"
  | "pro-level"
  | "pro-potential"
  | "above-average"
  | "developing";

export interface TalentTierInfo {
  tier: TalentTier;
  labelZh: string;
  labelEn: string;
  colorClass: string; // tailwind classes for badge styling
}

const TIER_INFO: Record<TalentTier, Omit<TalentTierInfo, "tier">> = {
  "pro-elite": {
    labelZh: "职业精英",
    labelEn: "Pro Elite",
    colorClass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  "pro-level": {
    labelZh: "职业水平",
    labelEn: "Pro Level",
    colorClass: "bg-primary/20 text-primary border-primary/30",
  },
  "pro-potential": {
    labelZh: "职业潜力",
    labelEn: "Pro Potential",
    colorClass: "bg-primary/15 text-primary/80 border-primary/20",
  },
  "above-average": {
    labelZh: "高于平均",
    labelEn: "Above Average",
    colorClass: "bg-muted text-muted-foreground border-border",
  },
  developing: {
    labelZh: "成长中",
    labelEn: "Developing",
    colorClass: "bg-muted text-muted-foreground border-border",
  },
};

/**
 * Compute talent tier from 3 quick-test scores (each 0-100).
 * Order: [reaction, pattern, risk]
 */
export function getTalentTier(scores: number[]): TalentTierInfo {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Use the average of proElite/proAvg/proMin across dimensions
  const avgProElite =
    PRO_BENCHMARKS.reduce((a, b) => a + b.proElite, 0) / PRO_BENCHMARKS.length;
  const avgProAvg =
    PRO_BENCHMARKS.reduce((a, b) => a + b.proAvg, 0) / PRO_BENCHMARKS.length;
  const avgProMin =
    PRO_BENCHMARKS.reduce((a, b) => a + b.proMin, 0) / PRO_BENCHMARKS.length;
  const avgCasual =
    PRO_BENCHMARKS.reduce((a, b) => a + b.casualAvg, 0) / PRO_BENCHMARKS.length;

  let tier: TalentTier;
  if (avg >= avgProElite) tier = "pro-elite";
  else if (avg >= avgProAvg) tier = "pro-level";
  else if (avg >= avgProMin) tier = "pro-potential";
  else if (avg >= avgCasual + 10) tier = "above-average";
  else tier = "developing";

  return { tier, ...TIER_INFO[tier] };
}

/**
 * Simulated normal distribution bins (0-10, 10-20, ..., 90-100).
 * Sigmoid scoring produces a near-normal distribution; these percentages
 * model ~10k players. Replace with real data once sufficient volume exists.
 */
export const DISTRIBUTION_BINS = [2, 5, 10, 18, 25, 22, 12, 4, 1.5, 0.5];

/**
 * Estimate a user's rank in a simulated population based on their average score.
 * Uses the distribution bins to compute a CDF-style percentile.
 */
export function getSimulatedRank(
  scores: number[],
  totalPopulation: number = 10000
): { rank: number; percentile: number; totalPopulation: number } {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const binIndex = Math.min(Math.floor(avg / 10), 9);

  // Sum all bins below + fraction of current bin
  let belowPct = 0;
  for (let i = 0; i < binIndex; i++) belowPct += DISTRIBUTION_BINS[i];
  const fractionInBin = (avg - binIndex * 10) / 10;
  belowPct += DISTRIBUTION_BINS[binIndex] * fractionInBin;

  const percentile = Math.round(belowPct);
  const rank = Math.max(1, Math.round(totalPopulation * (1 - belowPct / 100)));
  return { rank, percentile, totalPopulation };
}

export interface TalentInsight {
  messageZh: string;
  messageEn: string;
  tone: "harsh" | "mixed" | "positive";
}

/**
 * Generate a personalized "talent truth" insight based on per-dimension comparison.
 */
export function getTalentInsight(scores: number[]): TalentInsight {
  const bestIdx = scores.indexOf(Math.max(...scores));
  const bestBenchmark = PRO_BENCHMARKS[bestIdx];
  const bestScore = scores[bestIdx];
  const allBelowProMin = scores.every(
    (s, i) => s < PRO_BENCHMARKS[i].proMin
  );
  const bestAboveProAvg = bestScore >= bestBenchmark.proAvg;
  const bestAboveProMin = bestScore >= bestBenchmark.proMin;

  if (bestAboveProAvg) {
    return {
      messageZh: `你的${bestBenchmark.labelZh}已达到职业平均水平，这非常罕见`,
      messageEn: `Your ${bestBenchmark.labelEn} has reached pro average — this is exceptionally rare`,
      tone: "positive",
    };
  }
  if (bestAboveProMin) {
    return {
      messageZh: `你的${bestBenchmark.labelZh}有职业潜力，但其他方面拖了后腿`,
      messageEn: `Your ${bestBenchmark.labelEn} shows pro potential, but other areas are holding you back`,
      tone: "mixed",
    };
  }
  if (allBelowProMin) {
    return {
      messageZh: "你的三项天赋都未达到职业门槛——这很正常，99% 的人都是这样",
      messageEn: "All three talents are below the pro threshold — this is normal, 99% of people are the same",
      tone: "harsh",
    };
  }
  return {
    messageZh: "你的天赋有亮点也有短板，精准训练可以缩小差距",
    messageEn: "Your talent has strengths and gaps — targeted training can close the distance",
    tone: "mixed",
  };
}

export interface ProGapItem {
  dimension: string;
  label: string;
  userScore: number;
  proAvg: number;
  delta: number; // positive = above pro, negative = below
  percentOfPro: number; // user score as % of proAvg
}

/**
 * Per-dimension gap analysis comparing user scores against pro averages.
 * Order: [reaction, pattern, risk]
 */
export function getProGapAnalysis(
  scores: number[],
  isZh: boolean
): ProGapItem[] {
  return PRO_BENCHMARKS.map((b, i) => ({
    dimension: b.dimension,
    label: isZh ? b.labelZh : b.labelEn,
    userScore: Math.round(scores[i] ?? 0),
    proAvg: b.proAvg,
    delta: Math.round((scores[i] ?? 0) - b.proAvg),
    percentOfPro: Math.round(((scores[i] ?? 0) / b.proAvg) * 100),
  }));
}
