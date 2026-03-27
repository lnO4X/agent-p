"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Flame,
  Target,
  ArrowLeft,
  Crown,
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  totalChallenges: number;
  avgScore: number;
  streak: number;
}

interface MyStats {
  totalChallenges: number;
  avgScore: number;
  streak: number;
  rank: number | null;
}

// Streak milestone badges
const STREAK_MILESTONES = [
  { days: 7, label: "7d", color: "text-orange-500", bg: "bg-orange-500/10" },
  { days: 14, label: "14d", color: "text-red-500", bg: "bg-red-500/10" },
  { days: 30, label: "30d", color: "text-primary", bg: "bg-primary/10" },
  { days: 60, label: "60d", color: "text-blue-500", bg: "bg-blue-500/10" },
  { days: 100, label: "100d", color: "text-yellow-500", bg: "bg-yellow-500/10" },
];

function getStreakBadge(streak: number) {
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    if (streak >= STREAK_MILESTONES[i].days) {
      return STREAK_MILESTONES[i];
    }
  }
  return null;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-700" />;
  return (
    <span className="text-xs text-muted-foreground tabular-nums w-4 text-center">
      {rank}
    </span>
  );
}

export default function ChallengeLeaderboardPage() {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenge/leaderboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setEntries(json.data.leaderboard);
          setMyStats(json.data.me);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/challenge"
          className="pressable p-1 -ml-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {isZh ? "挑战排行榜" : "Challenge Leaderboard"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isZh ? "坚持每日挑战，提升排名" : "Complete daily challenges to climb the ranks"}
          </p>
        </div>
      </div>

      {/* My stats card */}
      {myStats && !loading && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-muted-foreground mb-2">
              {isZh ? "我的挑战数据" : "My Challenge Stats"}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="text-xl font-bold tabular-nums">
                  {myStats.totalChallenges}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {isZh ? "总挑战" : "Total"}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div className="text-xl font-bold tabular-nums">
                  {myStats.streak}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {isZh ? "连续天数" : "Streak"}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                </div>
                <div className="text-xl font-bold tabular-nums">
                  {myStats.avgScore > 0 ? myStats.avgScore : "—"}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {isZh ? "平均分" : "Avg Score"}
                </div>
              </div>
            </div>
            {myStats.rank && (
              <div className="text-center mt-3 pt-3 border-t border-border/30">
                <span className="text-xs text-muted-foreground">
                  {isZh ? `排名第 ${myStats.rank} 名` : `Ranked #${myStats.rank}`}
                </span>
              </div>
            )}

            {/* Streak badges earned */}
            {myStats.streak >= 7 && (
              <div className="flex gap-2 justify-center mt-3 pt-3 border-t border-border/30">
                {STREAK_MILESTONES.filter((m) => myStats.streak >= m.days).map(
                  (m) => (
                    <span
                      key={m.days}
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        m.bg,
                        m.color
                      )}
                    >
                      🔥 {m.label}
                    </span>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-14 bg-muted/50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {isZh ? "暂无挑战数据" : "No challenge data yet"}
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => {
            const badge = getStreakBadge(entry.streak);
            return (
              <Card
                key={entry.userId}
                className={cn(
                  "transition-colors",
                  entry.rank <= 3 && "border-yellow-500/20 bg-yellow-500/5"
                )}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-6 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${entry.username}`}
                          className="text-sm font-medium truncate hover:text-primary transition-colors"
                        >
                          {entry.displayName || entry.username}
                        </Link>
                        {badge && (
                          <span
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0",
                              badge.bg,
                              badge.color
                            )}
                          >
                            🔥{badge.label}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        @{entry.username}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-right flex-shrink-0">
                      <div>
                        <div className="text-sm font-bold tabular-nums">
                          {entry.totalChallenges}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          {isZh ? "挑战" : "challenges"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold tabular-nums flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {entry.streak}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          {isZh ? "连续" : "streak"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold tabular-nums">
                          {entry.avgScore}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          {isZh ? "均分" : "avg"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
