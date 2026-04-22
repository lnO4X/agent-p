import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, captchaSessions } from "@/db/schema";
import { sql, lt, eq, and } from "drizzle-orm";
import { gameRegistry } from "@/games";

// 18 games: 17 original + posner (added in M5 when Pattern was split into Quick-tier
// "Find the Odd One" + Pro-tier Posner Cueing for research-grade pattern_recog).
const EXPECTED_GAME_COUNT = 18;

/**
 * POST /api/cron/integrity-check — Daily data integrity check
 *
 * Auth: Bearer CRON_SECRET
 * Schedule: Daily 6 AM UTC (vercel.json)
 *
 * Checks:
 *  1. Expired premium users → downgrade to free
 *  2. Expired captcha sessions → cleanup
 *  3. Game registry consistency
 *  4. Stats snapshot
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const issues: string[] = [];

  // 1. Downgrade expired premium users
  try {
    const now = new Date().toISOString();
    const expired = await db
      .update(users)
      .set({ tier: "free", updatedAt: new Date() })
      .where(
        and(
          eq(users.tier, "premium"),
          lt(users.tierExpiresAt, sql`${now}::timestamp`)
        )
      )
      .returning({ id: users.id });

    results.expiredPremium = { downgraded: expired.length };
    if (expired.length > 0) {
      issues.push(`Downgraded ${expired.length} expired premium users`);
    }
  } catch (err) {
    results.expiredPremium = { error: String(err) };
    issues.push(`Failed to check expired premium: ${err}`);
  }

  // 2. Cleanup expired captcha sessions
  try {
    const deleted = await db
      .delete(captchaSessions)
      .where(lt(captchaSessions.expiresAt, new Date()))
      .returning({ id: captchaSessions.id });

    results.captchaCleanup = { deleted: deleted.length };
  } catch (err) {
    results.captchaCleanup = { error: String(err) };
  }

  // 3. Game registry consistency
  try {
    const registeredCount = gameRegistry.getAll().length;
    const ok = registeredCount === EXPECTED_GAME_COUNT;
    results.gameRegistry = {
      ok,
      registered: registeredCount,
      expected: EXPECTED_GAME_COUNT,
    };
    if (!ok) {
      issues.push(
        `Game registry mismatch: ${registeredCount}/${EXPECTED_GAME_COUNT}`
      );
    }
  } catch (err) {
    results.gameRegistry = { error: String(err) };
    issues.push(`Game registry check failed: ${err}`);
  }

  // 4. Stats snapshot
  try {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const [premiumCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.tier, "premium"));

    results.stats = {
      totalUsers: Number(userCount?.count ?? 0),
      premiumUsers: Number(premiumCount?.count ?? 0),
    };
  } catch (err) {
    results.stats = { error: String(err) };
  }

  return NextResponse.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      issues,
      issueCount: issues.length,
      results,
    },
  });
}
