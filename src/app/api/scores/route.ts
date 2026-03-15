import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { gameScores } from "@/db/schema";
import { submitScoreSchema } from "@/lib/validations";
import { getAuthFromCookie } from "@/lib/auth";
import { gameRegistry } from "@/games";

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = submitScoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0].message,
          },
        },
        { status: 400 }
      );
    }

    const { sessionId, gameId, rawScore, durationMs, metadata } = parsed.data;

    const game = gameRegistry.get(gameId);
    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "游戏不存在" },
        },
        { status: 404 }
      );
    }

    const normalizedScore = game.scorer.normalize(rawScore, durationMs, metadata);

    const id = nanoid();
    await db.insert(gameScores).values({
      id,
      sessionId,
      userId: auth.sub,
      gameId,
      talentCategory: game.primaryTalent,
      rawScore,
      normalizedScore,
      metadata: metadata || {},
      playedAt: new Date(),
      durationMs,
    });

    return NextResponse.json({
      success: true,
      data: { id, normalizedScore, talentCategory: game.primaryTalent },
    });
  } catch (error) {
    console.error("Submit score error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "提交分数失败" },
      },
      { status: 500 }
    );
  }
}
