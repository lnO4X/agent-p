import type { CrawledGame, CrawlResult } from "./types";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/**
 * Crawl TapTap's top/popular game lists using Firecrawl
 */
export async function crawlTapTap(limit = 20): Promise<CrawlResult> {
  const errors: string[] = [];
  const games: CrawledGame[] = [];

  if (!FIRECRAWL_API_KEY) {
    return { games: [], errors: ["FIRECRAWL_API_KEY not configured"], source: "taptap" };
  }

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: "https://www.taptap.cn/top/download",
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
                    nameEn: { type: "string" },
                    rating: { type: "number" },
                    genres: { type: "array", items: { type: "string" } },
                    description: { type: "string" },
                    developer: { type: "string" },
                    coverUrl: { type: "string" },
                  },
                },
              },
            },
          },
          prompt: `Extract the top ${limit} games from this TapTap ranking page. For each game, get the Chinese name, English name (if available), TapTap rating (out of 10), genres, short description, developer, and cover image URL.`,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      errors.push(`Firecrawl scrape failed: ${res.status} ${errText.slice(0, 200)}`);
      return { games, errors, source: "taptap" };
    }

    const data = await res.json();
    const extracted = data.data?.extract?.games || [];

    for (const item of extracted.slice(0, limit)) {
      if (!item.name) continue;

      const slug = `taptap-${slugify(item.nameEn || item.name)}`;
      games.push({
        name: item.name,
        nameEn: item.nameEn || undefined,
        slug,
        description: item.description || undefined,
        developer: item.developer || undefined,
        platforms: ["mobile"],
        genres: (item.genres || []).map((g: string) => g.toLowerCase()),
        tags: [],
        rating: item.rating || undefined,
        coverUrl: item.coverUrl || undefined,
        sourceType: "taptap",
      });
    }
  } catch (err) {
    errors.push(`TapTap crawl error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { games, errors, source: "taptap" };
}
