"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Home, Gamepad2, Brain, User, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LOCALE_LABELS, getLocales, type Locale } from "@/i18n/index";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** Pathname prefixes that activate this tab */
  activePrefixes?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.home", icon: Home },
  {
    href: "/explore",
    labelKey: "nav.play",
    icon: Gamepad2,
    activePrefixes: ["/play", "/explore", "/test"],
  },
  {
    href: "/chat",
    labelKey: "nav.coach",
    icon: Brain,
    activePrefixes: ["/chat"],
  },
  {
    href: "/me",
    labelKey: "nav.me",
    icon: User,
    activePrefixes: ["/me", "/results", "/settings"],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.activePrefixes) {
    return item.activePrefixes.some((p) => pathname.startsWith(p));
  }
  return pathname.startsWith(item.href);
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(document.cookie.includes("logged-in="));
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Desktop top nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 glass-nav hidden md:block">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="font-semibold text-lg">
            {t("app.name")}
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pressable flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {t(item.labelKey)}
                </Link>
              );
            })}

            {/* Language selector (desktop) */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe size={14} />
                {LOCALE_LABELS[locale]?.slice(0, 3) ?? locale}
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-1 py-1 bg-surface border border-border rounded-lg shadow-lg z-50 min-w-[120px]">
                  {getLocales().map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLocale(l as Locale); setShowLangMenu(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        l === locale ? "text-primary bg-primary/5" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {LOCALE_LABELS[l as Locale]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="ml-1 text-muted-foreground"
              >
                {t("nav.logout")}
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm" className="ml-1">
                  {t("auth.login")}
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 glass-nav md:hidden">
        <div className="flex h-11 items-center justify-between px-4">
          <span className="font-semibold text-sm">{t("app.name")}</span>
          <div className="flex items-center gap-2">
            {/* Language toggle (mobile — cycles through locales) */}
            <button
              onClick={() => {
                const locales = getLocales();
                const idx = locales.indexOf(locale);
                setLocale(locales[(idx + 1) % locales.length] as Locale);
              }}
              className="text-muted-foreground text-xs px-1.5 py-0.5 rounded-md bg-muted"
            >
              {LOCALE_LABELS[locale]?.slice(0, 2) ?? locale}
            </button>
            {isLoggedIn ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground text-xs h-7 px-2"
              >
                {t("nav.logout")}
              </Button>
            ) : (
              <Link href="/login">
                <Button size="sm" className="text-xs h-7 px-3">
                  {t("auth.login")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 container mx-auto p-4 md:p-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom tab bar — 4 tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 glass-nav border-t border-border md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`pressable flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors min-h-[3rem] ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2 : 1.5} />
                <span className="text-[11px] font-medium leading-none">
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
