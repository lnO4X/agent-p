"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent as track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import { gameRegistry } from "@/games";
import { QUICK_TEST_GAMES } from "@/lib/archetype";
import { getAllGameQuizIds, getGameQuiz } from "@/lib/game-quizzes";
import { SCENARIO_QUESTIONS, scenarioToArchetype } from "@/lib/scenario-quiz";
import {
  Zap,
  Brain,
  Dice5,
  ArrowRight,
  ClipboardList,
  Gamepad2,
  Sparkles,
} from "lucide-react";
import type { GameRawResult } from "@/types/game";
import Link from "next/link";

type Phase = "intro" | "scenario" | "playing" | "transition";

const GAME_META = [
  { id: "reaction-speed", icon: Zap, labelZh: "反应速度", labelEn: "Reaction Speed", color: "text-blue-400" },
  { id: "pattern", icon: Brain, labelZh: "模式识别", labelEn: "Pattern Recognition", color: "text-primary" },
  { id: "risk", icon: Dice5, labelZh: "风险决策", labelEn: "Risk & Decision", color: "text-amber-400" },
] as const;

export default function QuizPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<Phase>("intro");

  // ─── Scenario quiz state ───
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioAnswers, setScenarioAnswers] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // ─── Mini-game state ───
  const [gameIndex, setGameIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  const currentGameId = QUICK_TEST_GAMES[gameIndex];
  const currentPlugin = useMemo(
    () => gameRegistry.get(currentGameId),
    [currentGameId]
  );
  const GameComponent = currentPlugin?.component ?? null;

  // ─── Scenario quiz handlers ───
  const handleScenarioChoice = useCallback(
    (choiceId: string) => {
      if (selectedChoice) return; // prevent double-tap
      setSelectedChoice(choiceId);

      // Brief highlight, then advance
      setTimeout(() => {
        const newAnswers = [...scenarioAnswers, choiceId];

        if (scenarioIndex < SCENARIO_QUESTIONS.length - 1) {
          setScenarioAnswers(newAnswers);
          setScenarioIndex((i) => i + 1);
          setSelectedChoice(null);
        } else {
          // All 7 done — compute result
          const { archetype, talentScores } = scenarioToArchetype(newAnswers);
          const scoresParam = Object.entries(talentScores)
            .map(([k, v]) => `${k}:${v}`)
            .join(",");
          track("quiz_complete", { mode: "scenario", archetype: archetype.id });
          router.push(
            `/quiz/result?mode=scenario&archetype=${archetype.id}&scores=${scoresParam}&own=1`
          );
        }
      }, 300);
    },
    [selectedChoice, scenarioAnswers, scenarioIndex, router]
  );

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
              {isZh ? "你有职业选手的天赋吗？" : "Do You Have Pro-Level Talent?"}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              {isZh
                ? "3个小游戏，3分钟，对比职业选手"
                : "3 mini-games, 3 min, compare to pro players"}
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
            {isZh ? "测测你的天赋" : "Test Your Talent"}
            <ArrowRight size={20} className="ml-2" />
          </Button>

          {/* Secondary — Scenario Quiz */}
          <div className="text-sm text-muted-foreground">
            <button
              className="underline underline-offset-4 hover:text-foreground transition-colors"
              onClick={() => {
                track("quiz_start", { mode: "scenario" });
                setPhase("scenario");
              }}
            >
              {isZh
                ? "或试试场景测试（7道题）"
                : "Or try the Scenario Quiz (7 questions)"}
            </button>
          </div>

          {/* Tertiary — Questionnaire + Game-specific */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Link
              href="/quiz/questions"
              className="block"
              onClick={() => track("quiz_start", { mode: "questionnaire" })}
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 text-base pressable"
              >
                <ClipboardList size={18} className="mr-2" />
                {isZh
                  ? "精确问卷 (39题 · 5分钟)"
                  : "Full Questionnaire (39Q · 5min)"}
              </Button>
            </Link>

            {/* Game-specific quizzes */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <Gamepad2 size={16} />
                {isZh ? "游戏专属测试" : "Game-Specific Quizzes"}
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
                      <span>
                        {isZh ? quiz.gameName : quiz.gameNameEn}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {isZh
              ? "无需注册 · 结果即时生成 · 可分享"
              : "No registration · Instant results · Shareable"}
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // SCENARIO QUIZ — One question at a time
  // ═══════════════════════════════════════════════════
  if (phase === "scenario") {
    const question = SCENARIO_QUESTIONS[scenarioIndex];

    return (
      <div className="flex-1 flex flex-col">
        {/* Progress bar */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {scenarioIndex + 1} / {SCENARIO_QUESTIONS.length}
            </span>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setPhase("intro");
                setScenarioIndex(0);
                setScenarioAnswers([]);
                setSelectedChoice(null);
              }}
            >
              {isZh ? "退出" : "Exit"}
            </button>
          </div>
          <div className="flex gap-1.5">
            {SCENARIO_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i < scenarioIndex
                    ? "bg-primary"
                    : i === scenarioIndex
                      ? "bg-primary/50"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question + Choices */}
        <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Scenario text */}
              <h2 className="text-xl md:text-2xl font-semibold leading-snug">
                {isZh ? question.zh : question.en}
              </h2>

              {/* Choice cards */}
              <div className="space-y-3">
                {question.choices.map((choice) => {
                  const isSelected = selectedChoice === choice.id;
                  return (
                    <motion.div
                      key={choice.id}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Card
                        className={`p-4 cursor-pointer transition-all duration-200 border-2 ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-transparent hover:border-border hover:bg-muted/50"
                        }`}
                        onClick={() => handleScenarioChoice(choice.id)}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {choice.id}
                          </span>
                          <span className="text-sm md:text-base leading-relaxed">
                            {isZh ? choice.zh : choice.en}
                          </span>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
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
                {isZh ? "下一关" : "Next Round"}
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
            {isZh ? "继续" : "Continue"}
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
