"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { trackEvent as track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";
import { gameRegistry } from "@/games";
import { QUICK_TEST_GAMES } from "@/lib/archetype";
import { getAllGameQuizIds, getGameQuiz } from "@/lib/game-quizzes";
import { Zap, Brain, Dice5, ArrowRight, ClipboardList, Gamepad2 } from "lucide-react";
import type { GameRawResult } from "@/types/game";
import Link from "next/link";

type Phase = "intro" | "playing" | "transition";

const GAME_META = [
  { id: "reaction-speed", icon: Zap, labelZh: "反应速度", labelEn: "Reaction Speed", color: "text-blue-400" },
  { id: "pattern", icon: Brain, labelZh: "模式识别", labelEn: "Pattern Recognition", color: "text-purple-400" },
  { id: "risk", icon: Dice5, labelZh: "风险决策", labelEn: "Risk & Decision", color: "text-amber-400" },
] as const;

export default function QuizPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const [phase, setPhase] = useState<Phase>("intro");
  const [gameIndex, setGameIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  const currentGameId = QUICK_TEST_GAMES[gameIndex];
  const currentPlugin = useMemo(
    () => gameRegistry.get(currentGameId),
    [currentGameId]
  );

  const GameComponent = currentPlugin?.component ?? null;

  const handleComplete = useCallback(
    (result: GameRawResult) => {
      if (!currentPlugin) return;

      // Normalize score client-side using the game's scorer
      const normalized = currentPlugin.scorer.normalize(
        result.rawScore,
        result.durationMs,
        result.metadata
      );

      const newScores = [...scores, normalized];
      setScores(newScores);

      if (gameIndex < QUICK_TEST_GAMES.length - 1) {
        // Show transition screen, then next game
        setPhase("transition");
      } else {
        // All 3 games done → navigate to result
        const encoded = newScores.map((s) => Math.round(s)).join("-");
        router.push(`/quiz/result?s=${encoded}&own=1`);
      }
    },
    [currentPlugin, scores, gameIndex, router]
  );

  const handleAbort = useCallback(() => {
    setPhase("intro");
    setGameIndex(0);
    setScores([]);
  }, []);

  const startNextGame = () => {
    setGameIndex((i) => i + 1);
    setPhase("playing");
  };

  // ─── Intro screen ───
  if (phase === "intro") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold">
              {locale === "zh"
                ? "你是什么类型的玩家？"
                : "What Kind of Gamer Are You?"}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              {locale === "zh"
                ? "3个小游戏，3分钟，揭示你的游戏原型"
                : "3 mini-games, 3 minutes — discover your gamer archetype"}
            </p>
          </div>

          {/* Game preview cards */}
          <div className="space-y-3">
            {GAME_META.map((meta, i) => {
              const Icon = meta.icon;
              return (
                <div
                  key={meta.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Icon size={20} className={meta.color} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">
                      {locale === "zh"
                        ? `第${i + 1}关: ${meta.labelZh}`
                        : `Round ${i + 1}: ${meta.labelEn}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ~{currentPlugin
                        ? gameRegistry.get(meta.id)?.estimatedDurationSec
                        : 30}
                      {locale === "zh" ? "秒" : "s"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Two modes */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full h-14 text-lg"
              onClick={() => {
                track("quiz_start", { mode: "quick" });
                setPhase("playing");
              }}
            >
              {locale === "zh" ? "开始快速测试" : "Quick Test"}
              <ArrowRight size={20} className="ml-2" />
            </Button>

            <Link href="/quiz/questions" className="block" onClick={() => track("quiz_start", { mode: "questionnaire" })}>
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 text-base pressable"
              >
                <ClipboardList size={18} className="mr-2" />
                {locale === "zh"
                  ? "精确问卷 (39题 · 5分钟)"
                  : "Full Questionnaire (39Q · 5min)"}
              </Button>
            </Link>
          </div>

          {/* Game-specific quizzes */}
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
              <Gamepad2 size={16} />
              {locale === "zh" ? "游戏专属测试" : "Game-Specific Quizzes"}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {getAllGameQuizIds().map((gameId) => {
                const quiz = getGameQuiz(gameId);
                if (!quiz) return null;
                return (
                  <Link
                    key={gameId}
                    href={`/quiz/${gameId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm hover:bg-muted transition-colors pressable"
                  >
                    <span>{quiz.icon}</span>
                    <span>{locale === "zh" ? quiz.gameName : quiz.gameNameEn}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {locale === "zh"
              ? "无需注册 · 结果即时生成 · 可分享"
              : "No registration · Instant results · Shareable"}
          </p>
        </div>
      </div>
    );
  }

  // ─── Transition screen between games ───
  if (phase === "transition") {
    const nextMeta = GAME_META[gameIndex + 1];
    const NextIcon = nextMeta?.icon;
    const prevScore = scores[scores.length - 1];
    const prevMeta = GAME_META[gameIndex];

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Previous game result */}
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              {Math.round(prevScore)}
            </div>
            <div className="text-sm text-muted-foreground">
              {locale === "zh" ? prevMeta.labelZh : prevMeta.labelEn}
            </div>
          </div>

          {/* Progress */}
          <div className="flex justify-center gap-2">
            {GAME_META.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-12 rounded-full ${
                  i <= gameIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Next game preview */}
          {nextMeta && NextIcon && (
            <div className="space-y-3">
              <div className="text-muted-foreground text-sm">
                {locale === "zh" ? "下一关" : "Next Round"}
              </div>
              <div className="flex items-center justify-center gap-3">
                <NextIcon size={24} className={nextMeta.color} />
                <span className="text-lg font-semibold">
                  {locale === "zh" ? nextMeta.labelZh : nextMeta.labelEn}
                </span>
              </div>
            </div>
          )}

          <Button size="lg" className="w-full h-12" onClick={startNextGame}>
            {locale === "zh" ? "继续" : "Continue"}
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Playing state ───
  if (phase === "playing" && GameComponent) {
    const meta = GAME_META[gameIndex];
    return (
      <div className="flex-1 flex flex-col">
        {/* Mini header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {gameIndex + 1}/{QUICK_TEST_GAMES.length}
            </span>
            <span className="font-medium">
              {locale === "zh" ? meta.labelZh : meta.labelEn}
            </span>
          </div>
          <div className="flex gap-1.5">
            {GAME_META.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full ${
                  i < gameIndex
                    ? "bg-primary"
                    : i === gameIndex
                      ? "bg-primary/50"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Game area */}
        <div className="flex-1 p-4">
          <GameComponent onComplete={handleComplete} onAbort={handleAbort} />
        </div>
      </div>
    );
  }

  return null;
}
