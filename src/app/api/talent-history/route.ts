import { NextResponse } from "next/server";
import { db } from "@/db";
import { testSessions, talentProfiles } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";
import { TALENT_CATEGORIES, type TalentCategory } from "@/types/talent";
import { logger } from "@/lib/logger";

/**
 * GET /api/talent-history
 *
 * Returns a user's completed test history with per-talent scores, archetype,
 * and overall score for each session. Used by:
 *   - Evolution tracker (needs >= 2 entries)
 *   - Retest reminder component (needs latest completedAt)
 *   - /me/history comparison page (needs full list + per-session talents)
 *
 * Response shape:
 *   {
 *     success: true,
 *     data: {
 *       history: Array<{
 *         sessionId: string;
 *         date: string;        // ISO (completedAt)
 *         archetypeId: string | null;
 *         overallScore: number | null;
 *         overallRank: string | null;
 *         talents: Partial<Record<TalentCategory, number>>;
 *       }>;
 *       evolution: {
 *         firstArchetype: string | null;
 *         currentArchetype: string | null;
 *         evolved: boolean;
 *         overallChange: number;   // current - first (rounded to 1 decimal)
 *       } | null;
 *     }
 *   }
 */

interface ProfileRow {
  sessionId: string;
  archetypeId: string | null;
  overallScore: number | null;
  overallRank: string | null;
  createdAt: Date;
  reactionSpeed: number | null;
  handEyeCoord: number | null;
  spatialAwareness: number | null;
  memory: number | null;
  strategyLogic: number | null;
  rhythmSense: number | null;
  patternRecog: number | null;
  multitasking: number | null;
  decisionSpeed: number | null;
  emotionalControl: number | null;
  teamworkTendency: number | null;
  riskAssessment: number | null;
  resourceMgmt: number | null;
  completedAt: Date | null;
}

/** Map DB column (camelCase) to TalentCategory key (snake_case) */
const TALENT_COLUMN_MAP: Record<TalentCategory, keyof ProfileRow> = {
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

function rowToTalents(
  row: ProfileRow
): Partial<Record<TalentCategory, number>> {
  const out: Partial<Record<TalentCategory, number>> = {};
  for (const cat of TALENT_CATEGORIES) {
    const col = TALENT_COLUMN_MAP[cat];
    const val = row[col];
    if (typeof val === "number") {
      out[cat] = val;
    }
  }
  return out;
}

export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    // Join talent profiles with their sessions for completedAt ordering.
    const rows = await db
      .select({
        sessionId: talentProfiles.sessionId,
        archetypeId: talentProfiles.archetypeId,
        overallScore: talentProfiles.overallScore,
        overallRank: talentProfiles.overallRank,
        createdAt: talentProfiles.createdAt,
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
        completedAt: testSessions.completedAt,
      })
      .from(talentProfiles)
      .innerJoin(testSessions, eq(talentProfiles.sessionId, testSessions.id))
      .where(
        and(
          eq(talentProfiles.userId, auth.sub),
          eq(testSessions.status, "completed")
        )
      )
      .orderBy(desc(testSessions.completedAt))
      .limit(50);

    // Return in chronological ascending order (oldest first) — callers expect this shape.
    const history = rows
      .slice()
      .reverse()
      .map((r) => ({
        sessionId: r.sessionId,
        date: (r.completedAt ?? r.createdAt).toISOString(),
        archetypeId: r.archetypeId,
        overallScore: r.overallScore,
        overallRank: r.overallRank,
        talents: rowToTalents(r as ProfileRow),
      }));

    let evolution: {
      firstArchetype: string | null;
      currentArchetype: string | null;
      evolved: boolean;
      overallChange: number;
    } | null = null;

    if (history.length >= 2) {
      const first = history[0];
      const current = history[history.length - 1];
      const overallChange =
        typeof first.overallScore === "number" &&
        typeof current.overallScore === "number"
          ? Math.round((current.overallScore - first.overallScore) * 10) / 10
          : 0;
      evolution = {
        firstArchetype: first.archetypeId,
        currentArchetype: current.archetypeId,
        evolved:
          first.archetypeId !== current.archetypeId &&
          first.archetypeId != null &&
          current.archetypeId != null,
        overallChange,
      };
    }

    return NextResponse.json({
      success: true,
      data: { history, evolution },
    });
  } catch (error) {
    logger.error("talent-history", "Failed to load talent history", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "获取历史记录失败",
        },
      },
      { status: 500 }
    );
  }
}
