import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/notifications/mark-read — Mark all notifications as read
 */
export async function POST() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
      { status: 401 }
    );
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, auth.sub), eq(notifications.read, false)));

  return NextResponse.json({ success: true });
}
