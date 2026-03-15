"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminGame {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  status: "active" | "hidden" | "pending";
  sourceType: string;
  popularity: number;
  rating: number | null;
  genres: string[];
  platforms: string[];
  coverUrl: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
  { value: "pending", label: "Pending" },
];

const SOURCE_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "seed", label: "Seed" },
  { value: "steam", label: "Steam" },
  { value: "taptap", label: "TapTap" },
  { value: "boardgame", label: "Board" },
  { value: "manual", label: "Manual" },
];

export default function AdminGamesPage() {
  const [games, setGames] = useState<AdminGame[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
        source: sourceFilter,
        sort: "name",
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/games?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setGames(data.data.games);
        setTotal(data.data.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGames();
  };

  const toggleStatus = async (gameId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "hidden" : "active";
    await fetch("/api/admin/games", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, status: newStatus }),
    });
    fetchGames();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">
          游戏管理 Games ({total})
        </h1>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索游戏名称 Search games..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-muted/50 border border-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </form>

        <div className="flex gap-2">
          {/* Status filter */}
          <div className="flex rounded-xl bg-muted/50 border border-foreground/10 overflow-hidden">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs transition-colors",
                  statusFilter === opt.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-muted/50 border border-foreground/10 text-muted-foreground focus:outline-none"
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-foreground/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/10 bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                  游戏 Game
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                  状态 Status
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                  来源 Source
                </th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">
                  类型 Genres
                </th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">
                  评分 Rating
                </th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                  操作 Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-foreground/5">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                      </td>
                    </tr>
                  ))
                : games.map((game) => (
                    <tr
                      key={game.id}
                      className={cn(
                        "border-b border-foreground/5 hover:bg-muted/20 transition-colors",
                        game.status === "hidden" && "opacity-50"
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <div>
                          <div className="font-medium">{game.name}</div>
                          {game.nameEn && game.nameEn !== game.name && (
                            <div className="text-xs text-muted-foreground">
                              {game.nameEn}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            game.status === "active"
                              ? "bg-green-500/10 text-green-600"
                              : game.status === "hidden"
                                ? "bg-red-500/10 text-red-600"
                                : "bg-amber-500/10 text-amber-600"
                          )}
                        >
                          {game.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-muted-foreground">
                          {game.sourceType}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {(game.genres || []).slice(0, 2).map((g) => (
                            <span
                              key={g}
                              className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground"
                            >
                              {g}
                            </span>
                          ))}
                          {(game.genres || []).length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{(game.genres || []).length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {game.rating ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs tabular-nums">
                              {game.rating.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => toggleStatus(game.id, game.status)}
                          className={cn(
                            "text-xs px-2 py-1 rounded-lg transition-colors inline-flex items-center gap-1",
                            game.status === "active"
                              ? "bg-muted hover:bg-muted/80 text-muted-foreground"
                              : "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                          )}
                          title={
                            game.status === "active"
                              ? "隐藏 Hide"
                              : "显示 Show"
                          }
                        >
                          {game.status === "active" ? (
                            <>
                              <EyeOff className="w-3 h-3" /> Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" /> Show
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
