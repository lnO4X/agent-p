"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { trackEvent as track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";
import { gameRegistry } from "@/games";
import { QUICK_TEST_GAMES } from "@/lib/archetype";
import {
  Zap,
  Brain,
  Dice5,
  ArrowRight,
  Gamepad2,
} from "lucide-react";
import type { GameRawResult } from "@/types/game";

type Phase = "intro" | "playing" | "transition";

const GAME_META = [
  { id: "reaction-speed", icon: Zap, labelZh: "反应速度", labelEn: "Reaction Speed", color: "text-blue-400" },
  { id: "pattern", icon: Brain, labelZh: "模式识别", labelEn: "Pattern Recognition", color: "text-primary" },
  { id: "risk", icon: Dice5, labelZh: "风险决策", labelEn: "Risk & Decision", color: "text-amber-400" },
] as const;

export default function QuizPage() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<Phase>("intro");

  // ─── Mini-game state ───
  const [gameIndex, setGameIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  const currentGameId = QUICK_TEST_GAMES[gameIndex];
  const currentPlugin = useMemo(
    () => gameRegistry.get(currentGameId),
    [currentGameId]
  );
  const GameComponent = currentPlugin?.component ?? null;

  // ─── Mini-game handlers ───
  const handleComplete = useCallback(
    (result: GameRawResult) => {
      if (!currentPlugin) return;
      const normalized = currentPlugin.scorer.normalize(
        result.rawScore,
        result.durationMs,
        result.metadata
      );
      const newScores = [...scores, normalized];
      setScores(newScores);

      if (gameIndex < QUICK_TEST_GAMES.length - 1) {
        setPhase("transition");
      } else {
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

  // ═══════════════════════════════════════════════════
  // INTRO SCREEN — Mini-games (talent test) is the default CTA
  // ═══════════════════════════════════════════════════
  if (phase === "intro") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold">
              {t("quiz.proLevelTalent")}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              {t("quiz.threeGamesDesc")}
            </p>
          </div>

          {/* Primary CTA — Mini-Games (Talent Test) */}
          <Button
            size="lg"
            className="w-full h-14 text-lg bg-accent hover:bg-accent/90 text-accent-foreground pressable"
            onClick={() => {
              track("quiz_start", { mode: "quick" });
              setPhase("playing");
            }}
          >
            <Gamepad2 size={20} className="mr-2" />
            {t("quiz.testYourTalent")}
            <ArrowRight size={20} className="ml-2" />
          </Button>

          <p className="text-xs text-muted-foreground">
            {t("quiz.noRegistration")}
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // MINI-GAME: Transition screen between games
  // ═══════════════════════════════════════════════════
  if (phase === "transition") {
    const nextMeta = GAME_META[gameIndex + 1];
    const NextIcon = nextMeta?.icon;
    const prevScore = scores[scores.length - 1];
    const prevMeta = GAME_META[gameIndex];

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              {Math.round(prevScore)}
            </div>
            <div className="text-sm text-muted-foreground">
              {isZh ? prevMeta.labelZh : prevMeta.labelEn}
            </div>
          </div>

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

          {nextMeta && NextIcon && (
            <div className="space-y-3">
              <div className="text-muted-foreground text-sm">
                {t("quiz.nextRound")}
              </div>
              <div className="flex items-center justify-center gap-3">
                <NextIcon size={24} className={nextMeta.color} />
                <span className="text-lg font-semibold">
                  {isZh ? nextMeta.labelZh : nextMeta.labelEn}
                </span>
              </div>
            </div>
          )}

          <Button size="lg" className="w-full h-12" onClick={startNextGame}>
            {t("quiz.continue")}
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // MINI-GAME: Playing state
  // ═══════════════════════════════════════════════════
  if (phase === "playing" && GameComponent) {
    const meta = GAME_META[gameIndex];
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {gameIndex + 1}/{QUICK_TEST_GAMES.length}
            </span>
            <span className="font-medium">
              {isZh ? meta.labelZh : meta.labelEn}
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

        <div className="flex-1 p-4">
          <GameComponent onComplete={handleComplete} onAbort={handleAbort} />
        </div>
      </div>
    );
  }

  return null;
}
