/**
 * Test Tier System — Quick / Standard / Pro
 *
 * Defines what each tier includes, its limits, and the games involved.
 * Used by quiz entry, session API, chat API, and result pages.
 */

export type TestTier = "quick" | "standard" | "pro";

export interface TierConfig {
  id: TestTier;
  labelEn: string;
  labelZh: string;
  descriptionEn: string;
  descriptionZh: string;
  /** Game IDs included in this tier's test */
  gameIds: string[];
  /** Number of talent dimensions measured */
  dimensions: number;
  /** Estimated time in minutes */
  timeMinutes: number;
  /** Auth required? */
  requiresAuth: boolean;
  /** Payment required? */
  requiresPayment: boolean;
  /** Price in USD (0 = free) */
  priceUsd: number;
  /** Daily test limit */
  dailyTestLimit: number;
  /** Daily coach chat message limit */
  dailyChatLimit: number;
  /** Features included */
  features: {
    radarChart: boolean;
    proComparison: boolean;
    aiCoach: boolean;
    pdfReport: boolean;
    historyTracking: boolean;
    proPlayerComparison: boolean;
  };
}

export const TIER_CONFIGS: Record<TestTier, TierConfig> = {
  quick: {
    id: "quick",
    labelEn: "Quick Test",
    labelZh: "快速测试",
    descriptionEn: "3 mini-games, 3 minutes. Get your talent snapshot.",
    descriptionZh: "3 个小游戏，3 分钟。快速了解你的天赋。",
    gameIds: ["reaction-speed", "pattern", "risk"],
    dimensions: 3,
    timeMinutes: 3,
    requiresAuth: false,
    requiresPayment: false,
    priceUsd: 0,
    dailyTestLimit: 3,
    dailyChatLimit: 0,
    features: {
      radarChart: false,
      proComparison: true,
      aiCoach: false,
      pdfReport: false,
      historyTracking: false,
      proPlayerComparison: true,
    },
  },
  standard: {
    id: "standard",
    labelEn: "Standard Test",
    labelZh: "标准测试",
    descriptionEn: "7 games, 10 minutes. Deeper talent analysis with AI coaching.",
    descriptionZh: "7 个游戏，10 分钟。更深入的天赋分析 + AI 教练。",
    gameIds: [
      "reaction-speed",
      "pattern",
      "risk",
      "hand-eye",
      "memory",
      "strategy",
      "decision",
    ],
    dimensions: 7,
    timeMinutes: 10,
    requiresAuth: true,
    requiresPayment: false,
    priceUsd: 0,
    dailyTestLimit: 5,
    dailyChatLimit: 15,
    features: {
      radarChart: true,
      proComparison: true,
      aiCoach: true,
      pdfReport: false,
      historyTracking: true,
      proPlayerComparison: true,
    },
  },
  pro: {
    id: "pro",
    labelEn: "Pro Assessment",
    labelZh: "专业评估",
    descriptionEn:
      "Full 13-dimension analysis. AI coaching, PDF report, history tracking. For serious competitors and esports clubs.",
    descriptionZh:
      "完整 13 维天赋分析。AI 教练、PDF 报告、历史追踪。面向认真的竞技者和电竞俱乐部。",
    gameIds: [
      "reaction-speed",
      "hand-eye",
      "spatial",
      "memory",
      "strategy",
      "rhythm",
      "pattern",
      "multitask",
      "decision",
      "emotional",
      "teamwork",
      "risk",
      "resource",
    ],
    dimensions: 13,
    timeMinutes: 25,
    requiresAuth: true,
    requiresPayment: true,
    priceUsd: 3.99,
    dailyTestLimit: 20,
    dailyChatLimit: 100,
    features: {
      radarChart: true,
      proComparison: true,
      aiCoach: true,
      pdfReport: true,
      historyTracking: true,
      proPlayerComparison: true,
    },
  },
};

/** Get tier config by ID */
export function getTierConfig(tier: TestTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/** Get the user's effective tier based on their account status */
export function getUserTestTier(userTier: "free" | "premium"): TestTier {
  return userTier === "premium" ? "pro" : "standard";
}

/** Get daily chat limit for a user tier.
 * Registered users = Standard (15/day). Premium = Pro (100/day).
 * Quick (0) is only for anonymous/unregistered — but they can't call /api/chat anyway (requires auth).
 */
export function getChatLimit(
  userTier: "free" | "premium",
  hasReferrals: boolean
): number {
  if (userTier === "premium") return TIER_CONFIGS.pro.dailyChatLimit;
  // All registered users get Standard-level chat (15/day minimum)
  // Referrals don't change chat limit anymore — Standard is the base for all registered users
  return TIER_CONFIGS.standard.dailyChatLimit;
}

/** Get daily test limit for a user tier */
export function getTestLimit(userTier: "free" | "premium"): number {
  return userTier === "premium"
    ? TIER_CONFIGS.pro.dailyTestLimit
    : TIER_CONFIGS.standard.dailyTestLimit;
}
