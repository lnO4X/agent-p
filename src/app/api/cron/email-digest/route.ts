import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, microChallenges } from "@/db/schema";
import { isNotNull, eq, desc } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import { weeklyDigestHtml } from "@/lib/email/templates";

/**
 * POST /api/cron/email-digest — Send weekly digest to users with verified emails
 *
 * Auth: Bearer CRON_SECRET
 * Should be called weekly (e.g., every Monday).
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find users with verified emails
  const emailUsers = await db
    .select({ id: users.id, username: users.username, email: users.email })
    .from(users)
    .where(isNotNull(users.email));

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of emailUsers) {
    if (!user.email) { skipped++; continue; }

    try {
      // Get this user's challenges in the past 7 days
      const recentChallenges = await db
        .select({
          talentCategory: microChallenges.talentCategory,
          score: microChallenges.score,
          completedAt: microChallenges.completedAt,
        })
        .from(microChallenges)
        .where(
          eq(microChallenges.userId, user.id)
        )
        .orderBy(desc(microChallenges.completedAt))
        .limit(100);

      const weekChallenges = recentChallenges.filter(
        (c) => c.completedAt >= sevenDaysAgo
      );

      // Skip if no activity this week
      if (weekChallenges.length === 0) { skipped++; continue; }

      // Calculate streak (consecutive days with challenges)
      const daySet = new Set(
        recentChallenges.map((c) =>
          c.completedAt.toISOString().slice(0, 10)
        )
      );
      const today = new Date().toISOString().slice(0, 10);
      let streak = 0;
      const d = new Date();
      // Check from yesterday backwards (today might not have a challenge yet)
      d.setDate(d.getDate() - 1);
      while (daySet.has(d.toISOString().slice(0, 10))) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
      // If today has a challenge, add it
      if (daySet.has(today)) streak++;

      // Find best challenge this week
      const best = weekChallenges.reduce(
        (a, b) => (b.score > a.score ? b : a),
        weekChallenges[0]
      );

      const isZh = /[\u4e00-\u9fff]/.test(user.username);

      const html = weeklyDigestHtml({
        username: user.username,
        challengeCount: weekChallenges.length,
        streakDays: streak,
        topTalent: best.talentCategory,
        topScore: best.score,
        isZh,
      });

      const ok = await sendEmail({
        to: user.email,
        subject: isZh
          ? `GameTan 周报 — ${weekChallenges.length} 次挑战`
          : `GameTan Weekly — ${weekChallenges.length} challenges`,
        html,
      });

      if (ok) sent++;
      else skipped++;
    } catch (err) {
      errors.push(`${user.username}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    success: true,
    data: { sent, skipped, errors: errors.slice(0, 10), totalUsers: emailUsers.length },
  });
}
