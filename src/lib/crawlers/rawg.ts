/**
 * RAWG.io API client — game metadata enrichment
 *
 * Free tier: 20 req/sec, API key required
 * Docs: https://rawg.io/apidocs
 */

const RAWG_BASE = "https://api.rawg.io/api";

export interface RawgGame {
  id: number;
  name: string;
  description_raw?: string;
  background_image?: string;
  released?: string;
  metacritic?: number;
  rating?: number;
  developers?: { name: string }[];
  publishers?: { name: string }[];
  genres?: { name: string; slug: string }[];
  platforms?: { platform: { name: string; slug: string } }[];
  tags?: { name: string; slug: string }[];
}

export interface RawgSearchResult {
  count: number;
  results: RawgGame[];
}

/**
 * Search RAWG for a game by name. Returns the best match or null.
 */
export async function searchRawg(
  gameName: string
): Promise<RawgGame | null> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return null;

  const url = `${RAWG_BASE}/games?key=${apiKey}&search=${encodeURIComponent(gameName)}&page_size=3`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const data = (await res.json()) as RawgSearchResult;
    if (!data.results?.length) return null;

    // Find best match by name similarity
    const normalized = gameName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const match = data.results.find((r) => {
      const rNorm = r.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return rNorm === normalized || rNorm.includes(normalized) || normalized.includes(rNorm);
    });

    return match ?? data.results[0];
  } catch {
    return null;
  }
}

/** RAWG genre slug → our genre mapping */
const RAWG_GENRE_MAP: Record<string, string> = {
  shooter: "fps",
  action: "fps",
  strategy: "strategy",
  rpg: "rpg",
  racing: "racing",
  puzzle: "puzzle",
  simulation: "simulation",
  sports: "sports",
  fighting: "fighting",
  adventure: "adventure",
  platformer: "platformer",
  casual: "puzzle",
  indie: "adventure",
};

/** RAWG platform slug → our platform */
const RAWG_PLATFORM_MAP: Record<string, string> = {
  pc: "pc",
  playstation: "console",
  xbox: "console",
  nintendo: "console",
  ios: "mobile",
  android: "mobile",
  linux: "pc",
  mac: "pc",
  web: "pc",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/**
 * Discover new competitive/esports games from RAWG.
 * Searches by tags like "competitive", "esports", "multiplayer".
 * Returns games formatted as CrawledGame for insertion.
 */
export async function discoverRawgGames(
  limit = 20,
  page = 1
): Promise<{ games: CrawledGame[]; errors: string[] }> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return { games: [], errors: ["RAWG_API_KEY not configured"] };

  const errors: string[] = [];
  const discovered: CrawledGame[] = [];

  // Search for competitive/esports/multiplayer games, ordered by rating
  const tags = "competitive,esports,multiplayer,pvp";
  const url = `${RAWG_BASE}/games?key=${apiKey}&tags=${tags}&ordering=-metacritic&page_size=${limit}&page=${page}&dates=2020-01-01,2026-12-31`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      errors.push(`RAWG API error: ${res.status}`);
      return { games: [], errors };
    }

    const data = (await res.json()) as RawgSearchResult;
    if (!data.results?.length) return { games: [], errors };

    for (const game of data.results) {
      const genres = (game.genres || [])
        .map((g) => RAWG_GENRE_MAP[g.slug] || g.slug)
        .filter((v, i, a) => a.indexOf(v) === i);

      const platformSlugs = (game.platforms || []).map(
        (p) => p.platform.slug.split("-")[0]
      );
      const platforms = [...new Set(
        platformSlugs.map((s) => RAWG_PLATFORM_MAP[s] || "pc")
      )];

      const tags = (game.tags || [])
        .slice(0, 10)
        .map((t) => t.name.toLowerCase());

      discovered.push({
        name: game.name,
        nameEn: game.name,
        slug: slugify(game.name),
        description: game.description_raw?.slice(0, 500) || undefined,
        descriptionEn: game.description_raw?.slice(0, 500) || undefined,
        developer: game.developers?.[0]?.name,
        publisher: game.publishers?.[0]?.name,
        platforms,
        genres,
        tags,
        rating: game.metacritic ? Math.round(game.metacritic / 10 * 10) / 10 : game.rating ? Math.round(game.rating * 2 * 10) / 10 : undefined,
        popularity: game.metacritic || undefined,
        releaseDate: game.released || undefined,
        coverUrl: game.background_image || undefined,
        sourceType: "steam", // RAWG sources are mostly Steam/multi-platform
      });
    }
  } catch (err) {
    errors.push(`RAWG discover error: ${err instanceof Error ? err.message : "unknown"}`);
  }

  return { games: discovered, errors };
}

import type { CrawledGame } from "./types";

/**
 * Fetch detailed game info from RAWG by ID (includes description).
 */
export async function getRawgDetails(
  gameId: number
): Promise<RawgGame | null> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `${RAWG_BASE}/games/${gameId}?key=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    return (await res.json()) as RawgGame;
  } catch {
    return null;
  }
}
