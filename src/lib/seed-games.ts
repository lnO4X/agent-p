/**
 * Seed data for the games catalog.
 *
 * NOTE: This file is now a re-export shim. Actual data is split by platform
 * under `src/lib/seed-games/` for maintainability. See `./seed-games/index.ts`.
 *
 * All existing imports (`from "@/lib/seed-games"`) continue to work.
 */

export { SEED_GAMES, slugify } from "./seed-games/index";
export type { SeedGame, RawSeedGame } from "./seed-games/index";
