import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/auth/me — Get current user info
export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  const user = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, auth.sub))
    .limit(1);

  if (user.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: user[0] });
}
