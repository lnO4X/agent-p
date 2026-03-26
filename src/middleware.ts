import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/leaderboard",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/captcha",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/google",
  "/api/auth/callback/google",
  "/api/auth/verify-email",
  "/api/voice/health",
  "/api/feedback",
  "/api/analytics",
];

/** API paths that handle their own auth (Bearer token, cron secret, etc.) */
const SELF_AUTH_PREFIXES = ["/api/admin/", "/api/cron/", "/api/webhooks/"];

/** Public prefixes — no auth required (shareable pages + their APIs) */
const PUBLIC_PREFIXES = [
  "/profile/", "/api/profile/",
  "/quiz", "/api/quiz/",
  "/explore", "/api/games/catalog",
  "/archetype",
  "/pk", "/api/pk",
  "/community", "/api/community",
  "/play", "/api/play",
  "/challenge", "/api/challenge",
  "/api/challenge/daily-ranking",
  "/api/challenge/card",
  "/api/archetype/card",
  "/api/pk/card",
  "/embed",
];

/** Cache the encoded secret to avoid re-encoding on every request */
let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array | null {
  if (cachedSecret) return cachedSecret;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  // Allow self-authenticated API routes (they check Bearer tokens internally)
  if (SELF_AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow public shareable pages (profiles, share cards)
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If JWT_SECRET is not loaded yet, allow through (avoids lockout on restart race condition)
  const secret = getSecret();
  if (!secret) {
    console.warn("[middleware] JWT_SECRET not loaded — passing request through");
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "登录已过期" },
        },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Edge runtime (default for middleware) — jose JWT, cookies, URL checks all Edge-compatible.
// DO NOT switch to "nodejs" — it causes "Response body disturbed" errors with streaming in standalone mode.

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
