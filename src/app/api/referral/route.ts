import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, referrals } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";

/**
 * GET /api/referral — Get current user's referral code + stats
 */
export async function GET() {
  const user = await getAuthFromCookie();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Get user's referral code
    const [userData] = await db
      .select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    // Count referrals
    const [stats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(eq(referrals.referrerId, user.sub));

    return NextResponse.json({
      success: true,
      data: {
        referralCode: userData?.referralCode || null,
        totalReferrals: Number(stats?.count ?? 0),
      },
    });
  } catch (err) {
    console.error("referral GET error:", err);
    return NextResponse.json(
      { success: false, error: "服务器错误 / Server error" },
      { status: 500 }
    );
  }
}
