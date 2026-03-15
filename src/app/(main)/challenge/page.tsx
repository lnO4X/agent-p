"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { useIsMobile } from "@/hooks/use-device";
import { gameRegistry } from "@/games";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TalentIcon } from "@/components/talent-icon";
import { scoreToRank, RANK_COLORS } from "@/lib/scoring";
import { Flame, CheckCircle2, TrendingUp, Zap, Trophy } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TalentCategory } from "@/types/talent";
import type { GameRawResult } from "@/types/game";

interface ChallengeData {
  game: {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    primaryTalent: TalentCategory;
    difficulty: string;
    estimatedDurationSec: number;
    instructions: string;
    icon: string;
    mobileCompatible: boolean;
  };
  talentCategory: TalentCategory;
  completedToday: boolean;
  todayScore: number | null;
  currentTalentScore: number | null;
  history: Array<{ score: number; completedAt: string }>;
  streak: number;
  totalCompleted: number;
}

type Phase = "loading" | "ready" | "instructions" | "playing" | "result";

export default function ChallengePage() {
  const { t, locale } = useI18n();
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<ChallengeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultScore, setResultScore] = useState<number>(0);
  const [updatedTalent, setUpdatedTalent] = useState<{
    score: number;
    rank: string;
  } | null>(null);

  // Fetch today's challenge
  useEffect(() => {
    fetch("/api/challenge")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
          setPhase("ready");
        } else {
          setError(json.error?.message || "Failed to load");
        }
      })
      .catch(() => setError("Network error"));
  }, []);

  // Get game component from registry
  const GameComponent = useMemo(() => {
    if (!data) return null;
    const game = gameRegistry.get(data.game.id);
    return game?.component || null;
  }, [data]);

  const handleComplete = useCallback(
    async (result: GameRawResult) => {
      if (!data) return;
      try {
        const res = await fetch("/api/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId: data.game.id,
            rawScore: result.rawScore,
            durationMs: result.durationMs,
            metadata: result.metadata,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setResultScore(json.data.normalizedScore);
          if (json.data.updatedTalentScore != null) {
            setUpdatedTalent({
              score: json.data.updatedTalentScore,
              rank: json.data.updatedRank,
            });
          }
          // Update local data to reflect completion
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  completedToday: true,
                  todayScore: json.data.normalizedScore,
                  streak: prev.streak + (prev.streak === 0 ? 1 : 0),
                  totalCompleted: prev.totalCompleted + 1,
                  history: [
                    ...prev.history,
                    {
                      score: json.data.normalizedScore,
                      completedAt: new Date().toISOString(),
                    },
                  ].slice(-8),
                }
              : prev
          );
          setPhase("result");
        } else {
          setError(json.error?.message || "Submit failed");
          setPhase("ready");
        }
      } catch {
        setError("Network error");
        setPhase("ready");
      }
    },
    [data]
  );

  const handleAbort = useCallback(() => {
    setPhase("ready");
  }, []);

  const gameName =
    locale === "en" && data?.game.nameEn ? data.game.nameEn : data?.game.name;

  // ─── Loading state ───
  if (phase === "loading") {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (!data) return null;

  // ─── Playing state (full screen game) ───
  if (phase === "playing" && GameComponent) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          {t("challenge.playing")} — {gameName}
        </div>
        <GameComponent onComplete={handleComplete} onAbort={handleAbort} />
      </div>
    );
  }

  // ─── Result state ───
  if (phase === "result") {
    const rank = scoreToRank(resultScore);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>{t("challenge.completed")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full border-2 text-3xl font-bold ${RANK_COLORS[rank]}`}
              >
                {rank}
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">
                  {Math.round(resultScore)} {t("common.score")}
                </div>
                <div className="text-sm text-muted-foreground">{gameName}</div>
              </div>
            </div>
            {updatedTalent && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <TalentIcon category={data.talentCategory} size={16} />
                <span>{t(`talent.${data.talentCategory}`)}</span>
                <TrendingUp size={14} className="text-green-500" />
                <span className="font-medium">
                  {Math.round(updatedTalent.score)} ({updatedTalent.rank})
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend chart */}
        {data.history.length > 1 && <TrendChart data={data} t={t} />}

        <div className="text-center">
          <Button variant="outline" onClick={() => setPhase("ready")}>
            {t("common.back")}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Instructions state ───
  if (phase === "instructions") {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <TalentIcon
                category={data.talentCategory}
                size={40}
                className="text-primary"
              />
            </div>
            <CardTitle>{gameName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {data.game.instructions}
            </p>
            <div className="flex gap-4 justify-center text-sm text-muted-foreground">
              <span>
                ~{data.game.estimatedDurationSec}
                {t("test.seconds")}
              </span>
              <span>{t(`test.${data.game.difficulty}`)}</span>
            </div>
          </CardContent>
          <div className="px-6 pb-6 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPhase("ready")}
              className="flex-1"
            >
              {t("common.back")}
            </Button>
            <Button onClick={() => setPhase("playing")} className="flex-1">
              {t("challenge.startChallenge")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Ready state (main challenge overview) ───
  const canPlay =
    !data.completedToday &&
    (data.game.mobileCompatible || !isMobile);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t("challenge.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("challenge.subtitle")}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              <Flame size={20} className="text-orange-500" />
              {data.streak}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("challenge.streak")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{data.totalCompleted}</div>
            <div className="text-xs text-muted-foreground">
              {t("challenge.totalChallenges")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">
              {data.currentTalentScore != null
                ? Math.round(data.currentTalentScore)
                : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              {t(`talent.${data.talentCategory}`)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's challenge card */}
      <Card
        className={
          data.completedToday
            ? "border-green-500/30 bg-green-500/5"
            : "border-primary/30 bg-primary/5"
        }
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10">
              <TalentIcon
                category={data.talentCategory}
                size={24}
                className="text-primary"
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">
                {t("challenge.todayChallenge")}
              </CardTitle>
              <div className="text-sm text-muted-foreground">{gameName}</div>
            </div>
            {data.completedToday && (
              <CheckCircle2 size={24} className="text-green-500" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {data.game.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap size={12} />
              {t(`talent.${data.talentCategory}`)}
            </span>
            <span>~{data.game.estimatedDurationSec}{t("test.seconds")}</span>
            <span>{t(`test.${data.game.difficulty}`)}</span>
          </div>

          {data.completedToday && data.todayScore != null ? (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm font-medium">
                {t("challenge.todayResult")}:
              </span>
              <span
                className={`text-sm font-bold ${RANK_COLORS[scoreToRank(data.todayScore)]}`}
              >
                {scoreToRank(data.todayScore)} — {Math.round(data.todayScore)}
                {t("common.score")}
              </span>
            </div>
          ) : (
            <Button
              onClick={() => setPhase("instructions")}
              disabled={!canPlay}
              className="w-full"
            >
              {!data.game.mobileCompatible && isMobile
                ? t("test.pcOnly")
                : t("challenge.startChallenge")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Trend chart */}
      {data.history.length > 1 && <TrendChart data={data} t={t} />}

      {/* Leaderboard link */}
      <Link href="/challenge/leaderboard">
        <Card className="pressable hover:bg-muted/30 transition-colors">
          <CardContent className="py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Trophy size={18} className="text-yellow-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">
                {locale === "zh" ? "挑战排行榜" : "Challenge Leaderboard"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {locale === "zh" ? "看看谁坚持得最久" : "See who has the longest streak"}
              </div>
            </div>
            <Zap size={16} className="text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

// ─── Trend chart component ───
function TrendChart({
  data,
  t,
}: {
  data: ChallengeData;
  t: (key: string) => string;
}) {
  const chartData = data.history.map((h, i) => ({
    label: `#${i + 1}`,
    score: Math.round(h.score),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp size={16} />
          {t("challenge.trendTitle")} — {t(`talent.${data.talentCategory}`)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  fontSize: "12px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--background))",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
