"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n/context";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PersonalitySelector } from "@/components/personality-selector";
import { Mail, Check, Sun, Moon, Monitor, Gamepad2, Unlink, ExternalLink, Library, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "system" | "light" | "dark";

interface SteamStatus {
  linked: boolean;
  steamId?: string;
  steamUsername?: string;
  totalGames?: number;
  totalPlaytimeHours?: number;
}

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
  const [personalityType, setPersonalityType] = useState<string | null>(null);
  const [steam, setSteam] = useState<SteamStatus | null>(null);
  const [steamInput, setSteamInput] = useState("");
  const [steamLinking, setSteamLinking] = useState(false);
  const [steamError, setSteamError] = useState<string | null>(null);

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
        const [settingsRes, steamRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/integrations/steam"),
        ]);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setEmail(data.data.email || null);
          setPersonalityType(data.data.personalityType || null);
        }
        if (steamRes.ok) {
          const data = await steamRes.json();
          if (data.success) setSteam(data.data);
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

  const handleSteamLink = async () => {
    const id = steamInput.trim();
    if (!id) return;
    setSteamLinking(true);
    setSteamError(null);
    try {
      const res = await fetch("/api/integrations/steam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId: id }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh Steam status
        const statusRes = await fetch("/api/integrations/steam");
        const statusData = await statusRes.json();
        if (statusData.success) setSteam(statusData.data);
        setSteamInput("");
      } else {
        setSteamError(typeof data.error === "string" ? data.error : (isZh ? "无效的 Steam ID" : "Invalid Steam ID"));
      }
    } catch {
      setSteamError(isZh ? "网络错误，请重试" : "Network error");
    } finally {
      setSteamLinking(false);
    }
  };

  const handleSteamUnlink = async () => {
    if (!confirm(t("settings.steamUnlinkConfirm"))) return;
    try {
      await fetch("/api/integrations/steam", { method: "DELETE" });
      setSteam({ linked: false });
      setSteamInput("");
    } catch {
      // ignore
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

      {/* Personality type */}
      <div className="rounded-2xl ring-1 ring-foreground/10 bg-card overflow-hidden">
        <div className="px-4 py-3.5 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {isZh ? "性格类型" : "Personality Type"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isZh
                  ? "选择你的性格类型，获得更精准的原型分析"
                  : "Select your personality type for deeper archetype insights"}
              </p>
            </div>
          </div>
          <PersonalitySelector
            value={personalityType}
            onSelect={setPersonalityType}
          />
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

      {/* Steam integration */}
      {steam !== null && (
        <div className="rounded-2xl ring-1 ring-foreground/10 bg-card overflow-hidden">
          <div className="px-4 py-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{t("settings.steam")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.steamDesc")}</p>
                </div>
              </div>
              {steam.linked && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Check className="w-3.5 h-3.5" />
                  {t("settings.steamLinked")}
                </span>
              )}
            </div>

            {steam.linked ? (
              <div className="space-y-2">
                {/* Stats row */}
                <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-3 py-2">
                  <Library className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {steam.steamUsername || steam.steamId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.steamGames").replace("{count}", String(steam.totalGames ?? 0))}
                      {" · "}
                      {t("settings.steamHours").replace("{hours}", String(steam.totalPlaytimeHours ?? 0))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSteamUnlink}
                    className="flex items-center gap-1 text-xs text-destructive pressable"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    {t("settings.steamUnlink")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <input
                    type="text"
                    value={steamInput}
                    onChange={(e) => { setSteamInput(e.target.value); setSteamError(null); }}
                    placeholder={t("settings.steamIdPlaceholder")}
                    className={cn(
                      "flex-1 rounded-xl px-3 py-2 text-sm",
                      "bg-muted/50 border border-foreground/10",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30"
                    )}
                  />
                  <button
                    type="button"
                    onClick={handleSteamLink}
                    disabled={steamLinking || !steamInput.trim()}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap",
                      "bg-primary text-primary-foreground",
                      "pressable disabled:opacity-40"
                    )}
                  >
                    {steamLinking ? t("settings.steamLinking") : t("settings.steamLink")}
                  </button>
                </div>
                {steamError && (
                  <p className="text-xs text-destructive">{steamError}</p>
                )}
                <a
                  href="https://store.steampowered.com/account/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t("settings.steamFindId")}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password section */}
      <ChangePasswordForm />
    </div>
  );
}
