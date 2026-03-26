import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

const eventSchema = z.object({
  event: z.string().min(1).max(50),
  props: z.record(z.string(), z.unknown()).optional(),
  page: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  sessionId: z.string().max(100).optional(),
});

/**
 * POST /api/analytics — Track custom events (replaces Vercel Analytics Pro)
 * Fire-and-forget from client. No auth required.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: true }); // Don't error on bad payloads
    }

    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: true }); // Silent fail
    }

    const auth = await getAuthFromCookie().catch(() => null);
    const ua = request.headers.get("user-agent") || undefined;

    // Fire-and-forget DB insert — don't await to keep response fast
    db.insert(analyticsEvents)
      .values({
        id: randomUUID(),
        event: parsed.data.event,
        props: parsed.data.props ?? null,
        userId: auth?.sub ?? null,
        sessionId: parsed.data.sessionId ?? null,
        page: parsed.data.page ?? null,
        referrer: parsed.data.referrer ?? null,
        userAgent: ua,
      })
      .catch((err) => console.error("[analytics] DB error:", err));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Never fail
  }
}

/**
 * GET /api/analytics — Simple dashboard (admin only)
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Check admin
  const { db: database } = await import("@/db");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const user = await database.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, auth.sub)).limit(1);
  if (!user[0]?.isAdmin) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { sql } = await import("drizzle-orm");

  // Last 7 days event counts
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const counts = await database
    .select({
      event: analyticsEvents.event,
      count: sql<number>`count(*)`,
      uniqueUsers: sql<number>`count(distinct ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(sql`${analyticsEvents.createdAt} >= ${sevenDaysAgo}`)
    .groupBy(analyticsEvents.event)
    .orderBy(sql`count(*) desc`);

  // Daily totals (last 7 days)
  const daily = await database
    .select({
      date: sql<string>`date(${analyticsEvents.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(sql`${analyticsEvents.createdAt} >= ${sevenDaysAgo}`)
    .groupBy(sql`date(${analyticsEvents.createdAt})`)
    .orderBy(sql`date(${analyticsEvents.createdAt})`);

  return NextResponse.json({
    success: true,
    data: { eventCounts: counts, dailyTotals: daily },
  });
}
