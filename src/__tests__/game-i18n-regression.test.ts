import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const GAMES_DIR = path.join(process.cwd(), "src", "games");

function findGameFiles(): string[] {
  const dirs = fs.readdirSync(GAMES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  return dirs
    .map((d) => path.join(GAMES_DIR, d, "game.tsx"))
    .filter((f) => fs.existsSync(f));
}

// Regex: matches any CJK Unified Ideograph (Chinese characters)
const CHINESE_CHAR_REGEX = /[\u4e00-\u9fff]/;

// Lines that legitimately contain Chinese without isZh guard:
// - categories: { ... } — game logic constants, not UI
// - comments (// or /* */)
// - import statements
// - type/interface definitions with Chinese in string literals used as enum keys
function isExemptLine(line: string): boolean {
  const trimmed = line.trim();
  // Comments
  if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
    return true;
  }
  // Category/classification object values (game logic, not displayed)
  if (trimmed.includes("categories:") || trimmed.includes("categories[")) {
    return true;
  }
  // Classify function bodies (comparing against category values)
  if (trimmed.includes('.categories.') || trimmed.includes('=== "')) {
    if (trimmed.includes("classify") || trimmed.includes("? \"left\"") || trimmed.includes("? \"right\"")) {
      return true;
    }
  }
  // Data constant properties that have companion *En fields (bilingual by design)
  // e.g., { name: "红", nameEn: "RED" } or { label: "生物", labelEn: "Living" }
  if (/^\{?\s*(name|label|leftLabel|rightLabel):\s*"/.test(trimmed)) {
    return true;
  }
  // ITEMS/RULES/COLORS array entries with both Chinese and En fields on same line
  if (trimmed.includes("nameEn:") || trimmed.includes("labelEn:")) {
    return true;
  }
  return false;
}

describe("game i18n regression", () => {
  it("no hardcoded Chinese in game.tsx files without isZh guard", () => {
    const gameFiles = findGameFiles();
    const violations: string[] = [];

    for (const file of gameFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      const gameName = path.basename(path.dirname(file));

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!CHINESE_CHAR_REGEX.test(line)) continue;
        if (isExemptLine(line)) continue;
        if (line.includes("isZh")) continue;

        // Check surrounding context (multi-line ternaries: isZh may be 1-3 lines above)
        const context = lines.slice(Math.max(0, i - 3), i + 1).join("\n");
        if (context.includes("isZh")) continue;

        violations.push(
          `${gameName}/game.tsx:${i + 1}: ${line.trim().slice(0, 80)}`
        );
      }
    }

    expect(
      violations,
      `Found Chinese text without isZh guard:\n${violations.join("\n")}`
    ).toEqual([]);
  });

  it("all game.tsx files import useI18n", () => {
    const gameFiles = findGameFiles();
    const missing: string[] = [];

    for (const file of gameFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const gameName = path.basename(path.dirname(file));
      if (!content.includes("useI18n")) {
        missing.push(gameName);
      }
    }

    expect(
      missing,
      `Games missing useI18n import: ${missing.join(", ")}`
    ).toEqual([]);
  });
});
