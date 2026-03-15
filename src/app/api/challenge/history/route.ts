import { NextResponse } from "next/server";
import { db } from "@/db";
import { microChallenges } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";

// GET /api/challenge/history?limit=5 — Recent challenge results
export async function GET(request: Request) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 10), 50);

    const results = await db
      .select({
        id: microChallenges.id,
        gameId: microChallenges.gameId,
        talentCategory: microChallenges.talentCategory,
        score: microChallenges.score,
        completedAt: microChallenges.completedAt,
      })
      .from(microChallenges)
      .where(eq(microChallenges.userId, auth.sub))
      .orderBy(desc(microChallenges.completedAt))
      .limit(limit);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Get challenge history error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "获取挑战历史失败" },
      },
      { status: 500 }
    );
  }
}
