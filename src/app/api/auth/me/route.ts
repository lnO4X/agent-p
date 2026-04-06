import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { users, talentProfiles, testSessions } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

// GET /api/auth/me — Get current user info + latest talent scores
export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  const user = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, auth.sub))
    .limit(1);

  if (user.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  // Fetch latest talent profile (avoids heavy leaderboard query on dashboard)
  let latestTalents: Record<string, number | null> | null = null;
  try {
    const [profile] = await db
      .select({
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
      .orderBy(desc(talentProfiles.createdAt))
      .limit(1);

    if (profile) {
      latestTalents = {
        reaction_speed: profile.reactionSpeed,
        hand_eye_coord: profile.handEyeCoord,
        spatial_awareness: profile.spatialAwareness,
        memory: profile.memory,
        strategy_logic: profile.strategyLogic,
        rhythm_sense: profile.rhythmSense,
        pattern_recog: profile.patternRecog,
        multitasking: profile.multitasking,
        decision_speed: profile.decisionSpeed,
        emotional_control: profile.emotionalControl,
        teamwork_tendency: profile.teamworkTendency,
        risk_assessment: profile.riskAssessment,
        resource_mgmt: profile.resourceMgmt,
      };
    }
  } catch {
    // Non-critical — dashboard still works without talents
  }

  return NextResponse.json({
    success: true,
    data: { ...user[0], latestTalents },
  });
}
