import { NextResponse } from "next/server";
import { db } from "@/db";
import { activationCodes, users } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";

// POST /api/billing/activate — Redeem activation code
export async function POST(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();

    if (!code || code.length < 4) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CODE", message: "无效的激活码" } },
        { status: 400 }
      );
    }

    // Find unused code
    const result = await db
      .select()
      .from(activationCodes)
      .where(
        and(
          eq(activationCodes.code, code),
          isNull(activationCodes.usedBy)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "CODE_NOT_FOUND", message: "激活码无效或已使用" } },
        { status: 404 }
      );
    }

    const codeRecord = result[0];

    // Check if code itself has expired
    if (codeRecord.expiresAt && codeRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: "CODE_EXPIRED", message: "激活码已过期" } },
        { status: 400 }
      );
    }

    // Calculate new expiry: extend from current expiry or from now
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
      // Extend from current expiry if still active
      baseDate = currentUser[0].tierExpiresAt;
    }

    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + codeRecord.durationDays);

    // Mark code as used
    await db
      .update(activationCodes)
      .set({ usedBy: auth.sub, usedAt: now })
      .where(eq(activationCodes.id, codeRecord.id));

    // Update user tier
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
        durationDays: codeRecord.durationDays,
      },
    });
  } catch (err) {
    console.error("billing/activate error:", err);
    return NextResponse.json(
      { success: false, error: "服务器错误，请重试 / Server error" },
      { status: 500 }
    );
  }
}
