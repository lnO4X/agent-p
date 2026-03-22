import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/redis";
import { sendEmail } from "@/lib/email/send";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

const forgotPasswordSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址 / Please enter a valid email"),
});

function resetPasswordHtml(opts: { username: string; resetUrl: string }): string {
  const { username, resetUrl } = opts;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 12px; font-size: 18px; color: #111;">
      重置密码 / Reset Password
    </h2>
    <p style="font-size: 14px; color: #333; margin: 0 0 16px;">
      ${username}，你请求了密码重置。点击下方按钮设置新密码，链接1小时内有效。<br><br>
      Hi ${username}, you requested a password reset. Click below to set a new password. This link expires in 1 hour.
    </p>
    <a href="${resetUrl}" style="display: inline-block; background: #007AFF; color: white; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
      重置密码 / Reset Password
    </a>
    <p style="margin: 16px 0 0; font-size: 11px; color: #999;">
      如果你没有请求重置密码，请忽略此邮件。/ If you didn't request this, please ignore this email.
    </p>
    <p style="margin: 8px 0 0; font-size: 11px; color: #999;">GameTan · gametan.ai</p>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    // IP-based rate limiting: max 3 per hour
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed } = await checkRateLimit(`rl:forgot-pwd:${ip}`, 3, 3600);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message:
              "请求过于频繁，请稍后再试 / Too many requests, please try again later",
          },
        },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
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

    const { email } = parsed.data;

    // Look up user by email — always return success to avoid leaking user existence
    const rows = await db
      .select({ id: users.id, username: users.username, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (rows.length === 0 || !rows[0].email) {
      return NextResponse.json({ success: true });
    }

    const user = rows[0];

    // Generate password_reset token (1 hour expiry)
    const token = nanoid(48);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    await db.insert(verificationTokens).values({
      id: nanoid(),
      userId: user.id,
      type: "password_reset",
      token,
      expiresAt,
      createdAt: now,
    });

    // Send reset email
    const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email!,
      subject: "重置密码 / Reset Your Password — GameTan",
      html: resetPasswordHtml({ username: user.username, resetUrl }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "请求失败，请稍后重试 / Request failed, please try again",
        },
      },
      { status: 500 }
    );
  }
}
