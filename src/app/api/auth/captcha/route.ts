import { NextRequest, NextResponse } from "next/server";
import { generateCaptcha, cleanupExpiredCaptchas } from "@/lib/captcha";
import { checkRateLimit } from "@/lib/redis";

// Captcha must NEVER be cached — each request generates a unique token
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // IP-based rate limiting: max 20 captcha requests per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const { allowed, remaining } = await checkRateLimit(
      `rl:captcha:${ip}`,
      20,
      60
    );
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "请求过于频繁，请稍后再试" } },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": String(remaining),
          },
        }
      );
    }

    // Cleanup old captchas occasionally
    await cleanupExpiredCaptchas().catch(() => {});

    const { token, svg } = await generateCaptcha();
    return NextResponse.json(
      { success: true, data: { token, svg } },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  } catch (error) {
    console.error("Captcha generation error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "验证码生成失败" } },
      { status: 500 }
    );
  }
}
