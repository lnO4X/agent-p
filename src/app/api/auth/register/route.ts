import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registerSchema } from "@/lib/validations";
import { verifyCaptcha } from "@/lib/captcha";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
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

    const { username, password, captchaToken, captchaAnswer } = parsed.data;

    // Verify captcha
    const captchaValid = await verifyCaptcha(captchaToken, captchaAnswer);
    if (!captchaValid) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "CAPTCHA_INVALID", message: "验证码错误或已过期" },
        },
        { status: 400 }
      );
    }

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
    console.error("Register error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "注册失败" },
      },
      { status: 500 }
    );
  }
}
