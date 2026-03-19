import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { pkChallenges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { gameRegistry } from "@/games";
import { z } from "zod";

/**
 * GET /api/pk/[id] — Get PK challenge details (public, no auth)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await db
      .select()
      .from(pkChallenges)
      .where(eq(pkChallenges.id, id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "挑战不存在" } },
        { status: 404 }
      );
    }

    const pk = rows[0];
    const game = gameRegistry.get(pk.gameId);

    return NextResponse.json({
      success: true,
      data: {
        id: pk.id,
        gameId: pk.gameId,
        gameName: game?.name ?? pk.gameId,
        gameNameEn: game?.nameEn ?? pk.gameId,
        gameIcon: game?.icon ?? "🎮",
        creatorName: pk.creatorName,
        creatorScore: pk.creatorScore,
        challengerName: pk.challengerName,
        challengerScore: pk.challengerScore,
        status: pk.status,
        createdAt: pk.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get PK error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "获取挑战失败" } },
      { status: 500 }
    );
  }
}

const submitSchema = z.object({
  challengerName: z.string().min(1).max(30),
  rawScore: z.number(),
  durationMs: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/pk/[id] — Submit challenger score (public, no auth)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "参数不完整" } },
        { status: 400 }
      );
    }

    const rows = await db
      .select()
      .from(pkChallenges)
      .where(eq(pkChallenges.id, id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "挑战不存在" } },
        { status: 404 }
      );
    }

    const pk = rows[0];
    if (pk.status === "completed") {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_COMPLETED", message: "挑战已完成" } },
        { status: 400 }
      );
    }

    const game = gameRegistry.get(pk.gameId);
    if (!game) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "游戏不存在" } },
        { status: 404 }
      );
    }

    const { challengerName, rawScore, durationMs, metadata } = parsed.data;
    const normalizedScore = game.scorer.normalize(rawScore, durationMs ?? 0, metadata);

    await db
      .update(pkChallenges)
      .set({
        challengerName,
        challengerScore: normalizedScore,
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(pkChallenges.id, id));

    const creatorWins = pk.creatorScore > normalizedScore;
    const tie = Math.abs(pk.creatorScore - normalizedScore) < 0.5;

    return NextResponse.json({
      success: true,
      data: {
        challengerScore: normalizedScore,
        creatorScore: pk.creatorScore,
        creatorName: pk.creatorName,
        result: tie ? "tie" : creatorWins ? "creator_wins" : "challenger_wins",
      },
    });
  } catch (error) {
    console.error("Submit PK error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "提交挑战失败" } },
      { status: 500 }
    );
  }
}
