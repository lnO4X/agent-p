import { NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { sql, and, ilike, eq } from "drizzle-orm";

/**
 * GET /api/games/catalog
 *
 * Paginated game catalog with filters.
 * Query params:
 *   platform  — pc | mobile | console | cross_platform
 *   genre     — fps | moba | rpg | rhythm | puzzle | strategy | battle_royale | racing | simulation | card
 *   search    — text search on name/nameEn
 *   sort      — popularity (default) | rating | name
 *   page      — 1-based page number (default: 1)
 *   limit     — items per page (default: 20, max: 100)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const platform = url.searchParams.get("platform");
    const genre = url.searchParams.get("genre");
    const search = url.searchParams.get("search");
    const sort = url.searchParams.get("sort") || "popularity";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") || "20") || 20)
    );
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [eq(games.status, "active")];

    if (platform) {
      conditions.push(sql`${games.platforms} @> ${JSON.stringify([platform])}::jsonb`);
    }
    if (genre) {
      conditions.push(sql`${games.genres} @> ${JSON.stringify([genre])}::jsonb`);
    }
    if (search) {
      // Escape LIKE metacharacters to prevent unintended pattern matching
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      conditions.push(
        sql`(${ilike(games.name, `%${escaped}%`)} OR ${ilike(games.nameEn, `%${escaped}%`)})`
      );
    }

    const where = and(...conditions);

    // Sort
    const orderBy =
      sort === "rating"
        ? sql`${games.rating} DESC NULLS LAST`
        : sort === "name"
          ? sql`${games.name} ASC`
          : sql`${games.popularity} DESC NULLS LAST`;

    // Query
    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(games)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(games)
        .where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Catalog error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "获取游戏列表失败" } },
      { status: 500 }
    );
  }
}
