import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { logger } from "@/lib/logger";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "缺少令牌 / Token is required"),
  password: z
    .string()
    .min(6, "密码至少6个字符 / Password must be at least 6 characters")
    .max(50, "密码最多50个字符"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0].message,
          },
        },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Look up valid token: correct type, not expired, not used
    const rows = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          eq(verificationTokens.type, "password_reset"),
          gt(verificationTokens.expiresAt, new Date()),
          isNull(verificationTokens.usedAt)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message:
              "链接无效或已过期，请重新申请 / Invalid or expired link, please request a new one",
          },
        },
        { status: 400 }
      );
    }

    const verificationToken = rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    // Update user's password and reset lockout
    await db
      .update(users)
      .set({
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: now,
      })
      .where(eq(users.id, verificationToken.userId));

    // Mark token as used
    await db
      .update(verificationTokens)
      .set({ usedAt: now })
      .where(eq(verificationTokens.id, verificationToken.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("auth.reset-password", "Reset password failed", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "重置失败，请稍后重试 / Reset failed, please try again",
        },
      },
      { status: 500 }
    );
  }
}
