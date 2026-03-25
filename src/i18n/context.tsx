"use client";

/**
 * I18n React Context + Provider + hook.
 *
 * Usage:
 *   const { t, locale, setLocale, region, setRegion } = useI18n();
 *   <p>{t("dashboard.title")}</p>
 *   <p>{t("explore.subtitle", { count: 127 })}</p>
 *
 * Region: "cn" (中国) or "global" (🌍).
 * Changing region also sets the locale: cn→zh, global→en.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { translate, DEFAULT_LOCALE, type Locale } from "./index";

export type Region = "cn" | "global";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  region: Region;
  setRegion: (region: Region) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "app-locale";
const REGION_STORAGE_KEY = "app-region";

function detectLocaleFromBrowser(): Locale {
  try {
    const lang = navigator.language || navigator.languages?.[0] || "";
    return lang.startsWith("zh") ? "zh" : "en";
  } catch {
    return DEFAULT_LOCALE;
  }
}

function detectRegionFromBrowser(): Region {
  try {
    const lang = navigator.language || navigator.languages?.[0] || "";
    return lang.startsWith("zh") ? "cn" : "global";
  } catch {
    return "cn";
  }
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "zh" || stored === "en") return stored;
  } catch {
    // localStorage unavailable
  }
  // Auto-detect from browser language
  return detectLocaleFromBrowser();
}

function getInitialRegion(): Region {
  if (typeof window === "undefined") return "cn";
  try {
    const stored = localStorage.getItem(REGION_STORAGE_KEY);
    if (stored === "cn" || stored === "global") return stored;
  } catch {
    // localStorage unavailable
  }
  // Auto-detect from browser language
  return detectRegionFromBrowser();
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const [region, setRegionState] = useState<Region>(getInitialRegion);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // ignore
    }
  }, []);

  const setRegion = useCallback(
    (newRegion: Region) => {
      setRegionState(newRegion);
      try {
        localStorage.setItem(REGION_STORAGE_KEY, newRegion);
      } catch {
        // ignore
      }
      // Region also drives locale: cn→zh, global→en
      const newLocale: Locale = newRegion === "cn" ? "zh" : "en";
      setLocale(newLocale);
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
