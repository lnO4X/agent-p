import { NextRequest } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/admin";
import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/admin/analytics — Registration trend + funnel + activity data
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminOrCronSecret(
    request.headers.get("authorization")
  );
  if (!auth) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Safe extraction: db.execute may return array or { rows: [] }
    function rows(result: unknown): Array<Record<string, unknown>> {
      if (Array.isArray(result)) return result;
      if (result && typeof result === "object" && "rows" in result) {
        return (result as { rows: Array<Record<string, unknown>> }).rows;
      }
      return [];
    }

    const [registrationTrend, funnel, dailyActivity] = await Promise.all([
      db.execute(sql`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= ${thirtyDaysAgo}::timestamp
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `),

      db.execute(sql`
        SELECT
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(DISTINCT user_id) FROM test_sessions WHERE status = 'completed') as users_with_tests,
          (SELECT COUNT(DISTINCT user_id) FROM talent_profiles) as users_with_profiles,
          (SELECT COUNT(*) FROM users WHERE tier = 'premium') as premium_users
      `),

      // Tests per day (last 14 days)
      db.execute(sql`
        SELECT
          DATE(completed_at) as date,
          COUNT(*) as tests
        FROM test_sessions
        WHERE status = 'completed' AND completed_at >= ${fourteenDaysAgo}::timestamp
        GROUP BY DATE(completed_at)
        ORDER BY date ASC
      `),
    ]);

    // Separately fetch challenge activity
    const challengeActivity = await db.execute(sql`
      SELECT DATE(completed_at) as date, COUNT(*) as challenges
      FROM micro_challenges
      WHERE completed_at >= ${fourteenDaysAgo}::timestamp
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `);

    const trendRows = rows(registrationTrend);
    const funnelRows = rows(funnel);
    const testRows = rows(dailyActivity);
    const challengeRows = rows(challengeActivity);

    // Merge test + challenge activity by date
    const dateMap = new Map<string, { tests: number; challenges: number }>();
    for (const r of testRows) {
      const d = String(r.date);
      dateMap.set(d, { tests: Number(r.tests), challenges: 0 });
    }
    for (const r of challengeRows) {
      const d = String(r.date);
      const existing = dateMap.get(d) || { tests: 0, challenges: 0 };
      existing.challenges = Number(r.challenges);
      dateMap.set(d, existing);
    }
    const activityData = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    return Response.json({
      success: true,
      data: {
        registrationTrend: trendRows.map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
        funnel: {
          totalUsers: Number(funnelRows[0]?.total_users ?? 0),
          usersWithTests: Number(funnelRows[0]?.users_with_tests ?? 0),
          usersWithProfiles: Number(funnelRows[0]?.users_with_profiles ?? 0),
          premiumUsers: Number(funnelRows[0]?.premium_users ?? 0),
        },
        dailyActivity: activityData,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[admin/analytics] Error:", msg);
    return Response.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
