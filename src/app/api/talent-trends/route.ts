import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { talentProfiles, microChallenges } from "@/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

/**
 * GET /api/talent-trends — User's talent evolution + comparison to same archetype
 *
 * Returns:
 * - User's talent scores across test sessions (max 5)
 * - Challenge score trends per talent (last 30 days)
 * - Same-archetype percentile (how user compares to others with same archetype)
 */
export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. User's test history (talent profiles)
  const profiles = await db
    .select()
    .from(talentProfiles)
    .where(eq(talentProfiles.userId, auth.sub))
    .orderBy(desc(talentProfiles.createdAt))
    .limit(5);

  if (profiles.length === 0) {
    return NextResponse.json({
      success: true,
      data: { profiles: [], challengeTrends: [], percentiles: null },
    });
  }

  const latestProfile = profiles[0];

  // 2. Challenge trends (last 30 days, grouped by talent)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const challenges = await db
    .select({
      talentCategory: microChallenges.talentCategory,
      score: microChallenges.score,
      completedAt: microChallenges.completedAt,
    })
    .from(microChallenges)
    .where(
      and(
        eq(microChallenges.userId, auth.sub),
        gte(microChallenges.completedAt, thirtyDaysAgo)
      )
    )
    .orderBy(microChallenges.completedAt);

  // 3. Percentile comparison: how does user's overall score compare to same archetype?
  let percentiles: Record<string, number> | null = null;
  if (latestProfile.archetypeId && latestProfile.overallScore != null) {
    const sameArchetype = await db
      .select({
        overallScore: talentProfiles.overallScore,
      })
      .from(talentProfiles)
      .where(eq(talentProfiles.archetypeId, latestProfile.archetypeId));

    if (sameArchetype.length > 1) {
      const scores = sameArchetype
        .map((p) => p.overallScore ?? 0)
        .sort((a, b) => a - b);
      const myScore = latestProfile.overallScore;

      // Calculate percentile for overall score
      const rank = scores.filter((s) => s <= myScore).length;
      const overallPercentile = Math.round((rank / scores.length) * 100);

      // Per-talent percentiles
      const talentKeys = [
        "reactionSpeed", "handEyeCoord", "spatialAwareness", "memory",
        "strategyLogic", "rhythmSense", "patternRecog", "multitasking",
        "decisionSpeed", "emotionalControl", "teamworkTendency",
        "riskAssessment", "resourceMgmt",
      ] as const;

      percentiles = { overall: overallPercentile };

      for (const key of talentKeys) {
        const myVal = latestProfile[key] as number | null;
        if (myVal == null) continue;
        // Fast approximation: use overall score distribution as proxy
        const talentScores = sameArchetype
          .map((p) => (p as Record<string, unknown>)[key] as number ?? 0)
          .sort((a, b) => a - b);
        const talentRank = talentScores.filter((s) => s <= myVal).length;
        percentiles[key] = Math.round((talentRank / talentScores.length) * 100);
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      profiles: profiles.map((p) => ({
        id: p.id,
        overallScore: p.overallScore,
        overallRank: p.overallRank,
        archetypeId: p.archetypeId,
        createdAt: p.createdAt,
        // Include all talent scores
        reactionSpeed: p.reactionSpeed,
        handEyeCoord: p.handEyeCoord,
        spatialAwareness: p.spatialAwareness,
        memory: p.memory,
        strategyLogic: p.strategyLogic,
        rhythmSense: p.rhythmSense,
        patternRecog: p.patternRecog,
        multitasking: p.multitasking,
        decisionSpeed: p.decisionSpeed,
        emotionalControl: p.emotionalControl,
        teamworkTendency: p.teamworkTendency,
        riskAssessment: p.riskAssessment,
        resourceMgmt: p.resourceMgmt,
      })),
      challengeTrends: challenges,
      percentiles,
      archetypeId: latestProfile.archetypeId,
      sameArchetypeCount: percentiles ? undefined : 0,
    },
  });
}
