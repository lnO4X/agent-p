/**
 * Lightweight i18n module.
 *
 * - Flat key structure: "nav.home", "explore.title", "common.loading"
 * - Supports {variable} interpolation: t("explore.subtitle", { count: 127 })
 * - To add a new language: create src/i18n/locales/{locale}.json + update Locale type
 */

import zh from "./locales/zh.json";
import en from "./locales/en.json";

export type Locale = "zh" | "en";

type Messages = Record<string, string>;

const MESSAGES: Record<Locale, Messages> = { zh, en };

export const DEFAULT_LOCALE: Locale = "zh";

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中文",
  en: "English",
};

/**
 * Get translation for a key in the given locale.
 * Supports interpolation: translate("zh", "explore.subtitle", { count: 127 })
 */
export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const messages = MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE];
  let text = messages[key];

  // Fallback: try default locale, then return key itself
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
