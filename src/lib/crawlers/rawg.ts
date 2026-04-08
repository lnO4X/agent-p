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
