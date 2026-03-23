import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { users, referrals } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { createToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE, LOGGED_IN_COOKIE_NAME } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface GoogleUserInfo {
  id: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle Google errors (user cancelled, etc.)
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(`${BASE_URL}/login?error=google`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${BASE_URL}/login?error=google`);
    }

    // Validate CSRF state (read from request cookies)
    const storedState = request.cookies.get("google_oauth_state")?.value;

    if (!storedState || storedState !== state) {
      console.error("Google OAuth state mismatch");
      return NextResponse.redirect(`${BASE_URL}/login?error=google`);
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.error("Google OAuth credentials not configured");
      return NextResponse.redirect(`${BASE_URL}/login?error=google`);
    }

    const redirectUri = `${BASE_URL}/api/auth/callback/google`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google token exchange failed:", tokenRes.status, err.slice(0, 200));
      return NextResponse.redirect(`${BASE_URL}/login?error=google`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!userInfoRes.ok) {
      console.error("Google userinfo failed:", userInfoRes.status);
      return NextResponse.redirect(`${BASE_URL}/login?error=google`);
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();
    if (!googleUser.id) {
      console.error("Google userinfo missing id");
      return NextResponse.redirect(`${BASE_URL}/login?error=google`);
    }

    const now = new Date();

    // Find existing user by googleId or email
    const conditions = [eq(users.googleId, googleUser.id)];
    if (googleUser.email) {
      conditions.push(eq(users.email, googleUser.email));
    }

    const existingRows = await db
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(2);

    let user: typeof existingRows[0] | undefined;

    // Prefer match by googleId
    const byGoogleId = existingRows.find((u) => u.googleId === googleUser.id);
    const byEmail = existingRows.find(
      (u) => u.email === googleUser.email && !u.googleId
    );

    if (byGoogleId) {
      // Case 1: User exists by googleId — login directly
      user = byGoogleId;
    } else if (byEmail) {
      // Case 2: User exists by email but no googleId — link Google account
      await db
        .update(users)
        .set({
          googleId: googleUser.id,
          avatarUrl: googleUser.picture || byEmail.avatarUrl,
          emailVerifiedAt: byEmail.emailVerifiedAt || (googleUser.verified_email ? now : null),
          updatedAt: now,
        })
        .where(eq(users.id, byEmail.id));
      user = byEmail;
    } else {
      // Case 3: New user — create account
      const id = nanoid();
      const referralCode = generateReferralCode();
      const username = googleUser.email
        ? googleUser.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20)
        : `user_${nanoid(8)}`;

      // Ensure username uniqueness
      const usernameExists = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      const finalUsername =
        usernameExists.length > 0 ? `${username}_${nanoid(4)}` : username;

      await db.insert(users).values({
        id,
        username: finalUsername,
        displayName: googleUser.name || finalUsername,
        email: googleUser.email || null,
        emailVerifiedAt: googleUser.verified_email ? now : null,
        googleId: googleUser.id,
        avatarUrl: googleUser.picture || null,
        referralCode,
        createdAt: now,
        updatedAt: now,
      });

      user = {
        id,
        username: finalUsername,
        displayName: googleUser.name || finalUsername,
        email: googleUser.email || null,
        emailVerifiedAt: googleUser.verified_email ? now : null,
        googleId: googleUser.id,
        avatarUrl: googleUser.picture || null,
        passwordHash: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        isProfilePublic: true,
        isAdmin: false,
        tier: "free" as const,
        tierExpiresAt: null,
        referralCode,
        steamId: null,
        steamUsername: null,
        personalityType: null,
        createdAt: now,
        updatedAt: now,
      };
    }

    // Issue JWT and set cookie on the redirect response
    // NOTE: Cannot use setAuthCookie() here because cookies() API writes to a
    // separate response object that gets discarded when we return NextResponse.redirect().
    const jwt = await createToken({ sub: user.id, username: user.username });
    const response = NextResponse.redirect(`${BASE_URL}/dashboard`);
    response.cookies.set(AUTH_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: "/",
    });
    // Non-httpOnly indicator so client JS can detect login state
    response.cookies.set(LOGGED_IN_COOKIE_NAME, "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: "/",
    });
    // Clean up OAuth state cookie
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(`${BASE_URL}/login?error=google`);
  }
}
