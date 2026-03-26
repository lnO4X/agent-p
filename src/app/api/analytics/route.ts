import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { analyticsEvents, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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
 * POST /api/analytics — Track custom events (public, fire-and-forget)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: true });

    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: true });

    const auth = await getAuthFromCookie().catch(() => null);
    const ua = request.headers.get("user-agent") || undefined;

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
    return NextResponse.json({ ok: true });
  }
}

/**
 * GET /api/analytics — Admin dashboard data (7-day event counts)
 */
export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, auth.sub))
      .limit(1);
    if (!user[0]?.isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const counts = await db
      .select({
        event: analyticsEvents.event,
        count: sql<number>`count(*)`,
        uniqueUsers: sql<number>`count(distinct ${analyticsEvents.sessionId})`,
      })
      .from(analyticsEvents)
      .where(sql`${analyticsEvents.createdAt} >= ${sevenDaysAgo}`)
      .groupBy(analyticsEvents.event)
      .orderBy(sql`count(*) desc`);

    return NextResponse.json({
      success: true,
      data: { eventCounts: counts },
    });
  } catch (error) {
    console.error("[api/analytics] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
