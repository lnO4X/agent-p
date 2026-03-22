"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Home, Gamepad2, Bot, User, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Locale } from "@/i18n/index";
import { LOCALE_LABELS, getLocales } from "@/i18n/index";

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
    href: "/play",
    labelKey: "nav.play",
    icon: Gamepad2,
    activePrefixes: ["/play", "/explore", "/test", "/challenge"],
  },
  {
    href: "/chat",
    labelKey: "nav.partners",
    icon: Bot,
    activePrefixes: ["/chat"],
  },
  {
    href: "/me",
    labelKey: "nav.me",
    icon: User,
    activePrefixes: ["/me", "/results", "/leaderboard", "/settings"],
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user has login indicator cookie (non-httpOnly, set alongside auth token)
    const hasToken = document.cookie.includes("logged-in=");
    setIsLoggedIn(hasToken);
    if (!hasToken) return;
    fetch("/api/notifications?limit=1")
      .then((r) => r.json())
      .then((json) => {
        if (json.unreadCount) setUnreadCount(json.unreadCount);
      })
      .catch(() => {});
  }, [pathname]);

  const locales = getLocales();

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

            {/* Notification bell (logged-in only) */}
            {isLoggedIn && (
              <Link
                href="/notifications"
                className={`relative pressable flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${
                  pathname.startsWith("/notifications")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bell size={16} strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Language switcher */}
            <div className="ml-2 flex items-center gap-0.5">
              {locales.map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l as Locale)}
                  className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                    locale === l
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {LOCALE_LABELS[l as Locale]}
                </button>
              ))}
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
            {/* Notification bell (mobile, logged-in only) */}
            {isLoggedIn && (
              <Link
                href="/notifications"
                className="relative flex items-center justify-center w-7 h-7 rounded-xl text-muted-foreground"
              >
                <Bell size={18} strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            {/* Language toggle */}
            <button
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              className="text-muted-foreground text-xs px-1.5 py-0.5 rounded-md bg-muted"
            >
              {locale === "zh" ? "EN" : "中"}
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
