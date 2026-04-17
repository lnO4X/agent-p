/**
 * Shared types for seed game data files.
 *
 * Genre keys must match GENRE_TALENT_MAP in constants.ts:
 *   fps | moba | rpg | rhythm | puzzle | strategy | battle_royale | racing | simulation | card
 *
 * Platform keys:
 *   pc | mobile | console | cross_platform
 */

export interface SeedGame {
  name: string;
  nameEn: string;
  slug: string;
  description: string;
  descriptionEn?: string;
  developer?: string;
  publisher?: string;
  platforms: string[];
  genres: string[];
  rating: number;
  popularity: number; // 0-100, higher = more popular
  priceInfo: string;
  releaseDate?: string; // "2024-03-15" or "2024"
  coverUrl?: string;
}

export type RawSeedGame = Omit<SeedGame, "coverUrl">;

/** Helper: generate a slug from English name */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
