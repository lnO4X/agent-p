/**
 * Cognitive Science Reference Ranges for the 3 quick-test dimensions.
 * Used on result pages to contextualize user scores.
 *
 * IMPORTANT: These are reference ranges from cognitive science literature,
 * NOT proprietary "pro player test data." The labels below map normalized
 * percentile scores to performance tiers based on published norms.
 *
 * Sources:
 * - Reaction speed: Human Benchmark 81M+ clicks (mean 273ms, SD ~50ms)
 *   → percentile 50 = 273ms, percentile 84 = ~223ms, percentile 98 = ~173ms
 *   → FPS pro reference: <200ms (community data, not lab-verified)
 * - Pattern recognition: No standard norms for this specific task. Pending calibration.
 * - Risk decision: BART literature (Lejuez et al. 2002). Pending calibration for 10-trial version.
 *
 * Miao et al. 2024 meta-analysis finding: Expert vs amateur overall Hedges' g = 0.373
 * Strongest differentiators: spatial cognition (g~0.51), attention/MOT, working memory, task-switching
 * Weakest differentiator: simple reaction time
 */

export interface ProBenchmark {
  dimension: string;
  labelZh: string;
  labelEn: string;
  /** Percentile thresholds (not raw scores) */
  casualAvg: number;  // 50th percentile (population median)
  proMin: number;     // ~85th percentile (top 15%)
  proAvg: number;     // ~93rd percentile (top 7%)
  proElite: number;   // ~98th percentile (top 2%)
}

export const PRO_BENCHMARKS: ProBenchmark[] = [
  {
    dimension: "reaction",
    labelZh: "反应速度",
    labelEn: "Reaction Speed",
    casualAvg: 50,   // 273ms — population median
    proMin: 85,      // ~223ms — top 15%
    proAvg: 93,      // ~193ms — top 7%
    proElite: 98,    // ~173ms — top 2%
  },
  {
    dimension: "pattern",
    labelZh: "模式识别",
    labelEn: "Pattern Recognition",
    casualAvg: 50,   // population median (pending real calibration)
    proMin: 80,      // top 20% (estimated)
    proAvg: 90,      // top 10% (estimated)
    proElite: 97,    // top 3% (estimated)
  },
  {
    dimension: "risk",
    labelZh: "风险决策",
    labelEn: "Risk & Decision",
    casualAvg: 50,   // population median
    proMin: 75,      // top 25% (BART: higher risk-tolerance + consistent banking)
    proAvg: 88,      // top 12% (estimated)
    proElite: 96,    // top 4% (estimated)
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
  colorClass: string;
}

const TIER_INFO: Record<TalentTier, Omit<TalentTierInfo, "tier">> = {
  "pro-elite": {
    labelZh: "顶尖水平",
    labelEn: "Elite",
    colorClass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  "pro-level": {
    labelZh: "高水平",
    labelEn: "High Performer",
    colorClass: "bg-primary/20 text-primary border-primary/30",
  },
  "pro-potential": {
    labelZh: "优秀",
    labelEn: "Strong",
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
 * Compute talent tier from percentile scores.
 * Since scores are now true percentiles (0-100), thresholds map directly.
 */
export function getTalentTier(scores: number[]): TalentTierInfo {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  let tier: TalentTier;
  if (avg >= 95) tier = "pro-elite";       // top 5%
  else if (avg >= 85) tier = "pro-level";  // top 15%
  else if (avg >= 70) tier = "pro-potential"; // top 30%
  else if (avg >= 55) tier = "above-average"; // above median
  else tier = "developing";

  return { tier, ...TIER_INFO[tier] };
}

/**
 * Since scores are now percentiles, rank computation is straightforward.
 * Percentile 72 = rank 2800 out of 10000.
 */
export function getSimulatedRank(
  scores: number[],
  totalPopulation: number = 10000
): { rank: number; percentile: number; totalPopulation: number } {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const percentile = Math.round(Math.max(1, Math.min(99, avg)));
  const rank = Math.max(1, Math.round(totalPopulation * (1 - percentile / 100)));
  return { rank, percentile, totalPopulation };
}

export interface TalentInsight {
  messageZh: string;
  messageEn: string;
  tone: "harsh" | "mixed" | "positive";
}

/**
 * Generate a personalized talent insight based on percentile scores.
 */
export function getTalentInsight(scores: number[]): TalentInsight {
  const bestIdx = scores.indexOf(Math.max(...scores));
  const bestBenchmark = PRO_BENCHMARKS[bestIdx];
  const bestScore = scores[bestIdx];
  const allBelowStrong = scores.every(
    (s, i) => s < PRO_BENCHMARKS[i].proMin
  );

  if (bestScore >= 93) {
    return {
      messageZh: `你的${bestBenchmark.labelZh}在前 7%，这是非常突出的认知能力`,
      messageEn: `Your ${bestBenchmark.labelEn} is in the top 7% — an exceptional cognitive strength`,
      tone: "positive",
    };
  }
  if (bestScore >= 85) {
    return {
      messageZh: `你的${bestBenchmark.labelZh}在前 15%，但其他方面有提升空间`,
      messageEn: `Your ${bestBenchmark.labelEn} is in the top 15%, but other areas have room to grow`,
      tone: "mixed",
    };
  }
  if (allBelowStrong) {
    return {
      messageZh: "你的三项能力都在平均范围——这很正常，大多数人都是这样",
      messageEn: "All three abilities are in the average range — this is normal for most people",
      tone: "harsh",
    };
  }
  return {
    messageZh: "你的认知能力有亮点也有短板，针对性训练可以缩小差距",
    messageEn: "Your cognitive profile has strengths and gaps — targeted training can close the distance",
    tone: "mixed",
  };
}

/**
 * Normal distribution bins (0-10, 10-20, ..., 90-100).
 * Since scores are now true percentiles, these represent the expected
 * uniform distribution of percentile ranks (each bin ≈ 10%).
 * The slight variation models the typical observed distribution shape.
 */
export const DISTRIBUTION_BINS = [3, 7, 12, 17, 22, 20, 12, 5, 2, 1];

export interface ProGapItem {
  dimension: string;
  label: string;
  userScore: number;
  proAvg: number;
  delta: number;
  percentOfPro: number;
}

/**
 * Per-dimension gap analysis comparing user percentile against reference thresholds.
 * i18n: Pure lib function — uses isZh param (no useI18n() available).
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
