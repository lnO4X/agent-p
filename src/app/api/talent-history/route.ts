import { NextResponse } from "next/server";
import { db } from "@/db";
import { talentProfiles, testSessions } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";
import type { TalentCategory } from "@/types/talent";
import { TALENT_CATEGORIES } from "@/types/talent";

const TALENT_DB_KEYS: Record<TalentCategory, keyof typeof talentProfiles> = {
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

export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    // Fetch all completed talent profiles ordered by creation date
    const profiles = await db
      .select({
        id: talentProfiles.id,
        archetypeId: talentProfiles.archetypeId,
        overallScore: talentProfiles.overallScore,
        reactionSpeed: talentProfiles.reactionSpeed,
        handEyeCoord: talentProfiles.handEyeCoord,
        spatialAwareness: talentProfiles.spatialAwareness,
        memory: talentProfiles.memory,
        strategyLogic: talentProfiles.strategyLogic,
        rhythmSense: talentProfiles.rhythmSense,
        patternRecog: talentProfiles.patternRecog,
        multitasking: talentProfiles.multitasking,
        decisionSpeed: talentProfiles.decisionSpeed,
        emotionalControl: talentProfiles.emotionalControl,
        teamworkTendency: talentProfiles.teamworkTendency,
        riskAssessment: talentProfiles.riskAssessment,
        resourceMgmt: talentProfiles.resourceMgmt,
        createdAt: talentProfiles.createdAt,
      })
      .from(talentProfiles)
      .innerJoin(
        testSessions,
        and(
          eq(talentProfiles.sessionId, testSessions.id),
          eq(testSessions.status, "completed")
        )
      )
      .where(eq(talentProfiles.userId, auth.sub))
      .orderBy(asc(talentProfiles.createdAt));

    // Build history entries
    const history = profiles.map((p) => {
      const talents: Partial<Record<TalentCategory, number>> = {};
      for (const cat of TALENT_CATEGORIES) {
        const dbKey = TALENT_DB_KEYS[cat];
        const val = p[dbKey as keyof typeof p];
        if (typeof val === "number") {
          talents[cat] = Math.round(val * 10) / 10;
        }
      }
      return {
        date: p.createdAt.toISOString().split("T")[0],
        archetypeId: p.archetypeId,
        overallScore: p.overallScore ? Math.round(p.overallScore * 10) / 10 : null,
        talents,
      };
    });

    // Build evolution summary
    const first = history[0];
    const current = history[history.length - 1];
    const evolution =
      history.length >= 2
        ? {
            firstArchetype: first.archetypeId,
            currentArchetype: current.archetypeId,
            evolved: first.archetypeId !== current.archetypeId,
            overallChange:
              current.overallScore != null && first.overallScore != null
                ? Math.round((current.overallScore - first.overallScore) * 10) / 10
                : 0,
          }
        : null;

    return NextResponse.json({
      success: true,
      data: { history, evolution },
    });
  } catch (error) {
    console.error("Talent history error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "获取天赋历史失败" },
      },
      { status: 500 }
    );
  }
}
