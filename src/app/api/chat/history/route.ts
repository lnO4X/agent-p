import { NextRequest } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { chatMessages, partners } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const MAX_HISTORY = 50;

/**
 * GET /api/chat/history?partnerId=xxx
 * Returns the last 50 messages for user+partner in UIMessage format.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const partnerId = request.nextUrl.searchParams.get("partnerId");
  if (!partnerId) {
    return Response.json(
      { success: false, error: "partnerId required" },
      { status: 400 }
    );
  }

  // Verify user owns the partner
  try {
    const [partner] = await db
      .select({ id: partners.id })
      .from(partners)
      .where(and(eq(partners.id, partnerId), eq(partners.userId, auth.sub)))
      .limit(1);

    if (!partner) {
      return Response.json(
        { success: false, error: "Partner not found" },
        { status: 404 }
      );
    }
  } catch {
    return Response.json(
      { success: false, error: "Database error" },
      { status: 503 }
    );
  }

  // Load recent messages (newest first, then reverse for chronological order)
  try {
    const rows = await db
      .select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.userId, auth.sub),
          eq(chatMessages.partnerId, partnerId)
        )
      )
      .orderBy(desc(chatMessages.createdAt))
      .limit(MAX_HISTORY);

    // Reverse to chronological order, convert to UIMessage format
    const messages = rows.reverse().map((row) => ({
      id: row.id,
      role: row.role,
      parts: [{ type: "text" as const, text: row.content }],
      createdAt: row.createdAt.toISOString(),
    }));

    return Response.json({ success: true, data: messages });
  } catch {
    return Response.json(
      { success: false, error: "Database error" },
      { status: 503 }
    );
  }
}
