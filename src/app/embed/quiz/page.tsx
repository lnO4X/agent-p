"use client";

import { useState, useCallback, useMemo } from "react";
import { gameRegistry } from "@/games";
import { QUICK_TEST_GAMES } from "@/lib/archetype";
import { quickScoresToArchetype } from "@/lib/archetype";
import type { GameRawResult } from "@/types/game";
import { useI18n } from "@/i18n/context";
import { Zap, Brain, Dice5, ArrowRight, ExternalLink } from "lucide-react";

const BASE_URL = "https://gametan.ai";

const GAME_META = [
  { id: "reaction-speed", icon: Zap, labelZh: "反应速度", labelEn: "Reaction Speed", color: "#60a5fa" },
  { id: "pattern", icon: Brain, labelZh: "模式识别", labelEn: "Pattern Recognition", color: "#c084fc" },
  { id: "risk", icon: Dice5, labelZh: "风险决策", labelEn: "Risk & Decision", color: "#fbbf24" },
] as const;

type Phase = "cta" | "playing" | "transition" | "result";

export default function EmbedQuizPage() {
  const { locale, t } = useI18n();
  const isZh = locale === "zh";
  const [phase, setPhase] = useState<Phase>("cta");
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
        setPhase("result");
      }
    },
    [currentPlugin, scores, gameIndex]
  );

  const handleAbort = useCallback(() => {
    setPhase("cta");
    setGameIndex(0);
    setScores([]);
  }, []);

  const startNextGame = () => {
    setGameIndex((i) => i + 1);
    setPhase("playing");
  };

  // Compute archetype for result phase
  const archetype = useMemo(() => {
    if (scores.length < 3) return null;
    return quickScoresToArchetype(scores[0], scores[1], scores[2]);
  }, [scores]);

  // ─── CTA screen ───
  if (phase === "cta") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6 text-center">
        <div className="space-y-4 max-w-sm w-full">
          <div className="text-2xl font-bold">
            {t("embed.whatGamerAreYou")}
          </div>
          <p className="text-sm text-gray-400">
            {t("embed.threeGamesDiscover")}
          </p>

          <div className="space-y-2">
            {GAME_META.map((meta, i) => {
              const Icon = meta.icon;
              return (
                <div
                  key={meta.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"
                >
                  <Icon size={18} style={{ color: meta.color }} />
                  <span className="text-sm">
                    {isZh
                      ? `${i + 1}. ${meta.labelZh}`
                      : `${i + 1}. ${meta.labelEn}`}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setPhase("playing")}
            className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.97] transition-all font-semibold text-white flex items-center justify-center gap-2"
          >
            {t("embed.startQuiz")}
            <ArrowRight size={18} />
          </button>

          <div className="text-xs text-gray-500">
            Powered by{" "}
            <a
              href={`${BASE_URL}?ref=embed`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              GameTan
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Transition screen ───
  if (phase === "transition") {
    const nextMeta = GAME_META[gameIndex + 1];
    const NextIcon = nextMeta?.icon;
    const prevScore = scores[scores.length - 1];

    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6 text-center">
        <div className="space-y-6 max-w-sm w-full">
          <div className="text-3xl font-bold text-blue-400">
            {Math.round(prevScore)}
          </div>

          <div className="flex justify-center gap-2">
            {GAME_META.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-10 rounded-full ${
                  i <= gameIndex ? "bg-blue-500" : "bg-white/10"
                }`}
              />
            ))}
          </div>

          {nextMeta && NextIcon && (
            <div className="space-y-2">
              <div className="text-xs text-gray-400">
                {t("quiz.nextRound")}
              </div>
              <div className="flex items-center justify-center gap-2">
                <NextIcon size={20} style={{ color: nextMeta.color }} />
                <span className="font-semibold">
                  {isZh ? nextMeta.labelZh : nextMeta.labelEn}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={startNextGame}
            className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.97] transition-all font-semibold text-white flex items-center justify-center gap-2"
          >
            {t("quiz.continue")}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ─── Result screen ───
  if (phase === "result" && archetype) {
    const encoded = scores.map((s) => Math.round(s)).join("-");
    const fullResultUrl = `${BASE_URL}/quiz/result?s=${encoded}&ref=embed`;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6 text-center">
        <div className="space-y-5 max-w-sm w-full">
          <div className="text-4xl">{archetype.icon}</div>
          <div>
            <div className="text-xl font-bold">
              {isZh ? archetype.name : archetype.nameEn}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {isZh ? archetype.tagline : archetype.taglineEn}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            {scores.map((s, i) => (
              <div
                key={i}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm"
              >
                <span className="text-gray-400">
                  {isZh ? GAME_META[i].labelZh : GAME_META[i].labelEn}
                </span>
                <span className="ml-1.5 font-semibold">{Math.round(s)}</span>
              </div>
            ))}
          </div>

          <a
            href={fullResultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.97] transition-all font-semibold text-white flex items-center justify-center gap-2 no-underline"
          >
            {t("embed.viewFullResults")}
            <ExternalLink size={16} />
          </a>

          <button
            onClick={() => {
              setPhase("cta");
              setGameIndex(0);
              setScores([]);
            }}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {t("embed.retakeQuiz")}
          </button>

          <div className="text-xs text-gray-500">
            Powered by{" "}
            <a
              href={`${BASE_URL}?ref=embed`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              GameTan
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Playing state ───
  if (phase === "playing" && GameComponent) {
    const meta = GAME_META[gameIndex];
    const Icon = meta.icon;

    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-sm">
            <Icon size={16} style={{ color: meta.color }} />
            <span className="text-gray-300">
              {gameIndex + 1}/{QUICK_TEST_GAMES.length}
            </span>
          </div>
          <div className="flex gap-1.5">
            {GAME_META.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-6 rounded-full ${
                  i < gameIndex
                    ? "bg-blue-500"
                    : i === gameIndex
                      ? "bg-blue-500/50"
                      : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 p-3">
          <GameComponent onComplete={handleComplete} onAbort={handleAbort} />
        </div>
      </div>
    );
  }

  return null;
}
