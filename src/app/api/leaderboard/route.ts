import { NextResponse } from "next/server";
import { db } from "@/db";
import { talentProfiles, users, testSessions } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET() {
  try {
    // Get top talent profiles with user info
    // For each user, pick only their best overall score
    const allProfiles = await db
      .select({
        profileId: talentProfiles.id,
        userId: talentProfiles.userId,
        username: users.username,
        displayName: users.displayName,
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
        completedAt: testSessions.completedAt,
      })
      .from(talentProfiles)
      .innerJoin(users, eq(talentProfiles.userId, users.id))
      .innerJoin(testSessions, and(
        eq(talentProfiles.sessionId, testSessions.id),
        eq(testSessions.status, "completed")
      ))
      .orderBy(desc(talentProfiles.overallScore))
      .limit(200);

    // Keep only the best score per user
    const bestByUser = new Map<string, typeof allProfiles[0]>();
    for (const profile of allProfiles) {
      const existing = bestByUser.get(profile.userId);
      if (!existing || (profile.overallScore || 0) > (existing.overallScore || 0)) {
        bestByUser.set(profile.userId, profile);
      }
    }

    const leaderboard = Array.from(bestByUser.values())
      .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
      .slice(0, 50)
      .map((p, i) => ({
        rank: i + 1,
        userId: p.userId,
        username: p.username,
        displayName: p.displayName,
        overallScore: p.overallScore,
        overallRank: p.overallRank,
        sessionId: p.sessionId,
        completedAt: p.completedAt,
        talents: {
          reaction_speed: p.reactionSpeed,
          hand_eye_coord: p.handEyeCoord,
          spatial_awareness: p.spatialAwareness,
          memory: p.memory,
          strategy_logic: p.strategyLogic,
          rhythm_sense: p.rhythmSense,
          pattern_recog: p.patternRecog,
          multitasking: p.multitasking,
          decision_speed: p.decisionSpeed,
          emotional_control: p.emotionalControl,
          teamwork_tendency: p.teamworkTendency,
          risk_assessment: p.riskAssessment,
          resource_mgmt: p.resourceMgmt,
        },
      }));

    return NextResponse.json(
      { success: true, data: leaderboard },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "获取排行榜失败" },
      },
      { status: 500 }
    );
  }
}
