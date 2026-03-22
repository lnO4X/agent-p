"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gamepad2, Star, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GENRE_LABELS: Record<string, { zh: string; en: string }> = {
  fps: { zh: "射击", en: "FPS" },
  moba: { zh: "MOBA", en: "MOBA" },
  rpg: { zh: "角色扮演", en: "RPG" },
  rhythm: { zh: "音乐节奏", en: "Rhythm" },
  puzzle: { zh: "解谜", en: "Puzzle" },
  strategy: { zh: "策略", en: "Strategy" },
  battle_royale: { zh: "大逃杀", en: "Battle Royale" },
  racing: { zh: "竞速", en: "Racing" },
  simulation: { zh: "模拟", en: "Simulation" },
  card: { zh: "卡牌", en: "Card" },
  fighting: { zh: "格斗", en: "Fighting" },
  sports: { zh: "体育", en: "Sports" },
};

interface Game {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  coverUrl: string | null;
  rating: number | null;
  genres: string[];
  platforms: string[];
}

interface GameRecommendationsProps {
  genres: string[];
  archetypeName: string;
  archetypeNameEn: string;
  gradient: [string, string];
  isZh: boolean;
}

export function GameRecommendations({
  genres,
  archetypeName,
  archetypeNameEn,
  gradient,
  isZh,
}: GameRecommendationsProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      try {
        // Fetch top games for each genre, take best 5 overall
        const fetches = genres.slice(0, 3).map((genre) =>
          fetch(`/api/games/catalog?genre=${genre}&limit=6&sort=popularity`)
            .then((r) => r.json())
            .then((d) => (d.success ? d.data.items : []))
            .catch(() => [])
        );
        const results = await Promise.all(fetches);

        // Deduplicate and pick top 5
        const seen = new Set<string>();
        const merged: Game[] = [];
        for (const list of results) {
          for (const game of list) {
            if (!seen.has(game.id)) {
              seen.add(game.id);
              merged.push(game);
            }
          }
        }
        setGames(merged.slice(0, 5));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadGames();
  }, [genres]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Gamepad2 size={12} />
          {isZh ? "为你推荐游戏..." : "Finding games for you..."}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-28 h-40 rounded-xl bg-muted/30 animate-pulse shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    // Fallback: show genre tags like before
    return (
      <div>
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Gamepad2 size={12} />
          {isZh ? "推荐游戏类型" : "Recommended Genres"}
        </div>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <Link
              key={genre}
              href={`/explore?genre=${genre}`}
              className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
            >
              {GENRE_LABELS[genre]?.[isZh ? "zh" : "en"] ?? genre.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Gamepad2 size={12} />
          {isZh
            ? `${archetypeName}的推荐游戏`
            : `Games for ${archetypeNameEn}`}
        </div>
        <Link
          href={`/explore?genre=${genres[0]}`}
          className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"
        >
          {isZh ? "查看全部" : "See all"}
          <ChevronRight size={10} />
        </Link>
      </div>

      {/* Genre tags */}
      <div className="flex flex-wrap gap-1.5">
        {genres.map((genre) => (
          <Link
            key={genre}
            href={`/explore?genre=${genre}`}
            className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
          >
            {GENRE_LABELS[genre]?.[isZh ? "zh" : "en"] ?? genre.toUpperCase()}
          </Link>
        ))}
      </div>

      {/* Game cards — horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/explore?search=${encodeURIComponent(game.nameEn || game.name)}`}
            className="shrink-0 snap-start"
          >
            <Card
              className="w-28 overflow-hidden pressable hover:border-primary/30 transition-colors"
              style={{
                background: `linear-gradient(180deg, ${gradient[0]}08, ${gradient[1]}05)`,
              }}
            >
              <div className="relative">
                {game.coverUrl ? (
                  <img
                    src={game.coverUrl}
                    alt={isZh ? game.name : (game.nameEn || game.name)}
                    className="w-full h-16 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full h-16 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${gradient[0]}30, ${gradient[1]}30)`,
                    }}
                  >
                    <Gamepad2 size={20} className="text-muted-foreground/50" />
                  </div>
                )}
                {game.rating && game.rating > 0 && (
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded px-1 py-0.5">
                    <Star size={8} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[9px] text-white font-medium">
                      {game.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <CardContent className="p-2">
                <p
                  className={cn(
                    "text-[11px] font-medium leading-tight line-clamp-2",
                    "min-h-[2.2em]"
                  )}
                >
                  {isZh ? game.name : (game.nameEn || game.name)}
                </p>
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {game.platforms?.slice(0, 2).map((p) => (
                    <span
                      key={p}
                      className="text-[8px] text-muted-foreground bg-muted/50 rounded px-1"
                    >
                      {p === "pc" ? "PC" : p === "mobile" ? "📱" : p === "console" ? "🎮" : p}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
