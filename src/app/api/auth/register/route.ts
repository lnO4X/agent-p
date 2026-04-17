import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registerSchema } from "@/lib/validations";
import { createToken, setAuthCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/redis";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // IP-based rate limiting: max 5 registrations per hour
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const { allowed } = await checkRateLimit(`rl:register:${ip}`, 5, 3600);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMITED", message: "注册尝试过于频繁，请稍后再试" },
        },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
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

    // Check if username exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: "用户名已存在" },
        },
        { status: 409 }
      );
    }

    // Create user
    const id = nanoid();
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    await db.insert(users).values({
      id,
      username,
      passwordHash,
      displayName: username,
      createdAt: now,
      updatedAt: now,
    });

    // Issue JWT
    const token = await createToken({ sub: id, username });
    await setAuthCookie(token);

    // Return token in body for client-side cookie setting (WeChat WKWebView fix)
    return NextResponse.json({
      success: true,
      data: { id, username, displayName: username, token },
    });
  } catch (error) {
    logger.error("auth.register", "Register failed", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "注册失败" },
      },
      { status: 500 }
    );
  }
}
