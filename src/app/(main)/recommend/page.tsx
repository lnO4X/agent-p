"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";

const PLATFORMS = [
  { key: "", labelKey: "common.all" },
  { key: "pc", labelKey: "platform.pc" },
  { key: "mobile", labelKey: "platform.mobile" },
  { key: "console", labelKey: "platform.console" },
];

interface Recommendation {
  id: string;
  fitScore: number;
  rank: number;
  reason: string | null;
  gameId: string;
  gameName: string;
  gameNameEn: string | null;
  gameSlug: string;
  gameCoverUrl: string | null;
  gameRating: number | null;
  gamePlatforms: string[];
  gameGenres: string[];
  gamePriceInfo: string | null;
}

/** Parse bilingual reason "zh|||en" format, fallback to raw string */
function getLocalizedReason(
  reason: string | null,
  locale: string
): string | null {
  if (!reason) return null;
  if (reason.includes("|||")) {
    const [zh, en] = reason.split("|||");
    return locale === "en" ? (en?.trim() || zh?.trim() || reason) : (zh?.trim() || reason);
  }
  return reason;
}

export default function RecommendPage() {
  const { t, locale } = useI18n();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState(false);
  const [platform, setPlatform] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);

    fetch(`/api/games/recommend?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (json.success) {
          setRecs(json.data.recommendations);
          setHasProfile(json.data.hasProfile);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [platform]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-2xl font-bold">{t("recommend.loadFailed")}</h1>
        <p className="text-muted-foreground">
          {t("recommend.loadFailedDesc")}
        </p>
        <Button onClick={() => setPlatform(platform)}>{t("common.retry")}</Button>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <div className="text-5xl">🎯</div>
        <h1 className="text-2xl font-bold">{t("recommend.noProfile")}</h1>
        <p className="text-muted-foreground">
          {t("recommend.noProfileDesc")}
        </p>
        <Link href="/test">
          <Button size="lg">{t("recommend.startTest")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("recommend.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("recommend.subtitle", { count: recs.length })}
        </p>
      </div>

      {/* Platform filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlatform(p.key)}
            aria-pressed={platform === p.key}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              platform === p.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      {recs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("recommend.noPlatformRecs")}
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map((rec) => {
            const displayName =
              locale === "en" && rec.gameNameEn
                ? rec.gameNameEn
                : rec.gameName;
            const localizedReason = getLocalizedReason(rec.reason, locale);

            return (
              <Link key={rec.id} href={`/explore/${rec.gameSlug}`}>
                <div className="flex gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {rec.rank}
                  </div>

                  {/* Cover */}
                  <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    {rec.gameCoverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rec.gameCoverUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl opacity-30">🎮</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">
                        {displayName}
                      </h3>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium flex-shrink-0">
                        {t("recommend.match", { score: Math.round(rec.fitScore) })}
                      </span>
                    </div>
                    {localizedReason && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {localizedReason}
                      </p>
                    )}
                    <div className="flex gap-1 mt-1">
                      {(rec.gameGenres ?? []).slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {t(`genre.${g}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
