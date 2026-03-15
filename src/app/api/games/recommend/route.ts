import { NextResponse } from "next/server";
import { db } from "@/db";
import { talentProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";
import { getRecommendationsForProfile } from "@/lib/game-recommender";

/**
 * GET /api/games/recommend
 *
 * Returns game recommendations for the current user's latest completed test.
 * Query params:
 *   platform — filter by platform (optional)
 */
export async function GET(request: Request) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    // Get latest profile
    const profiles = await db
      .select()
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, auth.sub))
      .orderBy(desc(talentProfiles.createdAt))
      .limit(1);

    if (profiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: { recommendations: [], hasProfile: false },
      });
    }

    const profile = profiles[0];
    const recs = await getRecommendationsForProfile(profile.id);

    // Optional platform filter
    const url = new URL(request.url);
    const platformFilter = url.searchParams.get("platform");

    const filtered = platformFilter
      ? recs.filter((r) =>
          (r.gamePlatforms as string[])?.includes(platformFilter)
        )
      : recs;

    return NextResponse.json({
      success: true,
      data: {
        recommendations: filtered,
        hasProfile: true,
        profileId: profile.id,
      },
    });
  } catch (error) {
    console.error("Recommend error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "获取推荐失败" } },
      { status: 500 }
    );
  }
}
