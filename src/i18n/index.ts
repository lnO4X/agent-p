/**
 * Lightweight i18n module.
 *
 * - Flat key structure: "nav.home", "explore.title", "common.loading"
 * - Supports {variable} interpolation: t("explore.subtitle", { count: 127 })
 * - 8 languages: en, zh, ja, ko, es, pt, fr, de
 * - Fallback chain: requested locale → en → key itself
 */

import zh from "./locales/zh.json";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";

export type Locale = "en" | "zh" | "ja" | "ko" | "es" | "pt" | "fr" | "de";

type Messages = Record<string, string>;

const MESSAGES: Record<Locale, Messages> = { en, zh, ja, ko, es, pt, fr, de };

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
};

/**
 * Get translation for a key in the given locale.
 * Fallback chain: locale → en → key itself.
 */
export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const messages = MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE];
  let text = messages[key];

  // Fallback: try English, then return key itself
  if (!text && locale !== DEFAULT_LOCALE) {
    text = MESSAGES[DEFAULT_LOCALE][key];
  }
  if (!text) return key;

  // Interpolate {variable} placeholders
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return text;
}

/** Get all available locales */
export function getLocales(): Locale[] {
  return Object.keys(MESSAGES) as Locale[];
}
