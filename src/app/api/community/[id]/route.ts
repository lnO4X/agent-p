import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { communityPosts, communityPostLikes, communityReplies, users, notifications } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { communityLikedHtml, communityRepliedHtml } from "@/lib/email/templates";

const replySchema = z.object({
  content: z.string().min(1).max(300),
});

/**
 * GET /api/community/[id] — Get post detail with replies
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const post = await db
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
      .where(eq(communityPosts.id, id))
      .limit(1);

    if (post.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "帖子不存在" } },
        { status: 404 }
      );
    }

    // Get replies
    const replies = await db
      .select({
        id: communityReplies.id,
        authorId: communityReplies.authorId,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        content: communityReplies.content,
        createdAt: communityReplies.createdAt,
      })
      .from(communityReplies)
      .innerJoin(users, eq(communityReplies.authorId, users.id))
      .where(eq(communityReplies.postId, id))
      .orderBy(desc(communityReplies.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      data: { ...post[0], replies },
    });
  } catch (error) {
    console.error("community GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "服务器错误" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/[id] — Like/unlike or reply to a post
 * Body: { action: "like" | "unlike" } or { action: "reply", content: "..." }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  if (action === "like") {
    const inserted = await db
      .insert(communityPostLikes)
      .values({ id: nanoid(), userId: auth.sub, postId: id })
      .onConflictDoNothing()
      .returning();
    if (inserted.length > 0) {
      await db
        .update(communityPosts)
        .set({ likeCount: sql`${communityPosts.likeCount} + 1` })
        .where(eq(communityPosts.id, id));
      // Notify post author (skip self-likes)
      const post = await db
        .select({
          authorId: communityPosts.authorId,
          authorUsername: users.username,
          content: communityPosts.content,
          authorEmail: users.email,
        })
        .from(communityPosts)
        .innerJoin(users, eq(communityPosts.authorId, users.id))
        .where(eq(communityPosts.id, id))
        .limit(1);
      if (post.length > 0 && post[0].authorId !== auth.sub) {
        await db.insert(notifications).values({
          id: nanoid(),
          userId: post[0].authorId,
          type: "post_liked",
          postId: id,
          senderId: auth.sub,
        });
        // Send email notification if author has email
        if (post[0].authorEmail) {
          void sendEmail({
            to: post[0].authorEmail,
            subject: `${auth.username} 点赞了你的帖子 / liked your post`,
            html: communityLikedHtml({
              authorUsername: post[0].authorUsername,
              senderUsername: auth.username,
              postContent: post[0].content,
              postId: id,
            }),
          });
        }
      }
    }
    return NextResponse.json({ success: true });
  }

  if (action === "unlike") {
    const deleted = await db
      .delete(communityPostLikes)
      .where(
        and(
          eq(communityPostLikes.userId, auth.sub),
          eq(communityPostLikes.postId, id)
        )
      )
      .returning();
    if (deleted.length > 0) {
      await db
        .update(communityPosts)
        .set({ likeCount: sql`greatest(${communityPosts.likeCount} - 1, 0)` })
        .where(eq(communityPosts.id, id));
    }
    return NextResponse.json({ success: true });
  }

  if (action === "reply") {
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "内容格式不正确" } },
        { status: 400 }
      );
    }

    const reply = await db
      .insert(communityReplies)
      .values({
        id: nanoid(),
        postId: id,
        authorId: auth.sub,
        content: parsed.data.content,
      })
      .returning();

    await db
      .update(communityPosts)
      .set({ replyCount: sql`${communityPosts.replyCount} + 1` })
      .where(eq(communityPosts.id, id));

    // Notify post author (skip self-replies)
    const post = await db
      .select({
        authorId: communityPosts.authorId,
        authorUsername: users.username,
        content: communityPosts.content,
        authorEmail: users.email,
      })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.authorId, users.id))
      .where(eq(communityPosts.id, id))
      .limit(1);
    if (post.length > 0 && post[0].authorId !== auth.sub) {
      await db.insert(notifications).values({
        id: nanoid(),
        userId: post[0].authorId,
        type: "post_replied",
        postId: id,
        senderId: auth.sub,
      });
      // Send email notification if author has email
      if (post[0].authorEmail) {
        void sendEmail({
          to: post[0].authorEmail,
          subject: `${auth.username} 回复了你的帖子 / replied to your post`,
          html: communityRepliedHtml({
            authorUsername: post[0].authorUsername,
            senderUsername: auth.username,
            replyContent: parsed.data.content,
            postContent: post[0].content,
            postId: id,
          }),
        });
      }
    }

    return NextResponse.json({ success: true, data: reply[0] }, { status: 201 });
  }

  return NextResponse.json(
    { success: false, error: { code: "BAD_REQUEST", message: "Invalid action" } },
    { status: 400 }
  );
}
