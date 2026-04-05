import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { sql } from "drizzle-orm";
import { requireAdminOrCronSecret } from "@/lib/admin";

/**
 * GET /api/admin/traffic — Traffic summary for harness/evaluator
 *
 * Returns: page views, unique sessions, top pages, top referrers (last 24h + 7d)
 * Auth: Admin cookie or CRON_SECRET bearer token
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminOrCronSecret(
    request.headers.get("authorization")
  );
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const now7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    function rows(result: unknown): Array<Record<string, unknown>> {
      if (Array.isArray(result)) return result;
      if (result && typeof result === "object" && "rows" in result) {
        return (result as { rows: Array<Record<string, unknown>> }).rows;
      }
      return [];
    }

    // 24h page views + unique sessions
    const stats24h = rows(
      await db.execute(sql`
        SELECT
          count(*) as total_views,
          count(distinct session_id) as unique_sessions
        FROM analytics_events
        WHERE event = 'page_view'
          AND created_at >= ${now24h}::timestamp
      `)
    );

    // 7d page views + unique sessions
    const stats7d = rows(
      await db.execute(sql`
        SELECT
          count(*) as total_views,
          count(distinct session_id) as unique_sessions
        FROM analytics_events
        WHERE event = 'page_view'
          AND created_at >= ${now7d}::timestamp
      `)
    );

    // Top pages (24h)
    const topPages = rows(
      await db.execute(sql`
        SELECT
          props->>'path' as page,
          count(*) as views
        FROM analytics_events
        WHERE event = 'page_view'
          AND created_at >= ${now24h}::timestamp
          AND props->>'path' IS NOT NULL
        GROUP BY props->>'path'
        ORDER BY count(*) DESC
        LIMIT 10
      `)
    );

    // Top referrers (7d)
    const topReferrers = rows(
      await db.execute(sql`
        SELECT
          referrer,
          count(*) as views
        FROM analytics_events
        WHERE event = 'page_view'
          AND created_at >= ${now7d}::timestamp
          AND referrer IS NOT NULL
          AND referrer != ''
        GROUP BY referrer
        ORDER BY count(*) DESC
        LIMIT 10
      `)
    );

    // Daily trend (last 7 days)
    const dailyTrend = rows(
      await db.execute(sql`
        SELECT
          date_trunc('day', created_at)::date as day,
          count(*) as views,
          count(distinct session_id) as sessions
        FROM analytics_events
        WHERE event = 'page_view'
          AND created_at >= ${now7d}::timestamp
        GROUP BY date_trunc('day', created_at)::date
        ORDER BY day
      `)
    );

    // Funnel events (7d) — key conversion events
    const funnelEvents = rows(
      await db.execute(sql`
        SELECT
          event,
          count(*) as total,
          count(distinct session_id) as unique_sessions
        FROM analytics_events
        WHERE created_at >= ${now7d}::timestamp
          AND event IN ('page_view', 'quiz_start', 'quiz_complete', 'share_click', 'deep_report_click')
        GROUP BY event
        ORDER BY count(*) DESC
      `)
    );

    return NextResponse.json({
      success: true,
      data: {
        last24h: {
          pageViews: Number(stats24h[0]?.total_views ?? 0),
          uniqueSessions: Number(stats24h[0]?.unique_sessions ?? 0),
        },
        last7d: {
          pageViews: Number(stats7d[0]?.total_views ?? 0),
          uniqueSessions: Number(stats7d[0]?.unique_sessions ?? 0),
        },
        topPages,
        topReferrers,
        dailyTrend,
        funnel: funnelEvents,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[admin/traffic] Error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
