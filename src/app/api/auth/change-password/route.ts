import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { changePasswordSchema } from "@/lib/validations";
import { getAuthFromCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/redis";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "未登录" },
        },
        { status: 401 }
      );
    }

    // Rate limit: max 5 change-password attempts per user per 15 minutes
    const { allowed } = await checkRateLimit(`rl:chpwd:${auth.sub}`, 5, 900);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMITED", message: "修改密码过于频繁，请15分钟后再试 / Too many attempts, please retry in 15 minutes" },
        },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
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

    const { currentPassword, newPassword } = parsed.data;

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.sub))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "用户不存在" },
        },
        { status: 404 }
      );
    }

    const user = rows[0];

    // OAuth-only users don't have a password
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NO_PASSWORD", message: "此账号通过 Google 登录，无法修改密码 / This account uses Google sign-in" },
        },
        { status: 400 }
      );
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "当前密码错误" },
        },
        { status: 401 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, auth.sub));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("auth.change-password", "Change password failed", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "修改密码失败" },
      },
      { status: 500 }
    );
  }
}
