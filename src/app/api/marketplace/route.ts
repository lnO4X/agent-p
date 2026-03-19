import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { sharedPartners, sharedPartnerLikes, users } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const publishSchema = z.object({
  name: z.string().min(1).max(20),
  avatar: z.string().min(1),
  description: z.string().min(1).max(200),
  definition: z.string().min(10).max(2000),
  tags: z.array(z.string().max(20)).max(5).optional(),
});

/**
 * GET /api/marketplace — Browse shared partner definitions
 * Query params: sort=popular|newest, page=1, limit=20
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "popular";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  const auth = await getAuthFromCookie();

  const orderBy = sort === "newest"
    ? desc(sharedPartners.createdAt)
    : desc(sharedPartners.likeCount);

  const items = await db
    .select({
      id: sharedPartners.id,
      name: sharedPartners.name,
      avatar: sharedPartners.avatar,
      description: sharedPartners.description,
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
    .where(eq(sharedPartners.status, "active"))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // If user is logged in, check which ones they liked
  let likedIds: Set<string> = new Set();
  if (auth) {
    const likes = await db
      .select({ sharedPartnerId: sharedPartnerLikes.sharedPartnerId })
      .from(sharedPartnerLikes)
      .where(eq(sharedPartnerLikes.userId, auth.sub));
    likedIds = new Set(likes.map((l) => l.sharedPartnerId));
  }

  const total = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sharedPartners)
    .where(eq(sharedPartners.status, "active"));

  return NextResponse.json({
    success: true,
    data: items.map((item) => ({
      ...item,
      liked: likedIds.has(item.id),
    })),
    meta: {
      total: total[0]?.count || 0,
      page,
      limit,
    },
  });
}

/**
 * POST /api/marketplace — Publish a partner definition to marketplace
 */
export async function POST(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "参数不完整" } },
      { status: 400 }
    );
  }

  const { name, avatar, description, definition, tags } = parsed.data;

  const newItem = await db
    .insert(sharedPartners)
    .values({
      id: nanoid(),
      authorId: auth.sub,
      name,
      avatar,
      description,
      definition,
      tags: tags || [],
    })
    .returning();

  return NextResponse.json({ success: true, data: newItem[0] }, { status: 201 });
}
