import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

/**
 * Retest reminder windows.
 *
 * A user whose most recent completed session lands inside one of these
 * ±1 day buckets is emailed — aligns with the existing RetestReminder
 * UI thresholds (30 / 90 / 180 days).
 */
type Window = {
  readonly days: number;
  readonly label: "30-day" | "quarterly" | "half-year";
  readonly zhTitle: string;
  readonly enTitle: string;
  readonly zhBody: string;
  readonly enBody: string;
};

const WINDOWS: ReadonlyArray<Window> = [
  {
    days: 30,
    label: "30-day",
    zhTitle: "30 天重测已就绪",
    enTitle: "Your 30-day retest is ready",
    zhBody:
      "距离上次 GameTan 测试已经 30 天。重测以查看你的认知图谱在一个月内的变化。",
    enBody:
      "It's been 30 days since your last GameTan assessment. Retest to see how your cognitive profile has shifted in a month.",
  },
  {
    days: 90,
    label: "quarterly",
    zhTitle: "季度重测时间到",
    enTitle: "Your quarterly retest is ready",
    zhBody:
      "距离上次测试已经 90 天。3 个月的窗口足以显示真实的能力变化。",
    enBody:
      "It's been 90 days since your last assessment. A 3-month window is enough to surface real ability change.",
  },
  {
    days: 180,
    label: "half-year",
    zhTitle: "6 个月重测时间到",
    enTitle: "Your half-year retest is ready",
    zhBody:
      "距离上次测试已经 6 个月。追踪长期认知变化，看训练是否见效。",
    enBody:
      "It's been 6 months since your last assessment. Track long-term cognitive change and see whether training is paying off.",
  },
];

interface CandidateRow {
  id: string;
  email: string | null;
  last_test: string;
}

function retestEmailHtml(opts: {
  username: string;
  zhTitle: string;
  enTitle: string;
  zhBody: string;
  enBody: string;
  ctaUrl: string;
}): string {
  const { username, zhTitle, enTitle, zhBody, enBody, ctaUrl } = opts;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 12px; font-size: 18px; color: #111;">
      ${zhTitle} / ${enTitle}
    </h2>
    <p style="font-size: 14px; color: #333; margin: 0 0 16px;">
      ${username}，${zhBody}<br><br>
      Hi ${username}, ${enBody}
    </p>
    <a href="${ctaUrl}" style="display: inline-block; background: #00D4AA; color: white; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
      重测 / Retest now
    </a>
    <p style="margin: 16px 0 0; font-size: 11px; color: #999;">
      GameTan · gametan.ai
    </p>
  </div>
</body>
</html>`;
}

async function sendRetestEmail(
  to: string,
  username: string,
  window: Window
): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  const ctaUrl = `${BASE_URL}/quiz`;
  if (!resendKey) {
    // In non-production, log what would have been sent so dev runs are debuggable.
    if (process.env.NODE_ENV !== "production") {
      logger.info(
        "cron.retest-reminders",
        "RESEND_API_KEY missing, skipping send",
        { to, window: window.label }
      );
    }
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GameTan <noreply@gametan.ai>",
        to,
        subject: `${window.zhTitle} / ${window.enTitle} — GameTan`,
        html: retestEmailHtml({
          username,
          zhTitle: window.zhTitle,
          enTitle: window.enTitle,
          zhBody: window.zhBody,
          enBody: window.enBody,
          ctaUrl,
        }),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "<unreadable>");
      logger.error("cron.retest-reminders", "Resend non-2xx", undefined, {
        status: res.status,
        body: body.slice(0, 200),
        to,
        window: window.label,
      });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("cron.retest-reminders", "Resend dispatch failed", err, {
      to,
      window: window.label,
    });
    return false;
  }
}

/**
 * POST /api/cron/retest-reminders — Daily retest reminder emails
 *
 * Auth: Bearer CRON_SECRET
 * Schedule: Daily 7 AM UTC (vercel.json)
 *
 * For each of the 30 / 90 / 180 day windows, finds users whose most
 * recent completed test session falls in a ±1 day bucket and emails
 * them a retest CTA. Uses users.last_retest_reminder_at (+ window) to
 * dedupe — re-running the same day is a no-op.
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const now = new Date();
  const results: Record<string, unknown> = {};
  let totalSent = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const window of WINDOWS) {
    const target = new Date(now);
    target.setUTCDate(target.getUTCDate() - window.days);
    const winStart = new Date(target);
    winStart.setUTCHours(0, 0, 0, 0);
    // ±1 day tolerance — end of next day so we never miss a bucket boundary.
    const winEnd = new Date(target);
    winEnd.setUTCDate(winEnd.getUTCDate() + 1);
    winEnd.setUTCHours(23, 59, 59, 999);
    const winStartIso = winStart.toISOString();
    const winEndIso = winEnd.toISOString();

    // Dedup fence: don't re-email a user who already received this window's
    // reminder within the last 7 days (covers daily re-runs + small clock drift).
    const dedupCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dedupIso = dedupCutoff.toISOString();

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    try {
      // Neon requires explicit ::timestamp casts on parameterised date values.
      const rows = await db.execute(sql`
        SELECT u.id, u.username, u.email, MAX(ts.completed_at) AS last_test
        FROM users u
        JOIN test_sessions ts ON ts.user_id = u.id
        WHERE ts.status = 'completed'
          AND u.email IS NOT NULL
        GROUP BY u.id, u.username, u.email
        HAVING MAX(ts.completed_at) BETWEEN ${winStartIso}::timestamp AND ${winEndIso}::timestamp
          AND (
            u.last_retest_reminder_at IS NULL
            OR u.last_retest_reminder_window IS DISTINCT FROM ${window.label}
            OR u.last_retest_reminder_at < ${dedupIso}::timestamp
          )
      `);

      const candidates = (
        Array.isArray(rows) ? rows : (rows as { rows?: unknown }).rows ?? []
      ) as Array<CandidateRow & { username: string }>;

      for (const row of candidates) {
        if (!row.email) {
          skipped += 1;
          continue;
        }

        const ok = await sendRetestEmail(row.email, row.username, window);
        if (ok) {
          await db
            .update(users)
            .set({
              lastRetestReminderAt: new Date(),
              lastRetestReminderWindow: window.label,
              updatedAt: new Date(),
            })
            .where(eq(users.id, row.id));
          sent += 1;
        } else {
          failed += 1;
        }
      }
    } catch (err) {
      logger.error(
        "cron.retest-reminders",
        `Window ${window.label} query/send failed`,
        err
      );
      results[window.label] = { error: String(err) };
      continue;
    }

    results[window.label] = { sent, skipped, failed };
    totalSent += sent;
    totalSkipped += skipped;
    totalFailed += failed;
  }

  logger.info("cron.retest-reminders", "completed", {
    totalSent,
    totalSkipped,
    totalFailed,
  });

  return NextResponse.json({
    success: true,
    data: {
      timestamp: now.toISOString(),
      totalSent,
      totalSkipped,
      totalFailed,
      windows: results,
    },
  });
}
