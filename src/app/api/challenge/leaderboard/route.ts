import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { microChallenges, users } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

/**
 * GET /api/challenge/leaderboard — Challenge leaderboard
 *
 * Returns top users by:
 * - totalChallenges: most challenges completed
 * - bestStreak: longest consecutive day streak
 * - averageScore: highest average score
 *
 * Plus the current user's stats.
 */
export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    // Top users by total challenges (top 20)
    const topByCount = await db
      .select({
        userId: microChallenges.userId,
        username: users.username,
        displayName: users.displayName,
        totalChallenges: sql<number>`COUNT(*)::int`.as("total_challenges"),
        avgScore: sql<number>`ROUND(AVG(${microChallenges.score})::numeric, 1)`.as("avg_score"),
      })
      .from(microChallenges)
      .innerJoin(users, eq(microChallenges.userId, users.id))
      .groupBy(microChallenges.userId, users.username, users.displayName)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(20);

    // Calculate streak for each user in the top list
    const leaderboard = await Promise.all(
      topByCount.map(async (entry) => {
        const streak = await calculateStreak(entry.userId);
        return {
          ...entry,
          streak,
        };
      })
    );

    // Current user's stats
    const myStats = await db
      .select({
        totalChallenges: sql<number>`COUNT(*)::int`.as("total"),
        avgScore: sql<number>`ROUND(AVG(${microChallenges.score})::numeric, 1)`.as("avg"),
      })
      .from(microChallenges)
      .where(eq(microChallenges.userId, auth.sub));

    const myStreak = await calculateStreak(auth.sub);

    // My rank
    const myRank = leaderboard.findIndex((e) => e.userId === auth.sub) + 1;

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: leaderboard.map((entry, i) => ({
          rank: i + 1,
          userId: entry.userId,
          username: entry.username,
          displayName: entry.displayName,
          totalChallenges: entry.totalChallenges,
          avgScore: Number(entry.avgScore),
          streak: entry.streak,
        })),
        me: {
          totalChallenges: myStats[0]?.totalChallenges ?? 0,
          avgScore: Number(myStats[0]?.avgScore ?? 0),
          streak: myStreak,
          rank: myRank || null,
        },
      },
    });
  } catch (error) {
    console.error("Challenge leaderboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}

/**
 * Calculate current consecutive day streak for a user.
 * A streak counts backward from today (or yesterday if today not yet completed).
 */
async function calculateStreak(userId: string): Promise<number> {
  // Get distinct dates of challenges, ordered most recent first
  const dates = await db
    .select({
      date: sql<string>`DATE(${microChallenges.completedAt})`.as("date"),
    })
    .from(microChallenges)
    .where(eq(microChallenges.userId, userId))
    .groupBy(sql`DATE(${microChallenges.completedAt})`)
    .orderBy(desc(sql`DATE(${microChallenges.completedAt})`))
    .limit(60);

  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateSet = new Set(dates.map((d) => d.date));

  let streak = 0;
  // Start from today, check each day backward
  for (let i = 0; i < 60; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().slice(0, 10);

    if (dateSet.has(dateStr)) {
      streak++;
    } else if (i === 0) {
      // Today hasn't been completed yet, continue checking from yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}
