/**
 * Steam Store API client — direct HTTP (no Firecrawl)
 *
 * Free, no auth required for public game data.
 * Rate limit: ~1 req/sec recommended.
 */

export interface SteamAppDetails {
  name: string;
  steam_appid: number;
  detailed_description?: string;
  short_description?: string;
  developers?: string[];
  publishers?: string[];
  release_date?: { coming_soon: boolean; date: string };
  metacritic?: { score: number };
  header_image?: string;
  capsule_image?: string;
  screenshots?: { path_thumbnail: string; path_full: string }[];
  genres?: { id: string; description: string }[];
  categories?: { id: number; description: string }[];
}

/**
 * Extract Steam appid from a Steam CDN coverUrl.
 * e.g. "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/header.jpg" → 730
 */
export function extractSteamAppId(coverUrl: string): number | null {
  const match = coverUrl.match(/(?:steam\/apps|steamcommunity\/public\/images\/apps)\/(\d+)\//);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Fetch game details from Steam Store API by appid.
 */
export async function getSteamAppDetails(
  appid: number
): Promise<SteamAppDetails | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const entry = data[String(appid)];
    if (!entry?.success || !entry.data) return null;

    return entry.data as SteamAppDetails;
  } catch {
    return null;
  }
}

/**
 * Get the best cover image URL for a Steam game.
 * Priority: library_600x900 > header_image > capsule_image
 */
export function getBestSteamCover(appid: number, details?: SteamAppDetails | null): string {
  // library_600x900 is the high-quality vertical cover (may not exist for all games)
  const library = `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`;
  // header is always available
  const header = details?.header_image
    ?? `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`;

  // We can't check if library_600x900 exists without a HEAD request.
  // For batch enrichment, prefer the header which is guaranteed.
  // The library cover can be tried as a future optimization.
  return header;
}
