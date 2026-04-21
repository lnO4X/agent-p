import type { GamePlugin } from "@/types/game";
import { patternScorer } from "./scorer";
import PatternGame from "./game";

/**
 * "Find the Odd One" — color-discrimination Quick-tier entry-funnel game.
 *
 * 4x4 grid; one tile's lightness differs slightly. User clicks the odd tile.
 * Difficulty ramps across 15 rounds (delta shrinks). Fun, fast, self-evident.
 *
 * For a research-grade pattern_recog measure, see src/games/posner/ (Posner
 * Cueing), which is included in the Pro tier.
 */
const plugin: GamePlugin = {
  id: "pattern",
  name: "\u627E\u4E0D\u540C", // 找不同
  nameEn: "Find the Odd One",
  description:
    "4x4 \u8272\u5757\u7F51\u683C\u4E2D\u627E\u51FA\u4E0D\u540C\u989C\u8272\u7684\u90A3\u4E2A\u3002\u6BCF\u8F6E\u8272\u5DEE\u53D8\u5C0F\u3002",
  primaryTalent: "pattern_recog",
  difficulty: "easy",
  estimatedDurationSec: 75,
  instructions:
    'In each round, one of the 16 tiles has a slightly different color. Click it. The color difference shrinks each round.',
  icon: "\uD83C\uDFA8", // 🎨
  scorer: patternScorer,
  component: PatternGame,
  mobileCompatible: true,
};

export default plugin;
