"use client";

import { useState, useEffect, useCallback, useMemo, use } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { gameRegistry } from "@/games";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { scoreToRank, RANK_COLORS } from "@/lib/scoring";
import {
  Swords,
  Trophy,
  Share2,
  ArrowRight,
  Crown,
  Frown,
  Equal,
} from "lucide-react";
import type { GameRawResult } from "@/types/game";

interface PkData {
  id: string;
  gameId: string;
  gameName: string;
  gameNameEn: string;
  gameIcon: string;
  creatorName: string;
  creatorScore: number;
  challengerName: string | null;
  challengerScore: number | null;
  status: "pending" | "completed";
}

type Phase = "loading" | "intro" | "name" | "playing" | "submitting" | "result";

export default function PkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<Phase>("loading");
  const [pk, setPk] = useState<PkData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [challengerName, setChallengerName] = useState("");
  const [resultData, setResultData] = useState<{
    challengerScore: number;
    creatorScore: number;
    creatorName: string;
    result: "creator_wins" | "challenger_wins" | "tie";
  } | null>(null);

  // Fetch PK challenge
  useEffect(() => {
    fetch(`/api/pk/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setPk(json.data);
          setPhase(json.data.status === "completed" ? "result" : "intro");
          if (json.data.status === "completed") {
            // Reconstruct result data from completed PK
            const cScore = json.data.challengerScore ?? 0;
            const crScore = json.data.creatorScore;
            const tie = Math.abs(crScore - cScore) < 0.5;
            setResultData({
              challengerScore: cScore,
              creatorScore: crScore,
              creatorName: json.data.creatorName,
              result: tie
                ? "tie"
                : crScore > cScore
                  ? "creator_wins"
                  : "challenger_wins",
            });
          }
        } else {
          setError(
            json.error?.message ||
              (isZh ? "挑战不存在" : "Challenge not found")
          );
        }
      })
      .catch(() =>
        setError(isZh ? "网络错误，请重试" : "Network error")
      );
  }, [id, isZh]);

  const GameComponent = useMemo(() => {
    if (!pk) return null;
    const game = gameRegistry.get(pk.gameId);
    return game?.component ?? null;
  }, [pk]);

  const handleComplete = useCallback(
    async (result: GameRawResult) => {
      if (!pk) return;
      setPhase("submitting");
      try {
        const res = await fetch(`/api/pk/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengerName: challengerName || (isZh ? "匿名玩家" : "Anonymous"),
            rawScore: result.rawScore,
            durationMs: result.durationMs,
            metadata: result.metadata,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setResultData(json.data);
          setPk((prev) =>
            prev
              ? {
                  ...prev,
                  challengerName:
                    challengerName || (isZh ? "匿名玩家" : "Anonymous"),
                  challengerScore: json.data.challengerScore,
                  status: "completed",
                }
              : prev
          );
          setPhase("result");
        } else {
          setError(
            json.error?.message ||
              (isZh ? "提交失败" : "Submit failed")
          );
          setPhase("intro");
        }
      } catch {
        setError(isZh ? "网络错误" : "Network error");
        setPhase("intro");
      }
    },
    [pk, id, challengerName, isZh]
  );

  const handleAbort = useCallback(() => {
    setPhase("intro");
  }, []);

  const gameName = pk
    ? locale === "en" && pk.gameNameEn
      ? pk.gameNameEn
      : pk.gameName
    : "";

  async function handleShare() {
    const url = `${window.location.origin}/pk/${id}`;
    const text = isZh
      ? `来和我 PK！我在「${gameName}」拿了 ${Math.round(pk?.creatorScore ?? 0)} 分，你能赢我吗？`
      : `Challenge me! I scored ${Math.round(pk?.creatorScore ?? 0)} in ${gameName}. Can you beat me?`;
    if (navigator.share) {
      try {
        await navigator.share({ title: isZh ? "GameTan PK" : "GameTan PK", text, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
  }

  // ─── Loading ───
  if (phase === "loading") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {isZh ? "加载中..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-destructive">{error}</p>
        <Link href="/quiz">
          <Button>{isZh ? "去测试" : "Take the Quiz"}</Button>
        </Link>
      </div>
    );
  }

  if (!pk) return null;

  // ─── Playing ───
  if (phase === "playing" && GameComponent) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <Swords size={16} className="text-primary" />
            <span className="font-medium">
              {isZh ? "PK 挑战" : "PK Challenge"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{gameName}</span>
        </div>
        <div className="flex-1 p-4">
          <GameComponent onComplete={handleComplete} onAbort={handleAbort} />
        </div>
      </div>
    );
  }

  // ─── Submitting ───
  if (phase === "submitting") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {isZh ? "提交中..." : "Submitting..."}
        </p>
      </div>
    );
  }

  // ─── Result (both completed view and after submission) ───
  if (phase === "result" && resultData) {
    const challengerRank = scoreToRank(resultData.challengerScore);
    const creatorRank = scoreToRank(resultData.creatorScore);
    const isWinner = resultData.result === "challenger_wins";
    const isTie = resultData.result === "tie";
    const challengerDisplayName =
      pk.challengerName || challengerName || (isZh ? "挑战者" : "Challenger");

    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <Swords size={32} className="text-primary mx-auto" />
            <h1 className="text-2xl font-bold">
              {isZh ? "PK 结果" : "PK Result"}
            </h1>
            <p className="text-sm text-muted-foreground">{gameName}</p>
          </div>

          {/* Score comparison */}
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-4">
                {/* Creator */}
                <div className="flex-1 text-center">
                  <div className="text-xs text-muted-foreground mb-1 truncate">
                    {resultData.creatorName}
                  </div>
                  <div
                    className={`text-3xl font-bold ${RANK_COLORS[creatorRank]}`}
                  >
                    {Math.round(resultData.creatorScore)}
                  </div>
                  <div className={`text-sm font-medium ${RANK_COLORS[creatorRank]}`}>
                    {creatorRank}
                  </div>
                  {resultData.result === "creator_wins" && (
                    <Crown size={16} className="text-amber-500 mx-auto mt-1" />
                  )}
                </div>

                {/* VS */}
                <div className="text-lg font-bold text-muted-foreground">VS</div>

                {/* Challenger */}
                <div className="flex-1 text-center">
                  <div className="text-xs text-muted-foreground mb-1 truncate">
                    {challengerDisplayName}
                  </div>
                  <div
                    className={`text-3xl font-bold ${RANK_COLORS[challengerRank]}`}
                  >
                    {Math.round(resultData.challengerScore)}
                  </div>
                  <div className={`text-sm font-medium ${RANK_COLORS[challengerRank]}`}>
                    {challengerRank}
                  </div>
                  {isWinner && (
                    <Crown size={16} className="text-amber-500 mx-auto mt-1" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result banner */}
          <Card
            className={
              isTie
                ? "border-muted bg-muted/20"
                : isWinner
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
            }
          >
            <CardContent className="py-4 text-center">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                {isTie ? (
                  <>
                    <Equal size={20} className="text-muted-foreground" />
                    {isZh ? "平局！旗鼓相当" : "It's a Tie!"}
                  </>
                ) : isWinner ? (
                  <>
                    <Trophy size={20} className="text-green-500" />
                    {isZh
                      ? `${challengerDisplayName} 赢了！`
                      : `${challengerDisplayName} Wins!`}
                  </>
                ) : (
                  <>
                    <Frown size={20} className="text-red-400" />
                    {isZh
                      ? `${resultData.creatorName} 赢了！`
                      : `${resultData.creatorName} Wins!`}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button className="w-full h-11" onClick={handleShare}>
              <Share2 size={16} className="mr-2" />
              {isZh ? "分享结果" : "Share Result"}
            </Button>
            <Link href="/quiz" className="block">
              <Button variant="outline" className="w-full h-11">
                <ArrowRight size={16} className="mr-2" />
                {isZh ? "测测你的玩家原型" : "Discover Your Gamer Archetype"}
              </Button>
            </Link>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-2">
            game.weda.ai
          </div>
        </div>
      </div>
    );
  }

  // ─── Name input ───
  if (phase === "name") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-sm w-full space-y-6">
          <div className="text-center space-y-2">
            <Swords size={32} className="text-primary mx-auto" />
            <h2 className="text-xl font-bold">
              {isZh ? "输入你的名字" : "Enter Your Name"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isZh
                ? "让对手知道谁在挑战！"
                : "Let your opponent know who's challenging!"}
            </p>
          </div>
          <input
            type="text"
            value={challengerName}
            onChange={(e) => setChallengerName(e.target.value)}
            placeholder={isZh ? "你的名字" : "Your name"}
            maxLength={30}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && challengerName.trim()) {
                setPhase("playing");
              }
            }}
          />
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setChallengerName(isZh ? "匿名玩家" : "Anonymous");
                setPhase("playing");
              }}
            >
              {isZh ? "跳过" : "Skip"}
            </Button>
            <Button
              className="flex-1"
              disabled={!challengerName.trim()}
              onClick={() => setPhase("playing")}
            >
              {isZh ? "开始 PK" : "Start PK"}
              <Swords size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Intro (challenge invitation) ───
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Challenge card */}
        <div className="text-center space-y-4">
          <div className="text-5xl">{pk.gameIcon}</div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Swords size={14} />
              {isZh ? "PK 挑战" : "PK Challenge"}
            </div>
            <h1 className="text-2xl font-bold">
              {isZh
                ? `${pk.creatorName} 向你发起挑战！`
                : `${pk.creatorName} challenges you!`}
            </h1>
            <p className="text-muted-foreground">
              {isZh
                ? `在「${gameName}」中和 TA 一决高下`
                : `Beat them in ${gameName}`}
            </p>
          </div>
        </div>

        {/* Creator score tease */}
        <Card className="border-primary/20">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">
                  {pk.creatorName}
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(pk.creatorScore)}{" "}
                  <span className="text-sm text-muted-foreground">
                    {isZh ? "分" : "pts"}
                  </span>
                </div>
              </div>
              <div
                className={`text-2xl font-bold ${RANK_COLORS[scoreToRank(pk.creatorScore)]}`}
              >
                {scoreToRank(pk.creatorScore)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accept button */}
        <Button
          size="lg"
          className="w-full h-14 text-lg"
          onClick={() => setPhase("name")}
        >
          <Swords size={20} className="mr-2" />
          {isZh ? "接受挑战" : "Accept Challenge"}
        </Button>

        <div className="text-center">
          <Link
            href="/quiz"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            {isZh
              ? "不想 PK？去测测你的玩家原型 →"
              : "Not up for PK? Discover your gamer archetype →"}
          </Link>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          game.weda.ai
        </div>
      </div>
    </div>
  );
}
