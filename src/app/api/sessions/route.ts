import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { testSessions, users } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";

import { getTestLimit } from "@/lib/test-tiers";

const isDev = process.env.NODE_ENV === "development";
const noLimit = isDev || process.env.DISABLE_TEST_LIMIT === "true";

async function getUserTier(userId: string): Promise<"free" | "premium"> {
  const result = await db
    .select({ tier: users.tier, tierExpiresAt: users.tierExpiresAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (result.length === 0) return "free";
  const user = result[0];
  if (user.tier === "premium") {
    if (user.tierExpiresAt && user.tierExpiresAt < new Date()) return "free";
    return "premium";
  }
  return "free";
}

export async function POST() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    // Tier-based daily test limit (from test-tiers.ts)
    const tier = await getUserTier(auth.sub);
    const maxDaily = getTestLimit(tier);

    // Count tests completed TODAY (not all-time)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(testSessions)
      .where(
        and(
          eq(testSessions.userId, auth.sub),
          eq(testSessions.status, "completed"),
          sql`${testSessions.startedAt} >= ${todayStart.toISOString()}::timestamp`
        )
      );

    if (!noLimit && (todayCount[0]?.count ?? 0) >= maxDaily) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DAILY_LIMIT_REACHED",
            message: tier === "free"
              ? `今日测试次数已达上限 (${maxDaily}次/天)，升级 Pro 可测 20 次/天`
              : `Today's test limit reached (${maxDaily}/day)`,
          },
          needsUpgrade: tier === "free",
        },
        { status: 429 }
      );
    }

    // Clean up any existing in_progress sessions (only allow 1 active)
    await db
      .update(testSessions)
      .set({ status: "abandoned" })
      .where(
        and(
          eq(testSessions.userId, auth.sub),
          eq(testSessions.status, "in_progress")
        )
      );

    const id = nanoid();
    await db.insert(testSessions).values({
      id,
      userId: auth.sub,
      status: "in_progress",
      startedAt: new Date(),
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "创建测试失败" },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    const tier = await getUserTier(auth.sub);
    const maxTests = getTestLimit(tier);

    const sessions = await db
      .select()
      .from(testSessions)
      .where(eq(testSessions.userId, auth.sub))
      .orderBy(desc(testSessions.startedAt))
      .limit(20);

    const completedCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(testSessions)
      .where(
        and(
          eq(testSessions.userId, auth.sub),
          eq(testSessions.status, "completed")
        )
      );

    return NextResponse.json({
      success: true,
      data: sessions,
      meta: {
        completedCount: completedCount[0]?.count || 0,
        maxTests: noLimit ? 9999 : maxTests,
        tier,
        devMode: isDev,
      },
    });
  } catch (error) {
    console.error("List sessions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "获取测试记录失败" },
      },
      { status: 500 }
    );
  }
}
