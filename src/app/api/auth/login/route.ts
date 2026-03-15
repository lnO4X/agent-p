import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loginSchema } from "@/lib/validations";
import { verifyCaptcha } from "@/lib/captcha";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
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
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "用户名或密码错误" },
        },
        { status: 401 }
      );
    }

    // Issue JWT
    const token = await createToken({ sub: user.id, username: user.username });
    await setAuthCookie(token);

    // Return token in body so client can set cookie via document.cookie.
    // WeChat WKWebView doesn't reliably sync Set-Cookie from fetch() responses
    // to its navigation cookie store. Client-side cookie is the universal fix.
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
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "登录失败" },
      },
      { status: 500 }
    );
  }
}
