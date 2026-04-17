import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loginSchema } from "@/lib/validations";
import { createToken, setAuthCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/redis";
import { logger } from "@/lib/logger";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    // IP-based rate limiting: max 10 login attempts per 5 minutes
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const { allowed } = await checkRateLimit(`rl:login:${ip}`, 10, 300);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMITED", message: "登录尝试过于频繁，请5分钟后再试" },
        },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
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

    const { username, password } = parsed.data;

    // Find user
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "用户名或密码错误" },
        },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message: `账号已锁定，请${minutesLeft}分钟后再试 / Account locked, try again in ${minutesLeft} minutes`,
          },
        },
        { status: 423 }
      );
    }

    // Check if user has a password (OAuth-only users don't)
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_PASSWORD",
            message: "此账号通过 Google 登录，请使用 Google 登录 / This account uses Google sign-in",
          },
        },
        { status: 400 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      // Increment failed attempts
      const newAttempts = user.failedLoginAttempts + 1;
      const updates: Record<string, unknown> = {
        failedLoginAttempts: newAttempts,
        updatedAt: new Date(),
      };

      // Lock account after MAX_FAILED_ATTEMPTS
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      }

      await db.update(users).set(updates).where(eq(users.id, user.id));

      const remainingAttempts = MAX_FAILED_ATTEMPTS - newAttempts;
      const message = remainingAttempts > 0
        ? `用户名或密码错误 (剩余${remainingAttempts}次) / Wrong credentials (${remainingAttempts} attempts left)`
        : `账号已锁定${LOCKOUT_MINUTES}分钟 / Account locked for ${LOCKOUT_MINUTES} minutes`;

      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message },
        },
        { status: 401 }
      );
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await db.update(users).set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));
    }

    // Issue JWT
    const token = await createToken({ sub: user.id, username: user.username });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        token,
      },
    });
  } catch (error) {
    logger.error("auth.login", "Login failed", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "登录失败" },
      },
      { status: 500 }
    );
  }
}
