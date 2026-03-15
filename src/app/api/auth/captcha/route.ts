import { NextResponse } from "next/server";
import { generateCaptcha, cleanupExpiredCaptchas } from "@/lib/captcha";

// Captcha must NEVER be cached — each request generates a unique token
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Cleanup old captchas occasionally
    await cleanupExpiredCaptchas().catch(() => {});

    const { token, svg } = await generateCaptcha();
    return NextResponse.json(
      { success: true, data: { token, svg } },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
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
