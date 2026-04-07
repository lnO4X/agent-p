"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n/context";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Mail, Check, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "system" | "light" | "dark";

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("app-theme") as ThemeMode) || "dark";
}

function applyTheme(mode: ThemeMode) {
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem("app-theme", mode);
}

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const [email, setEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailEditing, setEmailEditing] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    applyTheme(mode);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setEmail(data.data.email || null);
        }
      } catch {
        // ignore
      }
    }
    loadSettings();
  }, []);

  const handleEmailBind = async () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;

    setEmailSaving(true);
    setEmailSuccess(false);

    try {
      const res = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (res.ok) {
        setEmail(trimmed);
        setEmailEditing(false);
        setEmailSuccess(true);
        setTimeout(() => setEmailSuccess(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setEmailSaving(false);
    }
  };

  const themeOptions: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
    { key: "system", label: t("settings.themeSystem"), icon: Monitor },
    { key: "light", label: t("settings.themeLight"), icon: Sun },
    { key: "dark", label: t("settings.themeDark"), icon: Moon },
  ];

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t("nav.settings")}</h1>

      {/* Theme picker */}
      <div className="rounded-2xl ring-1 ring-foreground/10 bg-card overflow-hidden">
        <div className="px-4 py-3.5 space-y-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{t("settings.theme")}</p>
            <p className="text-xs text-muted-foreground">
              {t("settings.themeDesc")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-medium transition-all pressable",
                  theme === key
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Email binding */}
      <div className="rounded-2xl ring-1 ring-foreground/10 bg-card overflow-hidden">
        <div className="px-4 py-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{t("settings.email")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("settings.emailDesc")}
                </p>
              </div>
            </div>
            {emailSuccess && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Check className="w-3.5 h-3.5" />
                {t("settings.emailBindSuccess")}
              </span>
            )}
          </div>

          {email && !emailEditing ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground/80">{email}</p>
              <button
                type="button"
                onClick={() => {
                  setEmailInput(email);
                  setEmailEditing(true);
                }}
                className="text-xs text-primary pressable"
              >
                {t("settings.emailChange")}
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={t("settings.emailPlaceholder")}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2 text-sm",
                  "bg-muted/50 border border-foreground/10",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30"
                )}
              />
              <button
                type="button"
                onClick={handleEmailBind}
                disabled={emailSaving || !emailInput.trim()}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium",
                  "bg-primary text-primary-foreground",
                  "pressable disabled:opacity-40"
                )}
              >
                {t("settings.emailBind")}
              </button>
              {emailEditing && (
                <button
                  type="button"
                  onClick={() => setEmailEditing(false)}
                  className="px-3 py-2 rounded-xl text-sm text-muted-foreground pressable"
                >
                  {t("common.cancel")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Password section */}
      <ChangePasswordForm />
    </div>
  );
}
