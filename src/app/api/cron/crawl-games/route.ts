import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import { crawlSteam, crawlTapTap } from "@/lib/crawlers";
import { discoverRawgGames } from "@/lib/crawlers/rawg";
import type { CrawledGame } from "@/lib/crawlers";

/**
 * POST /api/cron/crawl-games — Crawl Steam and/or TapTap for new games
 *
 * Body: { source?: "steam" | "taptap" | "all", limit?: number }
 * Auth: Bearer CRON_SECRET
 *
 * Upserts crawled games by slug. New games are set to status="pending" for admin review.
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const source = (body.source as string) || "all";
  const limit = Math.min(Number(body.limit) || 20, 50);
  const page = Number(body.page) || 1;

  const results: { source: string; added: number; skipped: number; errors: string[] }[] = [];

  // Crawl RAWG (free, preferred — searches competitive/esports games)
  if (source === "rawg" || source === "all") {
    const rawgResult = await discoverRawgGames(limit, page);
    const { added, skipped } = await upsertGames(rawgResult.games);
    results.push({ source: "rawg", added, skipped, errors: rawgResult.errors });
  }

  // Crawl Steam (Firecrawl — more expensive, use sparingly)
  if (source === "steam") {
    const steamResult = await crawlSteam(limit);
    const { added, skipped } = await upsertGames(steamResult.games);
    results.push({ source: "steam", added, skipped, errors: steamResult.errors });
  }

  // Crawl TapTap
  if (source === "taptap") {
    const taptapResult = await crawlTapTap(limit);
    const { added, skipped } = await upsertGames(taptapResult.games);
    results.push({ source: "taptap", added, skipped, errors: taptapResult.errors });
  }

  return NextResponse.json({
    success: true,
    data: { results },
  });
}

async function upsertGames(crawledGames: CrawledGame[]): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;

  for (const game of crawledGames) {
    // Check if slug already exists
    const existing = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.slug, game.slug))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await db.insert(games).values({
      id: nanoid(),
      name: game.name,
      nameEn: game.nameEn || null,
      slug: game.slug,
      description: game.description || null,
      descriptionEn: game.descriptionEn || null,
      developer: game.developer || null,
      publisher: game.publisher || null,
      coverUrl: game.coverUrl || null,
      rating: game.rating || null,
      popularity: game.popularity || 0,
      releaseDate: game.releaseDate || null,
      platforms: game.platforms,
      genres: game.genres,
      tags: game.tags,
      priceInfo: game.priceInfo || null,
      sourceType: game.sourceType,
      status: "pending", // Needs admin review
    });
    added++;
  }

  return { added, skipped };
}
