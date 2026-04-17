import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { recommendationFeedback } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const feedbackSchema = z.object({
  gameId: z.string().min(1),
  signal: z.enum(["like", "dislike", "played", "wishlisted"]),
});

/**
 * POST /api/feedback/recommendation — Submit game recommendation feedback
 * Upserts: one signal per user per game
 */
export async function POST(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { gameId, signal } = parsed.data;

  // Upsert feedback
  await db
    .insert(recommendationFeedback)
    .values({
      id: nanoid(),
      userId: auth.sub,
      gameId,
      signal,
    })
    .onConflictDoUpdate({
      target: [recommendationFeedback.userId, recommendationFeedback.gameId],
      set: { signal, createdAt: new Date() },
    });

  return NextResponse.json({ success: true });
}

/**
 * GET /api/feedback/recommendation — Get user's feedback for games
 */
export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const feedback = await db
    .select({
      gameId: recommendationFeedback.gameId,
      signal: recommendationFeedback.signal,
    })
    .from(recommendationFeedback)
    .where(eq(recommendationFeedback.userId, auth.sub));

  // Also compute aggregate stats for data flywheel visibility
  const stats = await db
    .select({
      total: sql<number>`count(*)::int`,
      likes: sql<number>`count(*) filter (where signal = 'like')::int`,
      dislikes: sql<number>`count(*) filter (where signal = 'dislike')::int`,
      played: sql<number>`count(*) filter (where signal = 'played')::int`,
    })
    .from(recommendationFeedback)
    .where(eq(recommendationFeedback.userId, auth.sub));

  const hitRate = stats[0]?.total > 0
    ? Math.round(((stats[0].likes + stats[0].played) / stats[0].total) * 100)
    : null;

  return NextResponse.json({
    success: true,
    data: feedback,
    stats: {
      total: stats[0]?.total || 0,
      likes: stats[0]?.likes || 0,
      dislikes: stats[0]?.dislikes || 0,
      played: stats[0]?.played || 0,
      hitRate, // "推荐命中率"
    },
  });
}
