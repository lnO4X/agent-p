"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/context";
import { RefreshCw } from "lucide-react";

const CAPTCHA_LIFETIME_SEC = 5 * 60; // 5 minutes, matches server

interface CaptchaInputProps {
  token: string;
  setToken: (token: string) => void;
  value: string;
  onChange: (value: string) => void;
  onRefreshReady?: (refreshFn: () => void) => void;
}

export function CaptchaInput({
  token,
  setToken,
  value,
  onChange,
  onRefreshReady,
}: CaptchaInputProps) {
  const { t } = useI18n();
  const [svg, setSvg] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(CAPTCHA_LIFETIME_SEC);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchingRef = useRef(false); // Prevent duplicate fetches

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRemaining(CAPTCHA_LIFETIME_SEC);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const refresh = useCallback(async () => {
    // Prevent concurrent fetches (e.g., double-mount, double-tap)
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/captcha", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setToken(json.data.token);
        setSvg(json.data.svg);
        startCountdown();
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [setToken, startCountdown]);

  // Expose refresh function to parent
  useEffect(() => {
    onRefreshReady?.(refresh);
  }, [refresh, onRefreshReady]);

  // Load captcha on first render
  useEffect(() => {
    if (!svg && !loading) {
      refresh();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh when expired
  useEffect(() => {
    if (remaining === 0 && !loading) {
      refresh();
    }
  }, [remaining, loading, refresh]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="captcha">{t("auth.captcha")}</Label>
        {remaining > 0 && remaining < 60 && (
          <span className="text-[10px] text-destructive animate-pulse">
            {formatTime(remaining)}
          </span>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <Input
          id="captcha"
          placeholder={t("auth.captchaPlaceholder")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          pattern="[0-9]*"
          className="flex-1"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="shrink-0 rounded-md overflow-hidden border border-border hover:opacity-80 transition-opacity cursor-pointer h-[42px] relative"
          title={t("auth.captchaRefresh")}
        >
          {svg ? (
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div className="w-[180px] h-[50px] bg-muted flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
            </div>
          )}
          {/* Countdown bar */}
          {remaining > 0 && remaining <= CAPTCHA_LIFETIME_SEC && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground/10">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-linear"
                style={{
                  width: `${(remaining / CAPTCHA_LIFETIME_SEC) * 100}%`,
                }}
              />
            </div>
          )}
        </button>
      </div>
      <input type="hidden" name="captchaToken" value={token} />
    </div>
  );
}
