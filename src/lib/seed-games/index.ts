/**
 * Seed data for the games catalog — aggregated from platform-specific files.
 *
 * Organization:
 *   pc.ts            — PC games (~30)
 *   mobile.ts        — Mobile games (~22)
 *   console.ts       — Console games (~15)
 *   cross-platform.ts — Cross-platform games (~65)
 *   board.ts         — Board games (~20)
 *
 * To add games: edit the relevant platform file, then call POST /api/admin/seed.
 */

import type { SeedGame, RawSeedGame } from "./types";
import { PC_GAMES } from "./pc";
import { MOBILE_GAMES } from "./mobile";
import { CONSOLE_GAMES } from "./console";
import { CROSS_PLATFORM_GAMES } from "./cross-platform";
import { BOARD_GAMES } from "./board";

const _RAW_GAMES: RawSeedGame[] = [
  ...PC_GAMES,
  ...MOBILE_GAMES,
  ...CONSOLE_GAMES,
  ...CROSS_PLATFORM_GAMES,
  ...BOARD_GAMES,
];

/** Exported with auto-computed coverUrl from slug */
export const SEED_GAMES: SeedGame[] = _RAW_GAMES.map((g) => ({
  ...g,
  coverUrl: `/covers/${g.slug}.webp`,
}));

export type { SeedGame, RawSeedGame };
export { slugify } from "./types";
