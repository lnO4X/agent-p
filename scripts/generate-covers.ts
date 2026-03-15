/**
 * Generate SVG cover images for all seed games.
 *
 * Usage: npx tsx scripts/generate-covers.ts
 *
 * Produces one SVG per game in public/covers/{slug}.svg.
 * Each SVG uses a genre-specific gradient + decorative shapes + game name.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// ── Import seed data directly (relative path from project root) ──
// We inline the interface so this script doesn't depend on TS path aliases
interface SeedGame {
  name: string;
  nameEn: string;
  slug: string;
  description: string;
  platforms: string[];
  genres: string[];
  rating: number;
  popularity: number;
  priceInfo: string;
}

// ── Genre visual themes ──
interface GenreTheme {
  from: string;
  to: string;
  accent: string;
  icon: string; // SVG path/shape for decorative element
  label: string;
}

const GENRE_THEMES: Record<string, GenreTheme> = {
  fps: {
    from: "#DC2626",
    to: "#991B1B",
    accent: "#FCA5A5",
    label: "射击",
    icon: `<circle cx="200" cy="130" r="40" fill="none" stroke="__ACCENT__" stroke-width="2" opacity="0.3"/>
      <line x1="200" y1="80" x2="200" y2="180" stroke="__ACCENT__" stroke-width="1.5" opacity="0.3"/>
      <line x1="150" y1="130" x2="250" y2="130" stroke="__ACCENT__" stroke-width="1.5" opacity="0.3"/>
      <circle cx="200" cy="130" r="8" fill="none" stroke="__ACCENT__" stroke-width="2" opacity="0.4"/>`,
  },
  moba: {
    from: "#7C3AED",
    to: "#4C1D95",
    accent: "#C4B5FD",
    label: "MOBA",
    icon: `<polygon points="200,85 235,115 222,155 178,155 165,115" fill="none" stroke="__ACCENT__" stroke-width="2" opacity="0.3"/>
      <polygon points="200,100 220,118 213,143 187,143 180,118" fill="none" stroke="__ACCENT__" stroke-width="1.5" opacity="0.2"/>`,
  },
  rpg: {
    from: "#2563EB",
    to: "#1E3A8A",
    accent: "#93C5FD",
    label: "RPG",
    icon: `<path d="M200,80 L200,170 M185,95 L215,95 M180,110 L220,110" stroke="__ACCENT__" stroke-width="2" opacity="0.3" fill="none"/>
      <circle cx="200" cy="80" r="6" fill="__ACCENT__" opacity="0.2"/>`,
  },
  rhythm: {
    from: "#EC4899",
    to: "#9D174D",
    accent: "#F9A8D4",
    label: "音游",
    icon: `<circle cx="190" cy="140" r="15" fill="none" stroke="__ACCENT__" stroke-width="2" opacity="0.3"/>
      <line x1="205" y1="140" x2="205" y2="90" stroke="__ACCENT__" stroke-width="2" opacity="0.3"/>
      <path d="M205,90 Q215,85 215,95" fill="__ACCENT__" opacity="0.2"/>
      <circle cx="220" cy="120" r="8" fill="__ACCENT__" opacity="0.15"/>`,
  },
  puzzle: {
    from: "#10B981",
    to: "#065F46",
    accent: "#6EE7B7",
    label: "益智",
    icon: `<path d="M175,110 L195,110 L195,100 Q200,95 205,100 L205,110 L225,110 L225,130 L215,130 Q210,135 215,140 L225,140 L225,160 L175,160 L175,140 L185,140 Q190,135 185,130 L175,130 Z" fill="none" stroke="__ACCENT__" stroke-width="2" opacity="0.3"/>`,
  },
  strategy: {
    from: "#F59E0B",
    to: "#92400E",
    accent: "#FDE68A",
    label: "策略",
    icon: `<rect x="175" y="105" width="20" height="20" fill="__ACCENT__" opacity="0.15"/>
      <rect x="205" y="105" width="20" height="20" fill="none" stroke="__ACCENT__" stroke-width="1.5" opacity="0.3"/>
      <rect x="175" y="135" width="20" height="20" fill="none" stroke="__ACCENT__" stroke-width="1.5" opacity="0.3"/>
      <rect x="205" y="135" width="20" height="20" fill="__ACCENT__" opacity="0.15"/>`,
  },
  battle_royale: {
    from: "#EF4444",
    to: "#7C2D12",
    accent: "#FCA5A5",
    label: "大逃杀",
    icon: `<circle cx="200" cy="130" r="45" fill="none" stroke="__ACCENT__" stroke-width="2" opacity="0.2"/>
      <circle cx="200" cy="130" r="30" fill="none" stroke="__ACCENT__" stroke-width="1.5" opacity="0.25"/>
      <circle cx="200" cy="130" r="15" fill="none" stroke="__ACCENT__" stroke-width="1.5" opacity="0.3"/>`,
  },
  racing: {
    from: "#06B6D4",
    to: "#164E63",
    accent: "#67E8F9",
    label: "竞速",
    icon: `<line x1="155" y1="140" x2="245" y2="110" stroke="__ACCENT__" stroke-width="2" opacity="0.2"/>
      <line x1="155" y1="130" x2="245" y2="100" stroke="__ACCENT__" stroke-width="1.5" opacity="0.15"/>
      <line x1="155" y1="150" x2="245" y2="120" stroke="__ACCENT__" stroke-width="1.5" opacity="0.15"/>
      <path d="M230,105 L245,100 L240,115" fill="none" stroke="__ACCENT__" stroke-width="2" opacity="0.25"/>`,
  },
  simulation: {
    from: "#22C55E",
    to: "#14532D",
    accent: "#86EFAC",
    label: "模拟",
    icon: `<circle cx="200" cy="130" r="30" fill="none" stroke="__ACCENT__" stroke-width="2" opacity="0.25"/>
      <path d="M200,100 L200,115 M200,145 L200,160 M170,130 L185,130 M215,130 L230,130" stroke="__ACCENT__" stroke-width="2" opacity="0.2"/>
      <rect x="193" y="123" width="14" height="14" rx="2" fill="none" stroke="__ACCENT__" stroke-width="1.5" opacity="0.3"/>`,
  },
  card: {
    from: "#A855F7",
    to: "#581C87",
    accent: "#D8B4FE",
    label: "卡牌",
    icon: `<rect x="180" y="100" width="30" height="45" rx="3" fill="none" stroke="__ACCENT__" stroke-width="2" opacity="0.3" transform="rotate(-10,195,122)"/>
      <rect x="195" y="100" width="30" height="45" rx="3" fill="none" stroke="__ACCENT__" stroke-width="2" opacity="0.25" transform="rotate(5,210,122)"/>`,
  },
};

// Default theme for games with unknown genre
const DEFAULT_THEME: GenreTheme = {
  from: "#6B7280",
  to: "#374151",
  accent: "#D1D5DB",
  label: "游戏",
  icon: `<circle cx="200" cy="130" r="25" fill="none" stroke="__ACCENT__" stroke-width="2" opacity="0.2"/>`,
};

// Platform emoji/labels
const PLATFORM_ICONS: Record<string, string> = {
  pc: "💻",
  mobile: "📱",
  console: "🎮",
  cross_platform: "🌐",
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Truncate text to fit in SVG (approximate) */
function truncate(str: string, maxChars: number): string {
  if (str.length <= maxChars) return str;
  return str.slice(0, maxChars - 1) + "…";
}

function generateSvg(game: SeedGame): string {
  const primaryGenre = game.genres[0] || "";
  const theme = GENRE_THEMES[primaryGenre] || DEFAULT_THEME;
  const icon = theme.icon.replace(/__ACCENT__/g, theme.accent);

  const gameName = escapeXml(truncate(game.name, 14));
  const gameNameEn = escapeXml(truncate(game.nameEn, 30));
  const genreLabels = game.genres
    .slice(0, 2)
    .map((g) => GENRE_THEMES[g]?.label || g)
    .join(" · ");
  const platformIcons = game.platforms
    .slice(0, 3)
    .map((p) => PLATFORM_ICONS[p] || "")
    .join(" ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.from}"/>
      <stop offset="100%" stop-color="${theme.to}"/>
    </linearGradient>
    <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="70%" stop-color="rgba(0,0,0,0.4)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.7)"/>
    </linearGradient>
  </defs>

  <!-- Background gradient -->
  <rect width="400" height="300" fill="url(#bg)"/>

  <!-- Decorative pattern -->
  <g>
    <circle cx="350" cy="40" r="60" fill="${theme.accent}" opacity="0.08"/>
    <circle cx="50" cy="260" r="40" fill="${theme.accent}" opacity="0.06"/>
  </g>

  <!-- Genre-specific icon -->
  <g>${icon}</g>

  <!-- Dark overlay for text readability -->
  <rect width="400" height="300" fill="url(#overlay)"/>

  <!-- Genre tag -->
  <rect x="16" y="16" rx="10" ry="10" width="${genreLabels.length * 14 + 20}" height="24" fill="${theme.accent}" opacity="0.25"/>
  <text x="26" y="33" font-family="system-ui,-apple-system,sans-serif" font-size="13" fill="white" opacity="0.9">${escapeXml(genreLabels)}</text>

  <!-- Platform icons -->
  <text x="384" y="33" font-family="system-ui,-apple-system,sans-serif" font-size="14" fill="white" opacity="0.7" text-anchor="end">${platformIcons}</text>

  <!-- Rating badge -->
  <rect x="16" y="46" rx="8" ry="8" width="45" height="20" fill="rgba(255,255,255,0.15)"/>
  <text x="38" y="60" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="white" opacity="0.85" text-anchor="middle">⭐ ${game.rating.toFixed(1)}</text>

  <!-- Game name (Chinese) -->
  <text x="20" y="248" font-family="system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif" font-size="28" font-weight="bold" fill="white">${gameName}</text>

  <!-- Game name (English) -->
  <text x="20" y="274" font-family="system-ui,-apple-system,sans-serif" font-size="14" fill="white" opacity="0.65">${gameNameEn}</text>

  <!-- Price tag -->
  <text x="384" y="274" font-family="system-ui,-apple-system,sans-serif" font-size="12" fill="${theme.accent}" opacity="0.8" text-anchor="end">${escapeXml(game.priceInfo)}</text>
</svg>`;
}

// ── Main ──
async function main() {
  // Dynamic import of seed data (avoiding TS path alias issues)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const seedModule = require("../src/lib/seed-games");
  const SEED_GAMES: SeedGame[] = seedModule.SEED_GAMES;

  const outDir = join(__dirname, "..", "public", "covers");
  mkdirSync(outDir, { recursive: true });

  let count = 0;
  for (const game of SEED_GAMES) {
    const svg = generateSvg(game);
    const filePath = join(outDir, `${game.slug}.svg`);
    writeFileSync(filePath, svg, "utf-8");
    count++;
  }

  console.log(`✅ Generated ${count} SVG covers in public/covers/`);
}

main().catch((err) => {
  console.error("Failed to generate covers:", err);
  process.exit(1);
});
