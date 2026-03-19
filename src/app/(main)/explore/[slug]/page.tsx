"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Calendar, Building2, ArrowLeft } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { getAllArchetypes } from "@/lib/archetype";

interface GameData {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  coverUrl: string | null;
  developer: string | null;
  publisher: string | null;
  rating: number | null;
  popularity: number | null;
  releaseDate: string | null;
  platforms: string[];
  genres: string[];
}

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { t, locale } = useI18n();
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Load game data
    fetch(`/api/games/catalog/${slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setGame(json.data);
      })
      .finally(() => setLoading(false));

  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="aspect-video bg-muted rounded-lg" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{t("game.notFound")}</p>
        <Link href="/explore">
          <Button variant="outline">{t("game.backToCatalog")}</Button>
        </Link>
      </div>
    );
  }

  // Locale-aware name and description
  const primaryName =
    locale === "en" && game.nameEn ? game.nameEn : game.name;
  const secondaryName =
    locale === "en" ? (game.nameEn ? game.name : null) : game.nameEn;
  const displayDescription =
    locale === "en" && game.descriptionEn
      ? game.descriptionEn
      : game.description;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground pressable"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("game.backToCatalog")}
      </button>

      {/* Cover */}
      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center overflow-hidden">
        {game.coverUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.coverUrl}
            alt={primaryName}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <Gamepad2 size={48} className="opacity-20" />
        )}
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">{primaryName}</h1>
        {secondaryName && (
          <p className="text-sm text-muted-foreground">{secondaryName}</p>
        )}
        {/* Developer/Publisher */}
        {(game.developer || game.publisher) && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Building2 className="w-3 h-3" />
            <span>
              {game.developer}
              {game.developer && game.publisher && " · "}
              {game.publisher}
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {game.platforms.map((p) => (
          <span
            key={p}
            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
          >
            {t(`platform.${p}`)}
          </span>
        ))}
        {game.genres.map((g) => (
          <span
            key={g}
            className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
          >
            {t(`genre.${g}`)}
          </span>
        ))}
      </div>

      {/* Best for archetypes */}
      {(() => {
        const allTypes = getAllArchetypes();
        const matched = allTypes
          .map((a) => ({
            archetype: a,
            overlap: a.genres.filter((g) => game.genres.includes(g)).length,
          }))
          .filter((s) => s.overlap > 0)
          .sort((a, b) => b.overlap - a.overlap)
          .slice(0, 4);

        if (matched.length === 0) return null;
        return (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              {locale === "zh" ? "最适合的玩家原型" : "Best for archetypes"}
            </p>
            <div className="flex flex-wrap gap-2">
              {matched.map(({ archetype: a }) => (
                <Link
                  key={a.id}
                  href={`/archetype/${a.id}`}
                  className="pressable flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border hover:border-primary/30 transition-colors"
                  style={{ borderColor: `${a.gradient[0]}30` }}
                >
                  <span>{a.icon}</span>
                  <span>{locale === "zh" ? a.name : a.nameEn}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {game.rating != null && (
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-xl font-bold">{game.rating.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">{t("game.rating")}</div>
            </CardContent>
          </Card>
        )}
        {game.popularity != null && (
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-xl font-bold">{game.popularity}</div>
              <div className="text-xs text-muted-foreground">{t("game.popularity")}</div>
            </CardContent>
          </Card>
        )}
        {game.releaseDate && (
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{game.releaseDate}</span>
              </div>
              <div className="text-xs text-muted-foreground">{t("game.releaseDate")}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description */}
      {displayDescription && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("game.description")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayDescription}
            </p>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="flex gap-3">
        <Link href="/quiz" className="flex-1">
          <Button className="w-full pressable">{t("game.testMatch")}</Button>
        </Link>
        <Button variant="outline" className="pressable" onClick={() => router.back()}>
          {t("game.browseMore")}
        </Button>
      </div>
    </div>
  );
}
