"use client";

/**
 * I18n React Context + Provider + hook.
 * Supports 8 languages with browser auto-detection.
 *
 * Usage:
 *   const { t, locale, setLocale } = useI18n();
 *   <p>{t("dashboard.title")}</p>
 *   <p>{t("explore.subtitle", { count: 127 })}</p>
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { translate, DEFAULT_LOCALE, LOCALE_LABELS, type Locale } from "./index";

// Re-export for backwards compatibility
export type Region = "cn" | "global";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  /** @deprecated use setLocale directly */
  region: Region;
  /** @deprecated use setLocale directly */
  setRegion: (region: Region) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "app-locale";

/** Map browser language code to our Locale */
const LANG_MAP: Record<string, Locale> = {
  zh: "zh",
  ja: "ja",
  ko: "ko",
  es: "es",
  pt: "pt",
  fr: "fr",
  de: "de",
  en: "en",
};

function detectLocaleFromBrowser(): Locale {
  try {
    const langs = navigator.languages || [navigator.language || ""];
    for (const lang of langs) {
      const code = lang.split("-")[0].toLowerCase();
      if (LANG_MAP[code]) return LANG_MAP[code];
    }
    return DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in LOCALE_LABELS) return stored as Locale;
  } catch {
    // localStorage unavailable
  }
  return detectLocaleFromBrowser();
}

const HTML_LANG_MAP: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
  ja: "ja",
  ko: "ko",
  es: "es",
  pt: "pt-BR",
  fr: "fr",
  de: "de",
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = HTML_LANG_MAP[newLocale] || newLocale;
    } catch {
      // ignore
    }
  }, []);

  // Backwards compatibility: region → locale mapping
  const region: Region = locale === "zh" ? "cn" : "global";
  const setRegion = useCallback(
    (newRegion: Region) => {
      setLocale(newRegion === "cn" ? "zh" : "en");
    },
    [setLocale]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, region, setRegion }),
    [locale, setLocale, t, region, setRegion]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within <I18nProvider>");
  }
  return ctx;
}
