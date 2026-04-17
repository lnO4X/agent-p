import { NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { SEED_GAMES } from "@/lib/seed-games";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/seed
 *
 * Upserts seed games into the games table.
 * Protected by CRON_SECRET in production.
 *
 * Query params:
 *   ?force=true  — delete all seed-sourced games first, then re-insert
 */
export async function POST(request: Request) {
  // Auth check — always enforce CRON_SECRET regardless of environment
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";

    if (force) {
      // Delete existing seed games before re-inserting
      await db.delete(games).where(sql`${games.sourceType} = 'seed'`);
    }

    let inserted = 0;

    for (const game of SEED_GAMES) {
      const id = `game_${game.slug}`;
      const values = {
        id,
        name: game.name,
        nameEn: game.nameEn,
        slug: game.slug,
        description: game.description,
        descriptionEn: game.descriptionEn ?? null,
        coverUrl: game.coverUrl ?? null,
        developer: game.developer ?? null,
        publisher: game.publisher ?? null,
        platforms: game.platforms,
        genres: game.genres,
        rating: game.rating,
        popularity: game.popularity,
        priceInfo: game.priceInfo,
        releaseDate: game.releaseDate ?? null,
        sourceType: "seed" as const,
        status: "active" as const,
        updatedAt: new Date(),
      };

      const result = await db
        .insert(games)
        .values({ ...values, createdAt: new Date() })
        .onConflictDoUpdate({
          target: games.slug,
          set: {
            name: values.name,
            nameEn: values.nameEn,
            description: values.description,
            descriptionEn: values.descriptionEn,
            coverUrl: values.coverUrl,
            developer: values.developer,
            publisher: values.publisher,
            platforms: values.platforms,
            genres: values.genres,
            rating: values.rating,
            popularity: values.popularity,
            priceInfo: values.priceInfo,
            releaseDate: values.releaseDate,
            updatedAt: values.updatedAt,
          },
        })
        .returning({ id: games.id });

      if (result.length > 0) {
        // Check if this was an insert or update by seeing if the createdAt changed
        // For simplicity, count all as processed
        inserted++;
      }
    }

    // Get final count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(games);

    return NextResponse.json({
      success: true,
      processed: inserted,
      totalSeedGames: SEED_GAMES.length,
      totalGamesInDb: Number(countResult[0]?.count ?? 0),
    });
  } catch (error) {
    logger.error("admin.seed", "Seed failed", error);
    return NextResponse.json(
      { success: false, error: "Seed failed", details: String(error) },
      { status: 500 }
    );
  }
}
