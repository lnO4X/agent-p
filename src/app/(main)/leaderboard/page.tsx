"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";

import { RankBadge } from "@/components/charts/rank-badge";
import { TalentIcon } from "@/components/talent-icon";
import { useI18n } from "@/i18n/context";
import type { TalentCategory, Rank } from "@/types/talent";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  overallScore: number | null;
  overallRank: string | null;
  sessionId: string;
  completedAt: string | null;
  talents: Partial<Record<TalentCategory, number | null>>;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setEntries(json.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-muted-foreground">{t("common.loading")}</div>
    );
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 border-yellow-500/40 text-yellow-400";
    if (rank === 2) return "bg-gray-300/10 border-gray-400/30 text-gray-300";
    if (rank === 3) return "bg-amber-600/15 border-amber-600/30 text-amber-500";
    return "bg-muted/30 border-border";
  };

  const getRankDisplay = (rank: number) => {
    if (rank <= 3) {
      const colors = ["text-yellow-400", "text-gray-300", "text-amber-500"];
      return <span className={`text-xl font-bold ${colors[rank - 1]}`}>#{rank}</span>;
    }
    return <span className="text-sm text-muted-foreground font-bold">#{rank}</span>;
  };

  // Find the highest talent for a user
  const getTopTalent = (talents: Partial<Record<TalentCategory, number | null>>): { category: TalentCategory; score: number } | null => {
    let best: { category: TalentCategory; score: number } | null = null;
    for (const [cat, score] of Object.entries(talents)) {
      if (typeof score === "number" && (!best || score > best.score)) {
        best = { category: cat as TalentCategory, score };
      }
    }
    return best;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">
          <Trophy size={28} className="text-primary inline" /> {t("leaderboard.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("leaderboard.subtitle")}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">{t("leaderboard.noData")}</p>
          <Link href="/test" className="text-primary hover:underline">
            {t("leaderboard.beFirst")}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const topTalent = getTopTalent(entry.talents);
            const isExpanded = expandedId === entry.userId;

            return (
              <div key={entry.userId}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.userId)}
                  className={`w-full text-left rounded-xl border p-4 transition-all hover:scale-[1.01] ${getRankStyle(entry.rank)}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-12 text-center flex-shrink-0">
                      {getRankDisplay(entry.rank)}
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${entry.username}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold truncate hover:text-primary hover:underline"
                        >
                          {entry.displayName || entry.username}
                        </Link>
                        {entry.displayName && (
                          <span className="text-xs text-muted-foreground">
                            @{entry.username}
                          </span>
                        )}
                      </div>
                      {topTalent && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t("leaderboard.topTalent")}{" "}
                          <TalentIcon category={topTalent.category} size={14} className="inline text-primary" />{" "}
                          {t(`talent.${topTalent.category}`)} ({Math.round(topTalent.score)}{t("common.score")})
                        </div>
                      )}
                    </div>

                    {/* Score + Rank */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          {Math.round(entry.overallScore || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("leaderboard.totalScore")}</div>
                      </div>
                      <RankBadge rank={(entry.overallRank as Rank) || "C"} size="md" />
                    </div>
                  </div>
                </button>

                {/* Expanded talent details */}
                {isExpanded && (
                  <div className="mx-4 mt-1 mb-2 p-4 rounded-lg bg-muted/20 border border-border/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {Object.entries(entry.talents).map(([cat, score]) => {
                        if (typeof score !== "number") return null;
                        const category = cat as TalentCategory;
                        return (
                          <div key={cat} className="flex items-center gap-1.5">
                            <TalentIcon category={category} size={14} className="text-primary" />
                            <span className="text-muted-foreground truncate">
                              {t(`talent.${category}`)}
                            </span>
                            <span className="font-bold ml-auto">{Math.round(score)}</span>
                          </div>
                        );
                      })}
                    </div>
                    {entry.completedAt && (
                      <div className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border/30">
                        {t("leaderboard.completedAt")} {new Date(entry.completedAt).toLocaleDateString("zh-CN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
