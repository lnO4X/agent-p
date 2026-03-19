import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

/**
 * GET /api/notifications — List notifications + unread count for current user
 */
export async function GET(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  const [rows, [{ unreadCount }]] = await Promise.all([
    db
      .select({
        id: notifications.id,
        type: notifications.type,
        postId: notifications.postId,
        read: notifications.read,
        createdAt: notifications.createdAt,
        senderUsername: users.username,
        senderDisplayName: users.displayName,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.senderId, users.id))
      .where(eq(notifications.userId, auth.sub))
      .orderBy(desc(notifications.createdAt))
      .limit(limit),
    db
      .select({ unreadCount: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, auth.sub), eq(notifications.read, false))),
  ]);

  return NextResponse.json({ success: true, data: rows, unreadCount });
}
