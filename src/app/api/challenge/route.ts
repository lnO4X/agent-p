import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { microChallenges, talentProfiles, users } from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";
import { gameRegistry } from "@/games";
import { TALENT_CATEGORIES, type TalentCategory } from "@/types/talent";
import { scoreToRank, computeOverallScore } from "@/lib/scoring";
import { getArchetype } from "@/lib/archetype";

/** Streak milestone → premium reward days */
const STREAK_REWARDS: Record<number, number> = {
  7: 1,
  14: 3,
  30: 7,
  60: 14,
  100: 30,
};

// Map talent category → talentProfiles column name
const TALENT_COLUMN_MAP: Record<TalentCategory, string> = {
  reaction_speed: "reactionSpeed",
  hand_eye_coord: "handEyeCoord",
  spatial_awareness: "spatialAwareness",
  memory: "memory",
  strategy_logic: "strategyLogic",
  rhythm_sense: "rhythmSense",
  pattern_recog: "patternRecog",
  multitasking: "multitasking",
  decision_speed: "decisionSpeed",
  emotional_control: "emotionalControl",
  teamwork_tendency: "teamworkTendency",
  risk_assessment: "riskAssessment",
  resource_mgmt: "resourceMgmt",
};

/** Deterministic daily challenge: cycle through 13 talent categories by day-of-year */
function getTodayChallengeIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return dayOfYear % TALENT_CATEGORIES.length;
}

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── GET: Today's challenge info ───
export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    const challengeIndex = getTodayChallengeIndex();
    let targetCategory = TALENT_CATEGORIES[challengeIndex];

    // Bias toward user's weak talent if they have an archetype.
    // Use day-of-year mod 5: if remainder < 2 (40% of days), target weak talent.
    const latestProfileForBias = await db
      .select({ archetypeId: talentProfiles.archetypeId })
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, auth.sub))
      .orderBy(desc(talentProfiles.createdAt))
      .limit(1);

    if (latestProfileForBias.length > 0 && latestProfileForBias[0].archetypeId) {
      const archetype = getArchetype(latestProfileForBias[0].archetypeId);
      if (archetype) {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
        if (dayOfYear % 5 < 2) {
          targetCategory = archetype.weakTalent;
        }
      }
    }

    // Find the primary game for this talent category
    const allGames = gameRegistry.getAll();
    const game = allGames.find((g) => g.primaryTalent === targetCategory);
    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "今日挑战不可用" },
        },
        { status: 404 }
      );
    }

    // Check if already completed today
    const today = todayMidnight();
    const todayChallenge = await db
      .select()
      .from(microChallenges)
      .where(
        and(
          eq(microChallenges.userId, auth.sub),
          eq(microChallenges.gameId, game.id),
          gte(microChallenges.completedAt, today)
        )
      )
      .limit(1);

    const completedToday = todayChallenge.length > 0;

    // Recent history for this talent (last 8 entries, oldest first for chart)
    const history = await db
      .select({
        score: microChallenges.score,
        completedAt: microChallenges.completedAt,
      })
      .from(microChallenges)
      .where(
        and(
          eq(microChallenges.userId, auth.sub),
          eq(microChallenges.talentCategory, targetCategory)
        )
      )
      .orderBy(desc(microChallenges.completedAt))
      .limit(8);

    // Calculate streak: consecutive days with any challenge completed
    const recentDays = await db
      .select({
        day: sql<string>`DATE(${microChallenges.completedAt})`,
      })
      .from(microChallenges)
      .where(eq(microChallenges.userId, auth.sub))
      .orderBy(desc(microChallenges.completedAt))
      .limit(90);

    const uniqueDays = [...new Set(recentDays.map((r) => r.day))];
    let streak = 0;
    const checkDate = new Date();
    // If today not yet completed, start checking from yesterday
    const todayStr = checkDate.toISOString().split("T")[0];
    if (!uniqueDays.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    for (let i = 0; i < 90; i++) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (uniqueDays.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Current talent profile score for this category
    const latestProfile = await db
      .select()
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, auth.sub))
      .orderBy(desc(talentProfiles.createdAt))
      .limit(1);

    const columnKey = TALENT_COLUMN_MAP[
      targetCategory
    ] as keyof (typeof talentProfiles)["$inferSelect"];
    const currentScore =
      latestProfile.length > 0
        ? ((latestProfile[0][columnKey] as number | null) ?? null)
        : null;

    // Total challenges completed
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(microChallenges)
      .where(eq(microChallenges.userId, auth.sub));
    const totalCompleted = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        game: {
          id: game.id,
          name: game.name,
          nameEn: game.nameEn,
          description: game.description,
          primaryTalent: game.primaryTalent,
          difficulty: game.difficulty,
          estimatedDurationSec: game.estimatedDurationSec,
          instructions: game.instructions,
          icon: game.icon,
          mobileCompatible: game.mobileCompatible !== false,
        },
        talentCategory: targetCategory,
        completedToday,
        todayScore: completedToday ? todayChallenge[0].score : null,
        currentTalentScore: currentScore,
        history: history.reverse(), // oldest first for chart
        streak,
        totalCompleted,
      },
    });
  } catch (error) {
    console.error("Get challenge error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "获取挑战失败" },
      },
      { status: 500 }
    );
  }
}

// ─── POST: Submit challenge score ───
export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gameId, rawScore, durationMs, metadata } = body;

    if (!gameId || rawScore == null) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "参数不完整" },
        },
        { status: 400 }
      );
    }

    const game = gameRegistry.get(gameId);
    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "游戏不存在" },
        },
        { status: 404 }
      );
    }

    // Prevent double submission for same day
    const today = todayMidnight();
    const existing = await db
      .select()
      .from(microChallenges)
      .where(
        and(
          eq(microChallenges.userId, auth.sub),
          eq(microChallenges.gameId, gameId),
          gte(microChallenges.completedAt, today)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "ALREADY_COMPLETED", message: "今日已完成此挑战" },
        },
        { status: 400 }
      );
    }

    // Normalize score
    const normalizedScore = game.scorer.normalize(
      rawScore,
      durationMs || 0,
      metadata
    );
    const talentCategory = game.primaryTalent;

    // Save micro challenge
    const id = nanoid();
    await db.insert(microChallenges).values({
      id,
      userId: auth.sub,
      gameId,
      talentCategory,
      score: normalizedScore,
      completedAt: new Date(),
    });

    // ─── Incrementally update talent profile ───
    let updatedTalentScore: number | null = null;
    let updatedRank: string | null = null;

    const latestProfile = await db
      .select()
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, auth.sub))
      .orderBy(desc(talentProfiles.createdAt))
      .limit(1);

    if (latestProfile.length > 0) {
      const profile = latestProfile[0];
      const columnKey = TALENT_COLUMN_MAP[
        talentCategory
      ] as keyof typeof profile;
      const existingScore =
        (profile[columnKey] as number | null) ?? normalizedScore;

      // Incremental update: 70% existing + 30% new measurement
      const newScore =
        Math.round((0.7 * existingScore + 0.3 * normalizedScore) * 10) / 10;
      updatedTalentScore = newScore;
      updatedRank = scoreToRank(newScore);

      // Recompute overall score with the updated category
      const allScores: Partial<Record<TalentCategory, number>> = {};
      for (const cat of TALENT_CATEGORIES) {
        const col = TALENT_COLUMN_MAP[cat] as keyof typeof profile;
        const val =
          cat === talentCategory
            ? newScore
            : ((profile[col] as number | null) ?? undefined);
        if (val != null) allScores[cat] = val;
      }
      const newOverall = computeOverallScore(allScores);

      const updateData: Record<string, number | string> = {};
      updateData[TALENT_COLUMN_MAP[talentCategory]] = newScore;
      updateData.overallScore = newOverall;
      updateData.overallRank = scoreToRank(newOverall);

      await db
        .update(talentProfiles)
        .set(updateData)
        .where(eq(talentProfiles.id, profile.id));
    }

    // ─── Streak reward: milestone → auto-extend premium ───
    let streakReward: { milestone: number; rewardDays: number } | null = null;

    // Calculate new streak after this completion
    const recentDaysPost = await db
      .select({
        day: sql<string>`DATE(${microChallenges.completedAt})`,
      })
      .from(microChallenges)
      .where(eq(microChallenges.userId, auth.sub))
      .orderBy(desc(microChallenges.completedAt))
      .limit(110);

    const uniqueDaysPost = [...new Set(recentDaysPost.map((r) => r.day))];
    let newStreak = 0;
    const checkDatePost = new Date();
    for (let i = 0; i < 110; i++) {
      const dateStr = checkDatePost.toISOString().split("T")[0];
      if (uniqueDaysPost.includes(dateStr)) {
        newStreak++;
        checkDatePost.setDate(checkDatePost.getDate() - 1);
      } else {
        break;
      }
    }

    const rewardDays = STREAK_REWARDS[newStreak];
    if (rewardDays) {
      // Extend premium by rewardDays
      const user = await db
        .select({ tier: users.tier, tierExpiresAt: users.tierExpiresAt })
        .from(users)
        .where(eq(users.id, auth.sub))
        .limit(1);

      if (user.length > 0) {
        const now = new Date();
        const currentExpiry =
          user[0].tier === "premium" && user[0].tierExpiresAt && user[0].tierExpiresAt > now
            ? user[0].tierExpiresAt
            : now;
        const newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + rewardDays);

        await db
          .update(users)
          .set({
            tier: "premium",
            tierExpiresAt: newExpiry,
            updatedAt: now,
          })
          .where(eq(users.id, auth.sub));

        streakReward = { milestone: newStreak, rewardDays };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        normalizedScore,
        talentCategory,
        updatedTalentScore,
        updatedRank,
        newStreak,
        streakReward,
      },
    });
  } catch (error) {
    console.error("Submit challenge error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "提交挑战失败" },
      },
      { status: 500 }
    );
  }
}
