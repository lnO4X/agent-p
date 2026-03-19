"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import { Star, Gamepad2 } from "lucide-react";
import { getAllArchetypes } from "@/lib/archetype";

/** Find top 2 archetypes whose recommended genres overlap most with a game's genres */
function getMatchingArchetypes(gameGenres: string[]) {
  const all = getAllArchetypes();
  const scored = all.map((a) => {
    const overlap = a.genres.filter((g) => gameGenres.includes(g)).length;
    return { archetype: a, overlap };
  });
  return scored
    .filter((s) => s.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 2)
    .map((s) => s.archetype);
}

/** Genre-based gradient fallback when image fails to load */
const GENRE_GRADIENTS: Record<string, string> = {
  fps: "from-red-600 to-red-900",
  moba: "from-violet-600 to-violet-900",
  rpg: "from-blue-600 to-blue-900",
  rhythm: "from-pink-500 to-pink-800",
  puzzle: "from-emerald-500 to-emerald-800",
  strategy: "from-amber-500 to-amber-800",
  battle_royale: "from-red-500 to-orange-800",
  racing: "from-cyan-500 to-cyan-800",
  simulation: "from-green-500 to-green-800",
  card: "from-purple-500 to-purple-900",
};

interface GameCardProps {
  game: {
    slug: string;
    name: string;
    nameEn: string | null;
    coverUrl: string | null;
    rating: number | null;
    platforms: string[];
    genres: string[];
  };
  /** If provided, shows a fit score badge */
  fitScore?: number;
  /** Compact mode for horizontal scroll lists */
  compact?: boolean;
}

export function GameCard({ game, fitScore, compact }: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const primaryGenre = game.genres[0] || "";
  const matchArchetypes = compact ? [] : getMatchingArchetypes(game.genres);
  // Locale-aware game name: show English name first when UI is English
  const primaryName = locale === "en" && game.nameEn ? game.nameEn : game.name;
  const secondaryName = locale === "en" ? null : game.nameEn;
  const gradient =
    GENRE_GRADIENTS[primaryGenre] || "from-gray-500 to-gray-800";

  return (
    <Link href={`/explore/${game.slug}`}>
      <Card className="group hover:border-primary/30 transition-colors h-full">
        <CardContent className={compact ? "p-2" : "p-3"}>
          {/* Cover */}
          <div
            className={`${compact ? "aspect-square" : "aspect-[4/3]"} rounded-md mb-2 flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${gradient}`}
          >
            {game.coverUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={game.coverUrl}
                alt={game.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
              />
            ) : (
              <Gamepad2 size={24} className="text-white/40" />
            )}
            {fitScore != null && (
              <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {Math.round(fitScore)}%
              </div>
            )}
          </div>

          {/* Game info */}
          <div className="space-y-1">
            <h3
              className={`font-medium leading-tight line-clamp-1 group-hover:text-primary transition-colors ${compact ? "text-xs" : "text-sm"}`}
            >
              {primaryName}
            </h3>
            {!compact && secondaryName && (
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {secondaryName}
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {game.genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  {t(`genre.${g}`)}
                </span>
              ))}
              {game.platforms.slice(0, 1).map((p) => (
                <span
                  key={p}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                >
                  {t(`platform.${p}`)}
                </span>
              ))}
            </div>

            {/* Rating + archetype match */}
            {!compact && (
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                <div className="flex items-center gap-2">
                  {game.rating != null && (
                    <span className="flex items-center gap-0.5">
                      <Star size={12} fill="currentColor" /> {game.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                {matchArchetypes.length > 0 && (
                  <div className="flex items-center gap-0.5" title={matchArchetypes.map((a) => isZh ? a.name : a.nameEn).join(" · ")}>
                    {matchArchetypes.map((a) => (
                      <span key={a.id} className="text-xs">{a.icon}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
