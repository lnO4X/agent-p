import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";

const PLANS: Record<string, { days: number }> = {
  monthly: { days: 30 },
  quarterly: { days: 90 },
  yearly: { days: 365 },
};

// POST /api/billing/mock-purchase — Mock payment, directly grant premium
export async function POST(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const planId = String(body.planId || "");

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PLAN", message: "无效的套餐" } },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentUser = await db
      .select({ tier: users.tier, tierExpiresAt: users.tierExpiresAt })
      .from(users)
      .where(eq(users.id, auth.sub))
      .limit(1);

    let baseDate = now;
    if (
      currentUser.length > 0 &&
      currentUser[0].tier === "premium" &&
      currentUser[0].tierExpiresAt &&
      currentUser[0].tierExpiresAt > now
    ) {
      baseDate = currentUser[0].tierExpiresAt;
    }

    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + plan.days);

    await db
      .update(users)
      .set({
        tier: "premium",
        tierExpiresAt: newExpiry,
        updatedAt: now,
      })
      .where(eq(users.id, auth.sub));

    return NextResponse.json({
      success: true,
      data: {
        tier: "premium",
        expiresAt: newExpiry.toISOString(),
        durationDays: plan.days,
      },
    });
  } catch (err) {
    console.error("billing/mock-purchase error:", err);
    return NextResponse.json(
      { success: false, error: "服务器错误，请重试 / Server error" },
      { status: 500 }
    );
  }
}
