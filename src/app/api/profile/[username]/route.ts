import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, talentProfiles, testSessions, microChallenges } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * GET /api/profile/[username] — Public profile data
 * No auth required — used for shareable profile pages.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Find user
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        isProfilePublic: users.isProfilePublic,
        tier: users.tier,
        tierExpiresAt: users.tierExpiresAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const user = userResult[0];

    // Check privacy
    if (!user.isProfilePublic) {
      return NextResponse.json(
        { success: false, error: { code: "PRIVATE", message: "Profile is private" } },
        { status: 403 }
      );
    }

    // Check if premium is still active
    const effectiveTier =
      user.tier === "premium" && user.tierExpiresAt && user.tierExpiresAt < new Date()
        ? "free"
        : user.tier;

    // Get best talent profile
    const profiles = await db
      .select({
        overallScore: talentProfiles.overallScore,
        overallRank: talentProfiles.overallRank,
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
        sessionId: talentProfiles.sessionId,
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
      .where(eq(talentProfiles.userId, user.id))
      .orderBy(desc(talentProfiles.overallScore))
      .limit(1);

    const bestProfile = profiles[0] || null;

    // Get recent challenge stats
    const recentChallenges = await db
      .select({
        id: microChallenges.id,
        gameId: microChallenges.gameId,
        talentCategory: microChallenges.talentCategory,
        score: microChallenges.score,
        completedAt: microChallenges.completedAt,
      })
      .from(microChallenges)
      .where(eq(microChallenges.userId, user.id))
      .orderBy(desc(microChallenges.completedAt))
      .limit(5);

    // Build talent map from best profile
    const talents = bestProfile
      ? {
          reaction_speed: bestProfile.reactionSpeed,
          hand_eye_coord: bestProfile.handEyeCoord,
          spatial_awareness: bestProfile.spatialAwareness,
          memory: bestProfile.memory,
          strategy_logic: bestProfile.strategyLogic,
          rhythm_sense: bestProfile.rhythmSense,
          pattern_recog: bestProfile.patternRecog,
          multitasking: bestProfile.multitasking,
          decision_speed: bestProfile.decisionSpeed,
          emotional_control: bestProfile.emotionalControl,
          teamwork_tendency: bestProfile.teamworkTendency,
          risk_assessment: bestProfile.riskAssessment,
          resource_mgmt: bestProfile.resourceMgmt,
        }
      : null;

    return NextResponse.json({
      success: true,
      data: {
        username: user.username,
        displayName: user.displayName,
        tier: effectiveTier,
        createdAt: user.createdAt,
        overallScore: bestProfile?.overallScore ?? null,
        overallRank: bestProfile?.overallRank ?? null,
        talents,
        recentChallenges,
      },
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to load profile" } },
      { status: 500 }
    );
  }
}
