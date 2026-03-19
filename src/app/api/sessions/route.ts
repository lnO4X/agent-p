import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { testSessions, users } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";

/** Tier-based test limits: free=3, premium=unlimited */
const MAX_TESTS = { free: 3, premium: 9999 } as const;
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

    // Tier-based test limit
    const tier = await getUserTier(auth.sub);
    const maxTests = MAX_TESTS[tier];

    const completedCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(testSessions)
      .where(
        and(
          eq(testSessions.userId, auth.sub),
          eq(testSessions.status, "completed")
        )
      );

    if (!noLimit && completedCount[0]?.count >= maxTests) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TEST_LIMIT_REACHED",
            message: tier === "free"
              ? `免费用户最多完成 ${maxTests} 次天赋测试，升级Premium无限制`
              : `已达到测试上限`,
          },
          needsUpgrade: tier === "free",
        },
        { status: 403 }
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
    const maxTests = MAX_TESTS[tier];

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
