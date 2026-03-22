import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${BASE_URL}/login?error=invalid_token`);
    }

    // Look up valid token: correct type, not expired, not used
    const rows = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          eq(verificationTokens.type, "email_verify"),
          gt(verificationTokens.expiresAt, new Date()),
          isNull(verificationTokens.usedAt)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.redirect(`${BASE_URL}/login?error=invalid_token`);
    }

    const verificationToken = rows[0];
    const now = new Date();

    // Update user emailVerifiedAt
    await db
      .update(users)
      .set({
        emailVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, verificationToken.userId));

    // Mark token as used
    await db
      .update(verificationTokens)
      .set({ usedAt: now })
      .where(eq(verificationTokens.id, verificationToken.id));

    return NextResponse.redirect(`${BASE_URL}/dashboard?email_verified=1`);
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.redirect(`${BASE_URL}/login?error=invalid_token`);
  }
}
