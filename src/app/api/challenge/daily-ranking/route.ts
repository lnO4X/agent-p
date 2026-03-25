import { NextResponse } from "next/server";
import { db } from "@/db";
import { microChallenges, users } from "@/db/schema";
import { eq, gte, sql, desc } from "drizzle-orm";

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /api/challenge/daily-ranking — Today's top scores (public, no auth)
 *
 * Returns top 20 scores from today's challenges, sorted by score DESC.
 */
export async function GET() {
  try {
    const today = todayMidnight();

    const ranking = await db
      .select({
        userId: microChallenges.userId,
        username: users.username,
        displayName: users.displayName,
        score: microChallenges.score,
        gameId: microChallenges.gameId,
        talentCategory: microChallenges.talentCategory,
        completedAt: microChallenges.completedAt,
      })
      .from(microChallenges)
      .innerJoin(users, eq(microChallenges.userId, users.id))
      .where(gte(microChallenges.completedAt, today))
      .orderBy(desc(microChallenges.score))
      .limit(20);

    // Total participants today
    const countResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${microChallenges.userId})`,
      })
      .from(microChallenges)
      .where(gte(microChallenges.completedAt, today));

    return NextResponse.json(
      {
        success: true,
        data: {
          ranking: ranking.map((r, i) => ({
            rank: i + 1,
            username: r.username,
            displayName: r.displayName,
            score: r.score,
            gameId: r.gameId,
            talentCategory: r.talentCategory,
          })),
          totalParticipants: Number(countResult[0]?.count ?? 0),
          date: today.toISOString().slice(0, 10),
        },
      },
      {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      }
    );
  } catch (error) {
    console.error("Daily ranking error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "排行榜加载失败" } },
      { status: 500 }
    );
  }
}
