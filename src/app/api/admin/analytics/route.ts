import { NextRequest } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/admin";
import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/admin/analytics — Registration trend + funnel + activity data
 *
 * Returns:
 *   registrationTrend: last 30 days registrations per day
 *   funnel: { totalUsers, usersWithTests, usersWithProfiles, premiumUsers }
 *   dailyActivity: last 14 days { date, tests, challenges }
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminOrCronSecret(
    request.headers.get("authorization")
  );
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [registrationTrend, funnel, dailyActivity] = await Promise.all([
    // Registration trend — last 30 days, grouped by date
    db.execute(sql`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `),

    // Funnel: total users → users who completed tests → premium users
    db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(DISTINCT user_id) FROM test_sessions WHERE status = 'completed') as users_with_tests,
        (SELECT COUNT(DISTINCT user_id) FROM talent_profiles) as users_with_profiles,
        (SELECT COUNT(*) FROM users WHERE tier = 'premium') as premium_users
    `),

    // Daily activity — last 14 days, tests + challenges per day
    db.execute(sql`
      SELECT
        d.date,
        COALESCE(t.tests, 0) as tests,
        COALESCE(c.challenges, 0) as challenges
      FROM (
        SELECT generate_series(
          DATE(${fourteenDaysAgo}),
          CURRENT_DATE,
          interval '1 day'
        )::date as date
      ) d
      LEFT JOIN (
        SELECT DATE(completed_at) as date, COUNT(*) as tests
        FROM test_sessions
        WHERE status = 'completed' AND completed_at >= ${fourteenDaysAgo}
        GROUP BY DATE(completed_at)
      ) t ON t.date = d.date
      LEFT JOIN (
        SELECT DATE(completed_at) as date, COUNT(*) as challenges
        FROM micro_challenges
        WHERE completed_at >= ${fourteenDaysAgo}
        GROUP BY DATE(completed_at)
      ) c ON c.date = d.date
      ORDER BY d.date ASC
    `),
  ]);

  // db.execute() returns the result array directly (not { rows })
  const trendRows = registrationTrend as unknown as Array<Record<string, unknown>>;
  const funnelRows = funnel as unknown as Array<Record<string, unknown>>;
  const activityRows = dailyActivity as unknown as Array<Record<string, unknown>>;

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
      dailyActivity: activityRows.map((r) => ({
        date: r.date,
        tests: Number(r.tests),
        challenges: Number(r.challenges),
      })),
    },
  });
}
