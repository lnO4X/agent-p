import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { pkChallenges } from "@/db/schema";
import { gameRegistry } from "@/games";
import { z } from "zod";

const createSchema = z.object({
  gameId: z.string().min(1),
  creatorName: z.string().min(1).max(30),
  rawScore: z.number(),
  durationMs: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/pk — Create a PK challenge (no auth required for viral sharing)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "参数不完整" } },
        { status: 400 }
      );
    }

    const { gameId, creatorName, rawScore, durationMs, metadata } = parsed.data;

    const game = gameRegistry.get(gameId);
    if (!game) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "游戏不存在" } },
        { status: 404 }
      );
    }

    // Normalize score using game's scorer
    const normalizedScore = game.scorer.normalize(rawScore, durationMs ?? 0, metadata);

    const id = nanoid(10); // short ID for sharing URLs
    await db.insert(pkChallenges).values({
      id,
      gameId,
      creatorName,
      creatorScore: normalizedScore,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        normalizedScore,
        shareUrl: `/pk/${id}`,
      },
    });
  } catch (error) {
    console.error("Create PK error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "创建挑战失败" } },
      { status: 500 }
    );
  }
}
