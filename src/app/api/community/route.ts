import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { communityPosts, communityPostLikes, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const createPostSchema = z.object({
  archetypeId: z.string().min(1).max(50),
  content: z.string().min(1).max(500),
});

/**
 * GET /api/community — List posts
 * Query: archetypeId (optional), page, limit
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const archetypeId = searchParams.get("archetypeId");
  const sort = searchParams.get("sort") === "hot" ? "hot" : "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  try {
    const auth = await getAuthFromCookie();

    const conditions = archetypeId
      ? eq(communityPosts.archetypeId, archetypeId)
      : undefined;

    const posts = await db
      .select({
        id: communityPosts.id,
        authorId: communityPosts.authorId,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        archetypeId: communityPosts.archetypeId,
        content: communityPosts.content,
        likeCount: communityPosts.likeCount,
        replyCount: communityPosts.replyCount,
        createdAt: communityPosts.createdAt,
      })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.authorId, users.id))
      .where(conditions)
      .orderBy(
        sort === "hot"
          ? desc(communityPosts.likeCount)
          : desc(communityPosts.createdAt),
        desc(communityPosts.createdAt)
      )
      .limit(limit)
      .offset(offset);

    // Check which posts the current user liked
    let likedPostIds: Set<string> = new Set();
    if (auth) {
      const likes = await db
        .select({ postId: communityPostLikes.postId })
        .from(communityPostLikes)
        .where(eq(communityPostLikes.userId, auth.sub));
      likedPostIds = new Set(likes.map((l) => l.postId));
    }

    const total = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityPosts)
      .where(conditions);

    return NextResponse.json({
      success: true,
      data: posts.map((p) => ({
        ...p,
        liked: likedPostIds.has(p.id),
      })),
      meta: {
        total: total[0]?.count || 0,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("community list error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "服务器错误" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community — Create a new post
 */
export async function POST(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "内容格式不正确" } },
        { status: 400 }
      );
    }

    const { archetypeId, content } = parsed.data;

    const newPost = await db
      .insert(communityPosts)
      .values({
        id: nanoid(),
        authorId: auth.sub,
        archetypeId,
        content,
      })
      .returning();

    return NextResponse.json({ success: true, data: newPost[0] }, { status: 201 });
  } catch (error) {
    console.error("community post create error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "服务器错误" } },
      { status: 500 }
    );
  }
}
