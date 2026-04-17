import { NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * GET /api/games/catalog/[slug]
 *
 * Get a single game by slug.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const result = await db
      .select()
      .from(games)
      .where(and(eq(games.slug, slug), eq(games.status, "active")))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "游戏不存在" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    logger.error("games.catalog", "Game detail failed", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "获取游戏详情失败" } },
      { status: 500 }
    );
  }
}
