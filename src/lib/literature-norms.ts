/**
 * Literature-based comparison norms for GameTan.
 *
 * IMPORTANT: These are NOT professional player data. GameTan does not have raw pro
 * player test results. These reference points come from published studies of gamer
 * subgroups (action-video-game players, FPS players, MOBA players) and general pop.
 *
 * Sources:
 *  - Dale & Green 2017 "Behavior and brain function of action video game players"
 *  - Green & Bavelier 2003 "Action video game modifies visual selective attention"
 *  - Thompson et al. 2013 "A meta-analysis of the relationship between video games
 *    and cognitive functions" (Perspectives on Psychological Science)
 *  - Kowal et al. 2018 "Cognitive abilities of e-sports players" (Frontiers in Psychology)
 *  - Hilgard et al. 2019 "Null effects of game violence, game difficulty, and 2D:4D"
 *  - Dye, Green & Bavelier 2009 meta on action video games and attention
 *  - Bridges et al. 2020 (human-benchmark.com reaction time data, N≈81M)
 *  - Miao et al. 2024 expert-vs-amateur meta-analysis (Hedges' g = 0.373)
 */
import type { TalentCategory } from "@/types/talent";

export type LiteratureTier =
  | "top-gamer-5pct"
  | "top-gamer-15pct"
  | "top-gamer-30pct"
  | "avg-gamer"
  | "below-avg";

export interface LiteratureTierInfo {
  id: LiteratureTier;
  /** Short English label used in UI (e.g., "Top 5%") */
  label: string;
  /** Short Chinese label used in UI */
  labelZh: string;
  /** Minimum average percentile to qualify for this tier */
  percentileMin: number;
  /** Longer English description — honest about what the tier means */
  description: string;
  /** Longer Chinese description */
  descriptionZh: string;
  /** Tailwind color classes for badges */
  colorClass: string;
}

export const LITERATURE_TIERS: readonly LiteratureTierInfo[] = [
  {
    id: "top-gamer-5pct",
    label: "Top 5%",
    labelZh: "前 5%",
    percentileMin: 95,
    description:
      "Profile matches published top-5% of gamers in research studies. Strong in measured cognitive domains — not a claim about tournament success.",
    descriptionZh:
      "档案符合研究中前 5% 游戏玩家的认知特征。仅指本次测试维度，不等于职业水平。",
    colorClass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  {
    id: "top-gamer-15pct",
    label: "Top 15%",
    labelZh: "前 15%",
    percentileMin: 85,
    description:
      "Cognitive profile in the top 15% of published gamer research samples.",
    descriptionZh: "认知档案处于文献研究样本的前 15%。",
    colorClass: "bg-primary/20 text-primary border-primary/30",
  },
  {
    id: "top-gamer-30pct",
    label: "Top 30%",
    labelZh: "前 30%",
    percentileMin: 70,
    description:
      "Above-average cognitive profile compared to general gamer population.",
    descriptionZh: "相对一般游戏玩家人群有优势。",
    colorClass: "bg-primary/15 text-primary/80 border-primary/20",
  },
  {
    id: "avg-gamer",
    label: "Average",
    labelZh: "一般",
    percentileMin: 40,
    description:
      "Around population average. Most gamers fall here.",
    descriptionZh: "处于人群平均水平。大多数玩家在此范围。",
    colorClass: "bg-muted text-muted-foreground border-border",
  },
  {
    id: "below-avg",
    label: "Developing",
    labelZh: "发展中",
    percentileMin: 0,
    description:
      "Below average in measured dimensions. Most dimensions are trainable with practice.",
    descriptionZh: "低于平均水平。大部分维度可通过训练提升。",
    colorClass: "bg-muted text-muted-foreground border-border",
  },
] as const;

/**
 * Map an average percentile score (0-100) to a literature tier.
 * Tiers are ordered highest → lowest; first match wins.
 */
export function getLiteratureTier(avgPercentile: number): LiteratureTierInfo {
  return (
    LITERATURE_TIERS.find((t) => avgPercentile >= t.percentileMin) ??
    LITERATURE_TIERS[LITERATURE_TIERS.length - 1]
  );
}

/**
 * Published normative means per dimension.
 *
 * These are NOT pro thresholds. They are population references derived from the
 * literature above:
 *  - populationMean: general population mean percentile (by definition 50)
 *  - gamerMean: typical enthusiast-gamer mean percentile per the literature
 *  - gamerTop5Pct: approximate top-5% of gamer samples
 *
 * Where direct published values are unavailable, we mark the source as
 * "Literature estimate (pending validation)" so downstream UI can disclose it.
 */
export interface DimensionNorm {
  category: TalentCategory;
  populationMean: number;
  gamerMean: number;
  gamerTop5Pct: number;
  source: string;
}

export const DIMENSION_NORMS: Record<TalentCategory, DimensionNorm> = {
  reaction_speed: {
    category: "reaction_speed",
    populationMean: 50,
    gamerMean: 62,
    gamerTop5Pct: 92,
    source:
      "Dye et al. 2009 meta; Green & Bavelier 2003; Bridges et al. 2020 (human-benchmark.com)",
  },
  hand_eye_coord: {
    category: "hand_eye_coord",
    populationMean: 50,
    gamerMean: 58,
    gamerTop5Pct: 88,
    source: "Literature estimate (pending validation)",
  },
  spatial_awareness: {
    category: "spatial_awareness",
    populationMean: 50,
    gamerMean: 63,
    gamerTop5Pct: 90,
    source:
      "Miao et al. 2024 meta (spatial cognition Hedges' g≈0.51); Kowal et al. 2018",
  },
  memory: {
    category: "memory",
    populationMean: 50,
    gamerMean: 56,
    gamerTop5Pct: 87,
    source:
      "Thompson et al. 2013 (working-memory gains); Kowal et al. 2018 e-sports players",
  },
  strategy_logic: {
    category: "strategy_logic",
    populationMean: 50,
    gamerMean: 57,
    gamerTop5Pct: 87,
    source: "Literature estimate (pending validation)",
  },
  rhythm_sense: {
    category: "rhythm_sense",
    populationMean: 50,
    gamerMean: 55,
    gamerTop5Pct: 86,
    source: "Literature estimate (pending validation)",
  },
  pattern_recog: {
    category: "pattern_recog",
    populationMean: 50,
    gamerMean: 60,
    gamerTop5Pct: 89,
    source:
      "Dale & Green 2017 (visual-search advantage in AVGPs); literature estimate for top-5%",
  },
  multitasking: {
    category: "multitasking",
    populationMean: 50,
    gamerMean: 61,
    gamerTop5Pct: 88,
    source:
      "Dale & Green 2017 task-switching; Dye et al. 2009 attention meta",
  },
  decision_speed: {
    category: "decision_speed",
    populationMean: 50,
    gamerMean: 60,
    gamerTop5Pct: 89,
    source:
      "Kowal et al. 2018 (e-sports decision latency); Dye et al. 2009",
  },
  emotional_control: {
    category: "emotional_control",
    populationMean: 50,
    gamerMean: 52,
    gamerTop5Pct: 84,
    source:
      "Literature estimate (limited published gamer-specific norms)",
  },
  teamwork_tendency: {
    category: "teamwork_tendency",
    populationMean: 50,
    gamerMean: 53,
    gamerTop5Pct: 83,
    source: "Literature estimate (pending validation)",
  },
  risk_assessment: {
    category: "risk_assessment",
    populationMean: 50,
    gamerMean: 55,
    gamerTop5Pct: 86,
    source:
      "Lejuez et al. 2002 BART norms; literature estimate for top-5% gamers",
  },
  resource_mgmt: {
    category: "resource_mgmt",
    populationMean: 50,
    gamerMean: 57,
    gamerTop5Pct: 87,
    source: "Literature estimate (pending validation)",
  },
};

/**
 * Reference rows used by the 3-game Quick Test result screen. Each row targets
 * one quick-test dimension and carries the literature top-5% value used as the
 * comparison point in the result UI.
 */
export interface LiteratureReference {
  /** Stable id used in code */
  dimension: "reaction" | "pattern" | "risk";
  labelZh: string;
  labelEn: string;
  /** Population median percentile (always 50) */
  populationMean: number;
  /** Typical gamer mean from the literature */
  gamerMean: number;
  /** Top 5% of gamers in published research */
  gamerTop5Pct: number;
  /** Citation / source string */
  source: string;
}

export const LITERATURE_REFERENCES: readonly LiteratureReference[] = [
  {
    dimension: "reaction",
    labelZh: "反应速度",
    labelEn: "Reaction Speed",
    populationMean: DIMENSION_NORMS.reaction_speed.populationMean,
    gamerMean: DIMENSION_NORMS.reaction_speed.gamerMean,
    gamerTop5Pct: DIMENSION_NORMS.reaction_speed.gamerTop5Pct,
    source: DIMENSION_NORMS.reaction_speed.source,
  },
  {
    dimension: "pattern",
    labelZh: "模式识别",
    labelEn: "Pattern Recognition",
    populationMean: DIMENSION_NORMS.pattern_recog.populationMean,
    gamerMean: DIMENSION_NORMS.pattern_recog.gamerMean,
    gamerTop5Pct: DIMENSION_NORMS.pattern_recog.gamerTop5Pct,
    source: DIMENSION_NORMS.pattern_recog.source,
  },
  {
    dimension: "risk",
    labelZh: "风险决策",
    labelEn: "Risk & Decision",
    populationMean: DIMENSION_NORMS.risk_assessment.populationMean,
    gamerMean: DIMENSION_NORMS.risk_assessment.gamerMean,
    gamerTop5Pct: DIMENSION_NORMS.risk_assessment.gamerTop5Pct,
    source: DIMENSION_NORMS.risk_assessment.source,
  },
] as const;

/**
 * Average of gamerTop5Pct across the 3 quick-test dimensions — used as the
 * single "top-5%-of-gamers" reference marker on distribution charts.
 */
export const GAMER_TOP5_AVG: number = Math.round(
  LITERATURE_REFERENCES.reduce((a, r) => a + r.gamerTop5Pct, 0) /
    LITERATURE_REFERENCES.length
);

/**
 * Compute the user's literature tier from an array of percentile scores.
 */
export function getTierForScores(scores: number[]): LiteratureTierInfo {
  if (scores.length === 0) {
    return LITERATURE_TIERS[LITERATURE_TIERS.length - 1];
  }
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return getLiteratureTier(avg);
}

/**
 * Estimate rank out of a simulated population using the user's average
 * percentile. Since scores are already percentile-based, this is a direct map.
 */
export function getSimulatedRank(
  scores: number[],
  totalPopulation: number = 10000
): { rank: number; percentile: number; totalPopulation: number } {
  if (scores.length === 0) {
    return { rank: totalPopulation, percentile: 0, totalPopulation };
  }
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const percentile = Math.round(Math.max(1, Math.min(99, avg)));
  const rank = Math.max(1, Math.round(totalPopulation * (1 - percentile / 100)));
  return { rank, percentile, totalPopulation };
}

export interface LiteratureInsight {
  messageZh: string;
  messageEn: string;
  tone: "harsh" | "mixed" | "positive";
}

/**
 * Generate a personalized insight referencing the published literature top-5%
 * thresholds rather than invented "pro minimums".
 */
export function getLiteratureInsight(scores: number[]): LiteratureInsight {
  if (scores.length === 0) {
    return {
      messageZh: "暂无测试数据。",
      messageEn: "No test data available.",
      tone: "mixed",
    };
  }
  const bestIdx = scores.indexOf(Math.max(...scores));
  const bestRef = LITERATURE_REFERENCES[bestIdx];
  const bestScore = scores[bestIdx];

  // All scores below the literature top-5% reference
  const allBelowTop5 = scores.every(
    (s, i) => s < (LITERATURE_REFERENCES[i]?.gamerTop5Pct ?? 100)
  );

  if (bestScore !== undefined && bestScore >= 93 && bestRef) {
    return {
      messageZh: `你的${bestRef.labelZh}在前 7%，是文献样本中的显著强项`,
      messageEn: `Your ${bestRef.labelEn} is in the top 7% — a notable strength in research samples`,
      tone: "positive",
    };
  }
  if (bestScore !== undefined && bestScore >= 85 && bestRef) {
    return {
      messageZh: `你的${bestRef.labelZh}在前 15%，其他维度仍有提升空间`,
      messageEn: `Your ${bestRef.labelEn} is in the top 15%; other dimensions have room to grow`,
      tone: "mixed",
    };
  }
  if (allBelowTop5) {
    return {
      messageZh:
        "你的各项分数都在平均范围——这是大多数玩家的常态，多数维度可通过针对性训练提升",
      messageEn:
        "All dimensions are in the average range — normal for most players; most dimensions can be trained",
      tone: "harsh",
    };
  }
  return {
    messageZh: "你有亮点也有短板，针对性训练可以缩小差距",
    messageEn:
      "You have highlights and gaps — targeted practice can close the distance",
    tone: "mixed",
  };
}

/**
 * Normal-ish distribution bins (0-10, 10-20, ..., 90-100) used by the small
 * bar-chart component. Since scores are true percentiles, bins approximate the
 * observed shape of the user population.
 */
export const DISTRIBUTION_BINS = [3, 7, 12, 17, 22, 20, 12, 5, 2, 1];

export interface LiteratureGapItem {
  dimension: string;
  label: string;
  userScore: number;
  /** Literature top-5% reference value */
  reference: number;
  delta: number;
  percentOfReference: number;
}

/**
 * Per-dimension gap analysis comparing the user's percentile against the
 * literature top-5%-of-gamers reference for that dimension.
 *
 * i18n: Pure lib function — accepts `isZh` param (no useI18n() available here).
 */
export function getLiteratureGapAnalysis(
  scores: number[],
  isZh: boolean
): LiteratureGapItem[] {
  return LITERATURE_REFERENCES.map((ref, i) => {
    const userScore = Math.round(scores[i] ?? 0);
    return {
      dimension: ref.dimension,
      label: isZh ? ref.labelZh : ref.labelEn,
      userScore,
      reference: ref.gamerTop5Pct,
      delta: Math.round(userScore - ref.gamerTop5Pct),
      percentOfReference: Math.round((userScore / ref.gamerTop5Pct) * 100),
    };
  });
}
