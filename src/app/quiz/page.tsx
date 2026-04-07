"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { trackEvent as track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";
import { gameRegistry } from "@/games";
import { TIER_CONFIGS, type TestTier } from "@/lib/test-tiers";
import {
  Zap,
  Brain,
  Dice5,
  ArrowRight,
  Gamepad2,
  Lock,
  Crown,
  ChevronRight,
} from "lucide-react";
import type { GameRawResult } from "@/types/game";

type Phase = "select" | "playing" | "transition" | "checking";

/** Icon map for talent-based game coloring */
const TALENT_ICONS: Record<string, { icon: typeof Zap; color: string }> = {
  "reaction-speed": { icon: Zap, color: "text-blue-400" },
  "pattern": { icon: Brain, color: "text-primary" },
  "risk": { icon: Dice5, color: "text-amber-400" },
  "hand-eye": { icon: Zap, color: "text-emerald-400" },
  "memory": { icon: Brain, color: "text-violet-400" },
  "strategy": { icon: Brain, color: "text-cyan-400" },
  "decision": { icon: Zap, color: "text-orange-400" },
  "spatial": { icon: Brain, color: "text-indigo-400" },
  "rhythm": { icon: Gamepad2, color: "text-pink-400" },
  "multitask": { icon: Zap, color: "text-rose-400" },
  "emotional": { icon: Brain, color: "text-teal-400" },
  "teamwork": { icon: Gamepad2, color: "text-lime-400" },
  "resource": { icon: Brain, color: "text-yellow-400" },
};

export default function QuizPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [phase, setPhase] = useState<Phase>("select");
  const [selectedTier, setSelectedTier] = useState<TestTier>("quick");

  // Game state
  const [gameIndex, setGameIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  const tierConfig = TIER_CONFIGS[selectedTier];
  const gameIds = tierConfig.gameIds;
  const currentGameId = gameIds[gameIndex];
  const currentPlugin = useMemo(
    () => gameRegistry.get(currentGameId),
    [currentGameId]
  );
  const GameComponent = currentPlugin?.component ?? null;

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

      if (gameIndex < gameIds.length - 1) {
        setPhase("transition");
      } else {
        const encoded = newScores.map((s) => Math.round(s)).join("-");
        router.push(`/quiz/result?s=${encoded}&own=1&tier=${selectedTier}`);
      }
    },
    [currentPlugin, scores, gameIndex, gameIds, router, selectedTier]
  );

  const handleAbort = useCallback(() => {
    setPhase("select");
    setGameIndex(0);
    setScores([]);
  }, []);

  const startTest = (tier: TestTier) => {
    const config = TIER_CONFIGS[tier];
    if (config.requiresAuth) {
      setSelectedTier(tier);
      setPhase("checking");
      fetch("/api/auth/me", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (!data.success) {
            router.push(`/login?next=/quiz&tier=${tier}`);
            return;
          }
          setGameIndex(0);
          setScores([]);
          track("quiz_start", { mode: tier });
          setPhase("playing");
        })
        .catch(() => router.push(`/login?next=/quiz&tier=${tier}`));
      return;
    }
    setSelectedTier(tier);
    setGameIndex(0);
    setScores([]);
    track("quiz_start", { mode: tier });
    setPhase("playing");
  };

  // ═══════════════════════════════════════════════════
  // TIER SELECTION SCREEN
  // ═══════════════════════════════════════════════════
  if (phase === "select") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">
              {t("quiz.proLevelTalent")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("quiz.threeGamesDesc")}
            </p>
          </div>

          {/* Tier Cards */}
          <div className="space-y-3">
            {(["quick", "standard", "pro"] as TestTier[]).map((tier) => {
              const config = TIER_CONFIGS[tier];
              const isQuick = tier === "quick";
              const isPro = tier === "pro";
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => startTest(tier)}
                  className={`w-full text-left rounded-2xl p-4 transition-all pressable ${
                    isPro
                      ? "bg-accent/10 border-2 border-accent/30 hover:border-accent/50"
                      : "bg-muted/40 border border-foreground/5 hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isPro && <Crown className="w-4 h-4 text-accent" />}
                        <span className="font-semibold text-sm">
                          {t(`quiz.tier.${tier}`)}
                        </span>
                        {!isQuick && !isPro && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {t("quiz.recommended")}
                          </span>
                        )}
                        {isPro && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                            ${config.priceUsd}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t(`quiz.tier.${tier}Desc`)}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/80">
                        <span>{config.dimensions} {t("quiz.dimensions")}</span>
                        <span>·</span>
                        <span>~{config.timeMinutes} min</span>
                        {config.features.aiCoach && (
                          <>
                            <span>·</span>
                            <span>AI Coach</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <ChevronRight className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-[11px] text-muted-foreground/60">
            {t("quiz.noRegistration")}
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // CHECKING AUTH
  // ═══════════════════════════════════════════════════
  if (phase === "checking") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            {t("quiz.loginToContinue")}
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // TRANSITION SCREEN
  // ═══════════════════════════════════════════════════
  if (phase === "transition") {
    const prevPlugin = gameRegistry.get(gameIds[gameIndex]);
    const nextPlugin = gameRegistry.get(gameIds[gameIndex + 1]);
    const prevScore = scores[scores.length - 1];
    const nextInfo = TALENT_ICONS[gameIds[gameIndex + 1]] ?? { icon: Brain, color: "text-primary" };
    const NextIcon = nextInfo.icon;

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              {Math.round(prevScore)}
            </div>
            <div className="text-sm text-muted-foreground">
              {prevPlugin?.nameEn ?? prevPlugin?.name}
            </div>
          </div>

          <div className="flex justify-center gap-1.5">
            {gameIds.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i <= gameIndex ? "bg-primary w-8" : "bg-muted w-6"
                }`}
              />
            ))}
          </div>

          {nextPlugin && (
            <div className="space-y-3">
              <div className="text-muted-foreground text-sm">
                {t("quiz.nextRound")}
              </div>
              <div className="flex items-center justify-center gap-3">
                <NextIcon size={24} className={nextInfo.color} />
                <span className="text-lg font-semibold">
                  {nextPlugin.nameEn ?? nextPlugin.name}
                </span>
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="w-full h-12"
            onClick={() => {
              setGameIndex((i) => i + 1);
              setPhase("playing");
            }}
          >
            {t("quiz.continue")}
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // PLAYING STATE
  // ═══════════════════════════════════════════════════
  if (phase === "playing" && GameComponent) {
    const plugin = gameRegistry.get(currentGameId);
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {gameIndex + 1}/{gameIds.length}
            </span>
            <span className="font-medium">
              {plugin?.nameEn ?? plugin?.name}
            </span>
          </div>
          <div className="flex gap-1">
            {gameIds.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < gameIndex
                    ? "bg-primary w-6"
                    : i === gameIndex
                      ? "bg-primary/50 w-6"
                      : "bg-muted w-4"
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
