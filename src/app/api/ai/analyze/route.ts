import { NextResponse } from "next/server";
import { streamText } from "ai";
import { db } from "@/db";
import { talentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";
import { getModel } from "@/lib/ai";
import { buildTalentAnalysisPrompt } from "@/lib/prompts";
import { recommendGenres } from "@/lib/scoring";
import { type TalentCategory } from "@/types/talent";
import { logger } from "@/lib/logger";

const TALENT_PROFILE_KEYS: Record<string, TalentCategory> = {
  reactionSpeed: "reaction_speed",
  handEyeCoord: "hand_eye_coord",
  spatialAwareness: "spatial_awareness",
  memory: "memory",
  strategyLogic: "strategy_logic",
  rhythmSense: "rhythm_sense",
  patternRecog: "pattern_recog",
  multitasking: "multitasking",
  decisionSpeed: "decision_speed",
  emotionalControl: "emotional_control",
  teamworkTendency: "teamwork_tendency",
  riskAssessment: "risk_assessment",
  resourceMgmt: "resource_mgmt",
};

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    const profiles = await db
      .select()
      .from(talentProfiles)
      .where(eq(talentProfiles.sessionId, sessionId))
      .limit(1);

    if (profiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "测试结果不存在" },
        },
        { status: 404 }
      );
    }

    const profile = profiles[0];
    const model = await getModel();

    if (!model) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "AI_ERROR", message: "AI 未配置" },
        },
        { status: 503 }
      );
    }

    // Extract scores from profile
    const scores: Partial<Record<TalentCategory, number>> = {};
    for (const [key, category] of Object.entries(TALENT_PROFILE_KEYS)) {
      const value = profile[key as keyof typeof profile];
      if (typeof value === "number") {
        scores[category] = value;
      }
    }

    const genres = recommendGenres(scores);
    const prompt = buildTalentAnalysisPrompt(
      scores,
      profile.overallScore || 0,
      profile.overallRank || "C",
      genres
    );

    const result = streamText({
      model,
      prompt,
      maxOutputTokens: 2000,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    logger.error("ai.analyze", "AI analyze failed", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "AI_ERROR", message: "AI 分析失败" },
      },
      { status: 500 }
    );
  }
}
