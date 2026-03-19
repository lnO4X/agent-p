import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { sharedPartners, sharedPartnerLikes, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GET /api/marketplace/[id] — Get shared partner detail (includes definition)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const items = await db
    .select({
      id: sharedPartners.id,
      name: sharedPartners.name,
      avatar: sharedPartners.avatar,
      description: sharedPartners.description,
      definition: sharedPartners.definition,
      tags: sharedPartners.tags,
      usageCount: sharedPartners.usageCount,
      likeCount: sharedPartners.likeCount,
      authorId: sharedPartners.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      createdAt: sharedPartners.createdAt,
    })
    .from(sharedPartners)
    .innerJoin(users, eq(sharedPartners.authorId, users.id))
    .where(and(eq(sharedPartners.id, id), eq(sharedPartners.status, "active")))
    .limit(1);

  if (items.length === 0) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  // Increment usage count (view = potential use)
  await db
    .update(sharedPartners)
    .set({ usageCount: sql`${sharedPartners.usageCount} + 1` })
    .where(eq(sharedPartners.id, id));

  return NextResponse.json({ success: true, data: items[0] });
}

/**
 * POST /api/marketplace/[id] — Like/unlike a shared partner
 * Body: { action: "like" | "unlike" }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await request.json();

  if (action !== "like" && action !== "unlike") {
    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  }

  try {
    if (action === "like") {
      // Insert like (ignore if already liked)
      await db
        .insert(sharedPartnerLikes)
        .values({
          id: nanoid(),
          userId: auth.sub,
          sharedPartnerId: id,
        })
        .onConflictDoNothing();

      // Increment counter
      await db
        .update(sharedPartners)
        .set({ likeCount: sql`${sharedPartners.likeCount} + 1` })
        .where(eq(sharedPartners.id, id));
    } else {
      const deleted = await db
        .delete(sharedPartnerLikes)
        .where(
          and(
            eq(sharedPartnerLikes.userId, auth.sub),
            eq(sharedPartnerLikes.sharedPartnerId, id)
          )
        )
        .returning();

      if (deleted.length > 0) {
        await db
          .update(sharedPartners)
          .set({ likeCount: sql`greatest(${sharedPartners.likeCount} - 1, 0)` })
          .where(eq(sharedPartners.id, id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("marketplace like/unlike error:", err);
    return NextResponse.json(
      { success: false, error: "服务器错误 / Server error" },
      { status: 500 }
    );
  }
}
