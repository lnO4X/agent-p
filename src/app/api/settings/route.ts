import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/settings — Get user settings
export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db
    .select({
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
      personalityType: users.personalityType,
    })
    .from(users)
    .where(eq(users.id, auth.sub))
    .limit(1);

  if (user.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: user[0] });
}
