import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq, or, isNull, sql } from "drizzle-orm";
import { searchRawg, getRawgDetails } from "@/lib/crawlers/rawg";
import {
  extractSteamAppId,
  getSteamAppDetails,
  getBestSteamCover,
} from "@/lib/crawlers/steam-api";

const BATCH_SIZE = 20;

/**
 * POST /api/cron/enrich-games — Enrich game metadata from RAWG + Steam APIs
 *
 * Finds games with missing data and fills in:
 * - coverUrl (high-quality from RAWG or Steam)
 * - description / descriptionEn
 * - developer / publisher
 * - rating (if missing)
 *
 * Auth: Bearer CRON_SECRET
 * Rate limit: processes BATCH_SIZE games per invocation
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find games needing enrichment: missing description OR developer OR has small Steam cover
  const needsEnrich = await db
    .select({
      id: games.id,
      name: games.name,
      nameEn: games.nameEn,
      slug: games.slug,
      coverUrl: games.coverUrl,
      description: games.description,
      descriptionEn: games.descriptionEn,
      developer: games.developer,
      publisher: games.publisher,
      rating: games.rating,
      sourceType: games.sourceType,
    })
    .from(games)
    .where(
      or(
        isNull(games.description),
        sql`${games.description} = ''`,
        isNull(games.developer),
        sql`${games.developer} = ''`,
        // Small Steam headers that should be upgraded
        sql`${games.coverUrl} LIKE '%header_292x136%'`,
        sql`${games.coverUrl} LIKE '%capsule_231x87%'`,
      )
    )
    .limit(BATCH_SIZE);

  if (needsEnrich.length === 0) {
    return NextResponse.json({
      success: true,
      data: { enriched: 0, message: "All games have complete data" },
    });
  }

  const results: { id: string; name: string; source: string; fields: string[] }[] = [];
  const errors: string[] = [];

  for (const game of needsEnrich) {
    const updates: Record<string, unknown> = {};
    const enrichedFields: string[] = [];
    let enrichSource = "none";

    try {
      // 1. Try Steam Store API if we have a Steam appid
      const steamAppId = game.coverUrl ? extractSteamAppId(game.coverUrl) : null;

      if (steamAppId) {
        const steamDetails = await getSteamAppDetails(steamAppId);
        if (steamDetails) {
          enrichSource = "steam";

          if (!game.description && steamDetails.short_description) {
            updates.description = steamDetails.short_description;
            enrichedFields.push("description");
          }
          if (!game.descriptionEn && steamDetails.short_description) {
            updates.descriptionEn = steamDetails.short_description;
            enrichedFields.push("descriptionEn");
          }
          if (!game.developer && steamDetails.developers?.length) {
            updates.developer = steamDetails.developers[0];
            enrichedFields.push("developer");
          }
          if (!game.publisher && steamDetails.publishers?.length) {
            updates.publisher = steamDetails.publishers[0];
            enrichedFields.push("publisher");
          }
          // Upgrade small cover to better Steam header
          if (game.coverUrl?.includes("header_292x136") || game.coverUrl?.includes("capsule_231x87")) {
            updates.coverUrl = getBestSteamCover(steamAppId, steamDetails);
            enrichedFields.push("coverUrl");
          }

          // Brief delay for Steam rate limit
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      // 2. Try RAWG for anything Steam didn't fill (or for non-Steam games)
      const searchName = game.nameEn || game.name;
      const rawgMatch = await searchRawg(searchName);

      if (rawgMatch) {
        enrichSource = enrichSource === "steam" ? "steam+rawg" : "rawg";

        // RAWG background_image is usually high quality (1920x1080)
        if (
          rawgMatch.background_image &&
          (!game.coverUrl ||
            game.coverUrl.includes("header_292x136") ||
            game.coverUrl.includes("capsule_231x87"))
        ) {
          // Only upgrade to RAWG if current cover is missing or low-quality
          if (!updates.coverUrl) {
            updates.coverUrl = rawgMatch.background_image;
            enrichedFields.push("coverUrl");
          }
        }

        // Always fetch RAWG details if we need description, developer, or publisher
        const needsDetail =
          (!game.description && !updates.description) ||
          (!game.developer && !updates.developer) ||
          (!game.publisher && !updates.publisher);

        if (needsDetail) {
          const details = await getRawgDetails(rawgMatch.id);
          if (details) {
            if (!game.description && !updates.description && details.description_raw) {
              const desc = details.description_raw.slice(0, 500);
              updates.description = desc;
              updates.descriptionEn = desc;
              enrichedFields.push("description", "descriptionEn");
            }
            if (!game.developer && !updates.developer && details.developers?.length) {
              updates.developer = details.developers[0].name;
              enrichedFields.push("developer");
            }
            if (!game.publisher && !updates.publisher && details.publishers?.length) {
              updates.publisher = details.publishers[0].name;
              enrichedFields.push("publisher");
            }
          }
        }

        if (!game.rating && rawgMatch.metacritic) {
          updates.rating = Math.round(rawgMatch.metacritic / 10 * 10) / 10;
          enrichedFields.push("rating");
        }
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();
        await db.update(games).set(updates).where(eq(games.id, game.id));
        results.push({
          id: game.id,
          name: game.name,
          source: enrichSource,
          fields: enrichedFields,
        });
      }
    } catch (err) {
      errors.push(`${game.name}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      enriched: results.length,
      checked: needsEnrich.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    },
  });
}
