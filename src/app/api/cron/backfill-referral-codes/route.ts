import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * POST /api/cron/backfill-referral-codes
 * Backfill referral codes for existing users who don't have one.
 * Auth: Bearer CRON_SECRET
 */
// GET handler for Vercel Cron (sends GET with Authorization: Bearer CRON_SECRET)
export async function GET(request: NextRequest) {
  return handleBackfill(request);
}

// POST handler for manual invocation
export async function POST(request: NextRequest) {
  return handleBackfill(request);
}

async function handleBackfill(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usersWithout = await db
    .select({ id: users.id })
    .from(users)
    .where(isNull(users.referralCode));

  let updated = 0;
  for (const u of usersWithout) {
    const code = generateReferralCode();
    try {
      await db
        .update(users)
        .set({ referralCode: code })
        .where(eq(users.id, u.id));
      updated++;
    } catch {
      // Retry with different code on unique constraint collision
      const code2 = generateReferralCode();
      await db
        .update(users)
        .set({ referralCode: code2 })
        .where(eq(users.id, u.id));
      updated++;
    }
  }

  return NextResponse.json({
    success: true,
    data: { backfilled: updated, total: usersWithout.length },
  });
}
