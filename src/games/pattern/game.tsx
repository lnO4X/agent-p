"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";
import { playSound } from "@/lib/audio-fx";
import {
  ComboCounter,
  ParticleBurst,
  useScreenShake,
} from "@/components/game-fx";

/**
 * "Find the Odd One" — color-discrimination Quick-tier entry-funnel game.
 *
 * Design:
 * - 4x4 grid (16 tiles). One tile's lightness differs from the others.
 * - 15 rounds, no practice phase (self-explanatory mechanic).
 * - Each round samples a random base HSL; the odd tile differs by `delta` in L.
 * - Difficulty ramp: delta starts at ~22 and decreases by ~1.3 per round (min 3).
 * - Correct click -> success sound, particle burst, combo increment, next round.
 * - Wrong click -> error sound, screen shake, combo reset, reveal + next round.
 * - Block-end celebration: big particle burst + success chime on completion.
 *
 * Measures: a light proxy for pattern/visual-feature discrimination
 * (pattern_recog). Tier A polish is safe here because this is an accuracy game
 * without precision-RT requirements — feedback audio/visual is purely additive.
 *
 * Note: a research-grade pattern_recog measure (Posner Cueing) lives in
 * src/games/posner/ and is included in the Pro tier.
 */

type Phase = "round" | "feedback" | "practice-done" | "done";

const PRACTICE_ROUNDS = 2;
const SCORED_ROUNDS = 15;
const TOTAL_ROUNDS = PRACTICE_ROUNDS + SCORED_ROUNDS;
const GRID_SIZE = 16; // 4x4
const FEEDBACK_MS = 500;
const ROUND_TRANSITION_MS = 800;
const PRACTICE_DONE_MS = 1000;

// Difficulty: initial lightness delta and per-round shrink rate.
const DELTA_START = 22;
const DELTA_STEP = 1.3;
const DELTA_MIN = 3;

interface RoundSpec {
  /** 0..15, index of the odd-colored tile in the 4x4 grid. */
  oddIndex: number;
  /** Base hue (0..360). */
  hue: number;
  /** Base lightness (0..100). */
  baseLightness: number;
  /** Signed lightness delta applied to the odd tile. */
  delta: number;
  /** Base saturation (0..100). */
  saturation: number;
}

interface RoundResult {
  roundIndex: number;
  correct: boolean;
  rtMs: number;
  delta: number;
  clickedIndex: number | null;
}

function buildRound(roundIndex: number): RoundSpec {
  // Hue: sample a varied set, avoiding neon-pure primaries that hurt eyes.
  const hue = Math.floor(Math.random() * 360);
  // Base lightness in a mid-range zone (keeps contrast readable in dark theme).
  const baseLightness = 45 + Math.floor(Math.random() * 15); // 45..60
  const saturation = 55 + Math.floor(Math.random() * 25); // 55..80
  // Delta shrinks over rounds, then floors.
  const deltaMag = Math.max(
    DELTA_MIN,
    DELTA_START - roundIndex * DELTA_STEP
  );
  // Randomize direction (lighter or darker than base) for variety.
  const direction = Math.random() < 0.5 ? 1 : -1;
  const delta = deltaMag * direction;
  const oddIndex = Math.floor(Math.random() * GRID_SIZE);
  return { oddIndex, hue, baseLightness, delta, saturation };
}

function hsl(hue: number, saturation: number, lightness: number): string {
  const L = Math.max(0, Math.min(100, lightness));
  return `hsl(${hue}, ${saturation}%, ${L}%)`;
}

export default function PatternGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<Phase>("round");
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [roundSpec, setRoundSpec] = useState<RoundSpec>(() => buildRound(0));
  // Effects triggers
  const [correctBurstTrigger, setCorrectBurstTrigger] = useState(0);
  const [finalBurstTrigger, setFinalBurstTrigger] = useState(0);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number }>({
    x: 120,
    y: 120,
  });

  const { trigger: triggerShake, style: shakeStyle } = useScreenShake();

  // Refs
  const startTimeRef = useRef(Date.now());
  const roundStartRef = useRef(performance.now());
  const resultsRef = useRef<RoundResult[]>([]);
  const finishedRef = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const totalRounds = TOTAL_ROUNDS;

  const clearTimers = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const finishGame = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // Exclude practice rounds from scored results
    const results = resultsRef.current.slice(PRACTICE_ROUNDS);
    const correct = results.filter((r) => r.correct).length;
    const meanRt =
      results.length > 0
        ? results.reduce((s, r) => s + r.rtMs, 0) / results.length
        : 0;

    onComplete({
      rawScore: correct,
      durationMs: Date.now() - startTimeRef.current,
      metadata: {
        correctCount: correct,
        totalRounds: results.length,
        accuracy: results.length > 0 ? correct / results.length : 0,
        meanRt: Math.round(meanRt),
        results,
        practiceRounds: PRACTICE_ROUNDS,
      },
    });
  }, [onComplete]);

  const advanceRound = useCallback(() => {
    const next = resultsRef.current.length;
    // Show "Now scoring..." transition after practice phase ends
    if (next === PRACTICE_ROUNDS) {
      setPhase("practice-done");
      advanceTimerRef.current = setTimeout(() => {
        setRoundIndex(next);
        setRoundSpec(buildRound(next));
        setLastClickedIndex(null);
        setLastCorrect(null);
        setPhase("round");
        roundStartRef.current = performance.now();
      }, PRACTICE_DONE_MS);
      return;
    }
    if (next >= totalRounds) {
      setPhase("done");
      playSound("success");
      setFinalBurstTrigger((t) => t + 1);
      advanceTimerRef.current = setTimeout(() => {
        finishGame();
      }, 900);
      return;
    }
    setRoundIndex(next);
    setRoundSpec(buildRound(next));
    setLastClickedIndex(null);
    setLastCorrect(null);
    setPhase("round");
    roundStartRef.current = performance.now();
  }, [finishGame, totalRounds]);

  const handleTileClick = useCallback(
    (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
      if (phase !== "round") return;
      const rtMs = Math.round(performance.now() - roundStartRef.current);
      const correct = index === roundSpec.oddIndex;

      // Capture click position (relative to game container) for particle burst.
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setBurstPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }

      setLastClickedIndex(index);
      setLastCorrect(correct);
      setPhase("feedback");

      resultsRef.current = [
        ...resultsRef.current,
        {
          roundIndex: roundSpec ? resultsRef.current.length : 0,
          correct,
          rtMs,
          delta: roundSpec.delta,
          clickedIndex: index,
        },
      ];

      const isPracticeRound = roundIndex < PRACTICE_ROUNDS;
      if (correct) {
        if (!isPracticeRound) setCorrectCount((c) => c + 1);
        setStreak((s) => s + 1);
        playSound("success");
        setCorrectBurstTrigger((t) => t + 1);
      } else {
        setStreak(0);
        playSound("error");
        triggerShake();
      }

      advanceTimerRef.current = setTimeout(() => {
        advanceRound();
      }, correct ? ROUND_TRANSITION_MS : FEEDBACK_MS + 300);
    },
    [advanceRound, phase, roundIndex, roundSpec, triggerShake]
  );

  // Precompute tile colors for this round
  const tileColors = useMemo(() => {
    const colors: string[] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      const L =
        i === roundSpec.oddIndex
          ? roundSpec.baseLightness + roundSpec.delta
          : roundSpec.baseLightness;
      colors.push(hsl(roundSpec.hue, roundSpec.saturation, L));
    }
    return colors;
  }, [roundSpec]);

  const progress = Math.min(1, resultsRef.current.length / totalRounds);
  const isPractice = roundIndex < PRACTICE_ROUNDS;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Header: round + correct count */}
      <div className="flex justify-between w-full max-w-lg text-sm text-muted-foreground px-2">
        <span>
          {isPractice
            ? isZh
              ? `\u7EC3\u4E60 ${roundIndex + 1}/${PRACTICE_ROUNDS}`
              : `Practice ${roundIndex + 1}/${PRACTICE_ROUNDS}`
            : isZh
              ? `\u7B2C ${Math.min(roundIndex + 1 - PRACTICE_ROUNDS, SCORED_ROUNDS)}/${SCORED_ROUNDS} \u8F6E`
              : `Round ${Math.min(roundIndex + 1 - PRACTICE_ROUNDS, SCORED_ROUNDS)}/${SCORED_ROUNDS}`}
        </span>
        {isPractice && (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-md text-xs">
            {isZh ? "\u7EC3\u4E60 \u2014 \u4E0D\u8BA1\u5206" : "Practice \u2014 not scored"}
          </span>
        )}
        {!isPractice && (
          <span>
            {isZh ? "\u6B63\u786E" : "Correct"}: {correctCount}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Game area */}
      <div
        ref={containerRef}
        className="relative w-full max-w-lg aspect-square rounded-xl bg-slate-800 p-3 sm:p-4 select-none overflow-hidden"
        style={shakeStyle}
      >
        {/* Effects overlays */}
        <ComboCounter
          combo={streak}
          x={80}
          y={30}
          enabled={phase === "feedback" && streak >= 3}
        />
        <ParticleBurst
          trigger={correctBurstTrigger}
          x={burstPos.x}
          y={burstPos.y}
          color="#00D4AA"
          count={18}
          enabled={correctBurstTrigger > 0}
        />
        <ParticleBurst
          trigger={finalBurstTrigger}
          x={220}
          y={220}
          color="#FFB800"
          count={36}
          enabled={phase === "done" && finalBurstTrigger > 0}
        />

        {phase === "practice-done" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4 animate-pulse">
            <div className="text-xl font-bold mb-2 text-primary">
              {isZh ? "\u5F00\u59CB\u8BA1\u5206..." : "Now scoring..."}
            </div>
          </div>
        ) : phase === "done" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
            <div className="text-5xl mb-3">{"\uD83C\uDFAF"}</div>
            <div className="text-xl font-bold mb-2">
              {isZh ? "\u6D4B\u8BD5\u5B8C\u6210\uFF01" : "Test Complete!"}
            </div>
            <div className="text-sm text-muted-foreground">
              {isZh
                ? `\u6B63\u786E\uFF1A${correctCount} / ${SCORED_ROUNDS}`
                : `Correct: ${correctCount} / ${SCORED_ROUNDS}`}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full h-full">
            {tileColors.map((color, i) => {
              const isOdd = i === roundSpec.oddIndex;
              const isClicked = lastClickedIndex === i;
              // Only reveal correctness on feedback phase for the clicked tile
              // or the correct tile if the user was wrong.
              const showReveal = phase === "feedback";
              const highlightCorrect =
                showReveal && isOdd && lastCorrect === false;
              const highlightWrong =
                showReveal && isClicked && lastCorrect === false;
              return (
                <button
                  key={`${roundIndex}-${i}`}
                  onClick={(e) => handleTileClick(i, e)}
                  disabled={phase !== "round"}
                  aria-label={
                    isZh
                      ? `\u65B9\u5757 ${i + 1}`
                      : `Tile ${i + 1}`
                  }
                  className={`relative rounded-lg transition-transform ${
                    phase === "round"
                      ? "cursor-pointer hover:brightness-110 active:scale-95"
                      : "cursor-default"
                  } ${
                    highlightCorrect
                      ? "ring-4 ring-green-400 ring-offset-2 ring-offset-slate-800"
                      : ""
                  } ${
                    highlightWrong
                      ? "ring-4 ring-red-400 ring-offset-2 ring-offset-slate-800"
                      : ""
                  }`}
                  style={{ backgroundColor: color, aspectRatio: "1 / 1" }}
                />
              );
            })}
          </div>
        )}

        {/* Feedback label */}
        {phase === "feedback" && lastCorrect !== null && (
          <div
            className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-sm font-bold ${
              lastCorrect
                ? "bg-green-500/90 text-white"
                : "bg-red-500/90 text-white"
            }`}
          >
            {lastCorrect
              ? isZh
                ? "\u2713 \u627E\u5230\u4E86\uFF01"
                : "\u2713 Found it!"
              : isZh
                ? "\u2717 \u4E0D\u662F\u90A3\u4E2A"
                : "\u2717 Not that one"}
          </div>
        )}
      </div>

      {/* Instruction line */}
      {phase === "round" && (
        <p className="text-sm text-muted-foreground text-center px-4">
          {isZh
            ? "\u627E\u51FA\u989C\u8272\u7565\u5FAE\u4E0D\u540C\u7684\u65B9\u5757"
            : "Find the tile with a slightly different color"}
        </p>
      )}

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {isZh ? "\u653E\u5F03\u6D4B\u8BD5" : "Abort Test"}
      </button>
    </div>
  );
}
