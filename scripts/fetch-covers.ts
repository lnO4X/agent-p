/**
 * Fetch real game cover images from multiple sources and save as .webp.
 *
 * Usage: npx tsx scripts/fetch-covers.ts
 *
 * Sources (tried in order, with download verification):
 *   1. Steam Store API (PC/Steam games)
 *   2. Wikipedia API (broad coverage, free, no key needed)
 *
 * - Skips games that already have a .webp file (safe for re-runs)
 * - Falls through to next source when download fails
 * - Rate-limited: 500ms between requests
 * - Graceful per-game error handling (never aborts the whole run)
 */

import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";

// ── Types ──

interface RawGame {
  name: string;
  nameEn: string;
  slug: string;
  genres: string[];
}

interface SteamSearchResult {
  total: number;
  items: { id: number; name: string }[];
}

// ── Helpers ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const UA = "GameTan-CoverFetcher/2.0 (game catalog; contact: dev@gametan.ai)";

/**
 * Download an image URL and convert to webp. Returns true on success.
 */
async function downloadImageToWebp(
  imageUrl: string,
  outPath: string
): Promise<boolean> {
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });

    if (!res.ok) return false;

    const contentType = res.headers.get("content-type") || "";
    if (
      !contentType.includes("image") &&
      !contentType.includes("octet-stream")
    ) {
      return false;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 1000) return false;

    await sharp(buffer)
      .resize(400, 225, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(outPath);

    return true;
  } catch {
    return false;
  }
}

// ── Source 1: Steam ──

async function trySteamUrls(nameEn: string): Promise<string[]> {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(nameEn)}&l=english&cc=US`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return [];

    const data = (await res.json()) as SteamSearchResult;
    if (!data.items || data.items.length === 0) return [];

    // Return header URLs for top 2 results (in case first is wrong game)
    return data.items
      .slice(0, 2)
      .map(
        (item) =>
          `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`
      );
  } catch {
    return [];
  }
}

// ── Source 2: Wikipedia ──

interface WikiPage {
  thumbnail?: { source: string };
  original?: { source: string };
}

async function tryWikipediaUrls(nameEn: string): Promise<string[]> {
  const urls: string[] = [];

  // Search variations
  const searchTerms = [
    `${nameEn} video game`,
    `${nameEn} game`,
    nameEn,
  ];

  for (const term of searchTerms) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&format=json&srlimit=2`;
      const searchRes = await fetch(searchUrl, {
        headers: { "User-Agent": UA },
      });
      if (!searchRes.ok) continue;

      const searchData = (await searchRes.json()) as {
        query: { search: { title: string }[] };
      };
      if (!searchData.query?.search?.length) continue;

      for (const result of searchData.query.search) {
        const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=pageimages&format=json&pithumbsize=800&piprop=thumbnail|original`;
        const imgRes = await fetch(imgUrl, {
          headers: { "User-Agent": UA },
        });
        if (!imgRes.ok) continue;

        const imgData = (await imgRes.json()) as {
          query: { pages: Record<string, WikiPage> };
        };

        for (const page of Object.values(imgData.query.pages)) {
          const src = page.original?.source || page.thumbnail?.source;
          if (src && !src.endsWith(".svg")) {
            urls.push(src);
          }
        }
      }

      if (urls.length > 0) break; // Found results, stop searching
      await sleep(200); // Respect Wikipedia rate limits
    } catch {
      continue;
    }
  }

  return urls;
}

// ── Source functions registry ──

type SourceFn = (nameEn: string, slug: string) => Promise<string[]>;

const SOURCES: { name: string; fn: SourceFn }[] = [
  {
    name: "steam",
    fn: (nameEn) => trySteamUrls(nameEn),
  },
  {
    name: "wikipedia",
    fn: (nameEn) => tryWikipediaUrls(nameEn),
  },
];

// ── Main ──

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const seedModule = require("../src/lib/seed-games");
  const rawGames: RawGame[] = seedModule.SEED_GAMES;

  const outDir = join(__dirname, "..", "public", "covers");
  mkdirSync(outDir, { recursive: true });

  const total = rawGames.length;
  let success = 0;
  let skipped = 0;
  let failed = 0;
  const failures: { slug: string; reason: string }[] = [];
  const sourceCounts: Record<string, number> = {};

  console.log(`\nFetching covers for ${total} games...\n`);

  for (let i = 0; i < total; i++) {
    const game = rawGames[i];
    const outPath = join(outDir, `${game.slug}.webp`);
    const index = `[${i + 1}/${total}]`;

    // Skip if .webp already exists
    if (existsSync(outPath)) {
      console.log(`${index} ~ ${game.slug} (exists)`);
      skipped++;
      continue;
    }

    let found = false;

    // Try each source; for each source, try each URL; stop on first success
    for (const source of SOURCES) {
      const candidateUrls = await source.fn(game.nameEn, game.slug);

      for (const url of candidateUrls) {
        const ok = await downloadImageToWebp(url, outPath);
        if (ok) {
          console.log(`${index} ✓ ${game.slug} [${source.name}]`);
          success++;
          sourceCounts[source.name] = (sourceCounts[source.name] || 0) + 1;
          found = true;
          break;
        }
      }

      if (found) break;
      await sleep(200);
    }

    if (!found) {
      console.log(`${index} ✗ ${game.slug} — no source worked`);
      failures.push({ slug: game.slug, reason: "No source found" });
      failed++;
    }

    // Rate limit
    await sleep(300);
  }

  // ── Summary ──
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Done: ${success} success, ${skipped} skipped, ${failed} failed`);

  const sourceStr = Object.entries(sourceCounts)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  if (sourceStr) console.log(`Sources: ${sourceStr}`);

  if (failures.length > 0) {
    console.log(`\nStill missing (${failures.length}):`);
    for (const f of failures) {
      console.log(`  - ${f.slug}`);
    }
  }

  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
