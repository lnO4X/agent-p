"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GameCard } from "@/components/games/game-card";
import { useI18n } from "@/i18n/context";

const PLATFORMS = [
  { key: "", labelKey: "common.all" },
  { key: "pc", labelKey: "platform.pc" },
  { key: "mobile", labelKey: "platform.mobile" },
  { key: "console", labelKey: "platform.console" },
];

const GENRES = [
  { key: "", labelKey: "common.all" },
  { key: "fps", labelKey: "genre.fps" },
  { key: "moba", labelKey: "genre.moba" },
  { key: "rpg", labelKey: "genre.rpg" },
  { key: "rhythm", labelKey: "genre.rhythm" },
  { key: "puzzle", labelKey: "genre.puzzle" },
  { key: "strategy", labelKey: "genre.strategy" },
  { key: "battle_royale", labelKey: "genre.battle_royale" },
  { key: "racing", labelKey: "genre.racing" },
  { key: "simulation", labelKey: "genre.simulation" },
  { key: "card", labelKey: "genre.card" },
];

interface GameItem {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  coverUrl: string | null;
  rating: number | null;
  popularity: number | null;
  platforms: string[];
  genres: string[];
}

export default function ExplorePage() {
  const { t } = useI18n();
  const [platform, setPlatform] = useState("");
  const [genre, setGenre] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fetchRef = useRef(0); // guard against stale responses

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchGames = useCallback(async () => {
    const fetchId = ++fetchRef.current;
    setLoading(true);
    setError(false);

    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);
    if (genre) params.set("genre", genre);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", String(page));
    params.set("limit", "24");

    try {
      const res = await fetch(`/api/games/catalog?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Guard: only update state if this is still the latest request
      if (fetchId !== fetchRef.current) return;
      if (json.success) {
        setGames(json.data.items);
        setTotal(json.data.pagination.total);
        setTotalPages(json.data.pagination.totalPages);
      } else {
        setGames([]);
        setError(true);
      }
    } catch {
      if (fetchId !== fetchRef.current) return;
      setGames([]);
      setError(true);
    } finally {
      if (fetchId === fetchRef.current) {
        setLoading(false);
      }
    }
  }, [platform, genre, debouncedSearch, page]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [platform, genre, debouncedSearch]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("explore.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {platform || genre || debouncedSearch
            ? t("explore.subtitleFiltered", { count: total })
            : t("explore.subtitle", { count: total })}
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder={t("explore.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Platform tabs */}
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

      {/* Genre filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {GENRES.map((g) => (
          <button
            key={g.key}
            onClick={() => setGenre(g.key)}
            aria-pressed={genre === g.key}
            className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
              genre === g.key
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(g.labelKey)}
          </button>
        ))}
      </div>

      {/* Game grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3">
                <div className="aspect-[4/3] bg-muted rounded-md mb-2" />
                <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-muted-foreground">{t("explore.loadFailed")}</p>
          <button
            onClick={fetchGames}
            className="text-sm text-primary hover:underline"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("explore.noResults")}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-md text-sm bg-muted disabled:opacity-50"
          >
            {t("explore.prevPage")}
          </button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-md text-sm bg-muted disabled:opacity-50"
          >
            {t("explore.nextPage")}
          </button>
        </div>
      )}
    </div>
  );
}
