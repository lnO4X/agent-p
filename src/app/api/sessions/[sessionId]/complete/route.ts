import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  testSessions,
  gameScores,
  talentProfiles,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";
import {
  computeTalentScore,
  computeOverallScore,
  scoreToRank,
  recommendGenres,
} from "@/lib/scoring";
import { TALENT_CATEGORIES, type TalentCategory } from "@/types/talent";
import { gameRegistry } from "@/games";
import { generateGameRecommendations } from "@/lib/game-recommender";
import { scoreToArchetype } from "@/lib/archetype";
import { logger } from "@/lib/logger";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    // Verify session exists and belongs to user
    const sessions = await db
      .select()
      .from(testSessions)
      .where(
        and(
          eq(testSessions.id, sessionId),
          eq(testSessions.userId, auth.sub)
        )
      )
      .limit(1);

    if (sessions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "测试不存在" },
        },
        { status: 404 }
      );
    }

    // Get all scores for this session
    const scores = await db
      .select()
      .from(gameScores)
      .where(eq(gameScores.sessionId, sessionId));

    if (scores.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "没有游戏记录" },
        },
        { status: 400 }
      );
    }

    // Compute talent scores
    const talentScores: Partial<Record<TalentCategory, number>> = {};

    for (const category of TALENT_CATEGORIES) {
      const relevantScores = scores
        .map((s) => {
          const game = gameRegistry.get(s.gameId);
          if (!game) return null;
          const isPrimary = game.primaryTalent === category;
          const isSecondary = game.secondaryTalents?.includes(category);
          if (!isPrimary && !isSecondary) return null;
          return { normalizedScore: s.normalizedScore, isPrimary };
        })
        .filter(Boolean) as Array<{
        normalizedScore: number;
        isPrimary: boolean;
      }>;

      if (relevantScores.length > 0) {
        talentScores[category] = computeTalentScore(relevantScores);
      }
    }

    const overallScore = computeOverallScore(talentScores);
    const overallRank = scoreToRank(overallScore);
    const genres = recommendGenres(talentScores);

    // Compute archetype from talent scores
    const archetype = scoreToArchetype(talentScores as Record<string, number>);

    // Save profile
    const profileId = nanoid();
    const profileData = {
      id: profileId,
      sessionId,
      userId: auth.sub,
      reactionSpeed: talentScores.reaction_speed ?? null,
      handEyeCoord: talentScores.hand_eye_coord ?? null,
      spatialAwareness: talentScores.spatial_awareness ?? null,
      memory: talentScores.memory ?? null,
      strategyLogic: talentScores.strategy_logic ?? null,
      rhythmSense: talentScores.rhythm_sense ?? null,
      patternRecog: talentScores.pattern_recog ?? null,
      multitasking: talentScores.multitasking ?? null,
      decisionSpeed: talentScores.decision_speed ?? null,
      emotionalControl: talentScores.emotional_control ?? null,
      teamworkTendency: talentScores.teamwork_tendency ?? null,
      riskAssessment: talentScores.risk_assessment ?? null,
      resourceMgmt: talentScores.resource_mgmt ?? null,
      overallScore,
      overallRank,
      archetypeId: archetype?.id ?? null,
      genreRecommendations: genres,
      createdAt: new Date(),
    };

    await db.insert(talentProfiles).values(profileData);

    // Update session status
    await db
      .update(testSessions)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(testSessions.id, sessionId));

    // Generate game recommendations asynchronously (non-blocking)
    generateGameRecommendations(profileId, talentScores, genres).catch(
      (err) => logger.error("sessions.complete", "Failed to generate game recommendations", err)
    );

    return NextResponse.json({
      success: true,
      data: {
        profileId,
        talentScores,
        overallScore,
        overallRank,
        genres,
      },
    });
  } catch (error) {
    logger.error("sessions.complete", "Complete session failed", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "完成测试失败" },
      },
      { status: 500 }
    );
  }
}
