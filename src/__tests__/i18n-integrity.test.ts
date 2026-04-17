import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const LOCALES_DIR = path.join(process.cwd(), "src", "i18n", "locales");
// All locales must have the same key set as en.json (strict enforcement).
const PRIMARY_LOCALES = ["en", "zh", "de", "es", "fr", "ja", "ko", "pt"];
const ALL_LOCALES = ["en", "zh", "de", "es", "fr", "ja", "ko", "pt"];

function readLocale(locale: string): Record<string, unknown> {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function flatKeys(
  obj: Record<string, unknown>,
  prefix = ""
): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...flatKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

function flatEntries(
  obj: Record<string, unknown>,
  prefix = ""
): [string, unknown][] {
  const entries: [string, unknown][] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      entries.push(
        ...flatEntries(value as Record<string, unknown>, fullKey)
      );
    } else {
      entries.push([fullKey, value]);
    }
  }
  return entries;
}

describe("i18n integrity", () => {
  const enKeys = flatKeys(readLocale("en"));

  it("all expected locale files exist", () => {
    for (const locale of ALL_LOCALES) {
      const filePath = path.join(LOCALES_DIR, `${locale}.json`);
      expect(fs.existsSync(filePath), `Missing locale file: ${locale}.json`).toBe(true);
    }
  });

  it("primary locales (en/zh) have same key count", () => {
    for (const locale of PRIMARY_LOCALES) {
      const localeKeys = flatKeys(readLocale(locale));
      expect(localeKeys.length, `${locale}.json key count mismatch with en`).toBe(
        enKeys.length
      );
    }
  });

  it("all locales have no missing keys vs en.json", () => {
    for (const locale of ALL_LOCALES) {
      if (locale === "en") continue;
      const localeKeys = new Set(flatKeys(readLocale(locale)));
      const missing = enKeys.filter((k) => !localeKeys.has(k));
      expect(
        missing,
        `${locale}.json missing keys: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? `... (${missing.length} total)` : ""}`
      ).toEqual([]);
    }
  });

  it("no empty translation values in primary locales", () => {
    for (const locale of PRIMARY_LOCALES) {
      const entries = flatEntries(readLocale(locale));
      const empty = entries
        .filter(([, v]) => v === "")
        .map(([k]) => k);
      expect(
        empty,
        `${locale}.json has empty values: ${empty.slice(0, 5).join(", ")}`
      ).toEqual([]);
    }
  });

  it("no extra keys in any locale (no orphaned translations)", () => {
    const enKeySet = new Set(enKeys);
    for (const locale of ALL_LOCALES) {
      if (locale === "en") continue;
      const localeKeys = flatKeys(readLocale(locale));
      const extra = localeKeys.filter((k) => !enKeySet.has(k));
      expect(
        extra,
        `${locale}.json has extra keys not in en.json: ${extra.slice(0, 5).join(", ")}`
      ).toEqual([]);
    }
  });
});
