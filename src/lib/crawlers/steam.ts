import type { CrawledGame, CrawlResult } from "./types";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

// Genre mapping: Steam tags → our genre categories
const GENRE_MAP: Record<string, string> = {
  "first-person shooter": "fps",
  "fps": "fps",
  "shooter": "fps",
  "moba": "moba",
  "rpg": "rpg",
  "role-playing": "rpg",
  "action rpg": "rpg",
  "jrpg": "rpg",
  "rhythm": "rhythm",
  "music": "rhythm",
  "puzzle": "puzzle",
  "strategy": "strategy",
  "real-time strategy": "strategy",
  "turn-based strategy": "strategy",
  "battle royale": "battle_royale",
  "racing": "racing",
  "simulation": "simulation",
  "card game": "card",
  "card": "card",
  "adventure": "adventure",
  "sports": "sports",
  "platformer": "platformer",
  "fighting": "fighting",
  "horror": "horror",
  "survival": "survival",
  "sandbox": "sandbox",
  "open world": "open_world",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function mapGenres(tags: string[]): string[] {
  const genres = new Set<string>();
  for (const tag of tags) {
    const mapped = GENRE_MAP[tag.toLowerCase()];
    if (mapped) genres.add(mapped);
  }
  return Array.from(genres);
}

/**
 * Crawl Steam's top/new/popular game lists using Firecrawl
 */
export async function crawlSteam(limit = 20): Promise<CrawlResult> {
  const errors: string[] = [];
  const games: CrawledGame[] = [];

  if (!FIRECRAWL_API_KEY) {
    return { games: [], errors: ["FIRECRAWL_API_KEY not configured"], source: "steam" };
  }

  try {
    // Use Firecrawl extract to get structured data from Steam's featured page
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: "https://store.steampowered.com/search/?sort_by=Reviews_DESC&category1=998",
        formats: ["extract"],
        extract: {
          schema: {
            type: "object",
            properties: {
              games: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "string" },
                    releaseDate: { type: "string" },
                    reviewSummary: { type: "string" },
                    url: { type: "string" },
                  },
                },
              },
            },
          },
          prompt: `Extract the top ${limit} games from this Steam search results page. For each game, get the name, price, release date, review summary, and Steam store URL.`,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      errors.push(`Firecrawl scrape failed: ${res.status} ${errText.slice(0, 200)}`);
      return { games, errors, source: "steam" };
    }

    const data = await res.json();
    const extracted = data.data?.extract?.games || [];

    for (const item of extracted.slice(0, limit)) {
      if (!item.name) continue;

      const slug = `steam-${slugify(item.name)}`;
      games.push({
        name: item.name,
        nameEn: item.name,
        slug,
        platforms: ["pc"],
        genres: [],
        tags: [],
        priceInfo: item.price || undefined,
        releaseDate: item.releaseDate || undefined,
        sourceType: "steam",
      });
    }
  } catch (err) {
    errors.push(`Steam crawl error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { games, errors, source: "steam" };
}

/**
 * Crawl details for a specific Steam game page
 */
export async function crawlSteamGame(url: string): Promise<CrawledGame | null> {
  if (!FIRECRAWL_API_KEY) return null;

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["extract"],
        extract: {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              developer: { type: "string" },
              publisher: { type: "string" },
              genres: { type: "array", items: { type: "string" } },
              tags: { type: "array", items: { type: "string" } },
              price: { type: "string" },
              releaseDate: { type: "string" },
              rating: { type: "number" },
              coverImageUrl: { type: "string" },
            },
          },
          prompt: "Extract this Steam game's details: name, description, developer, publisher, genres/tags, price, release date, user rating (as percentage), and the main cover/header image URL.",
        },
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const item = data.data?.extract;
    if (!item?.name) return null;

    const genres = mapGenres([...(item.genres || []), ...(item.tags || [])]);

    return {
      name: item.name,
      nameEn: item.name,
      slug: `steam-${slugify(item.name)}`,
      description: item.description,
      descriptionEn: item.description,
      developer: item.developer,
      publisher: item.publisher,
      platforms: ["pc"],
      genres,
      tags: (item.tags || []).slice(0, 10),
      rating: item.rating ? Math.round(item.rating / 10) / 1 : undefined, // Convert % to 0-10
      priceInfo: item.price,
      releaseDate: item.releaseDate,
      coverUrl: item.coverImageUrl,
      sourceType: "steam",
    };
  } catch {
    return null;
  }
}
