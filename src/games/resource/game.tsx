"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import type { GameComponentProps } from "@/types/game";

/**
 * UFOV — Useful Field of View (Ball et al. 1988)
 *
 * Central fixation + peripheral target. Identify where the target appeared.
 * Stimulus duration decreases with staircase: correct → shorter, wrong → longer.
 *
 * Measures visual attention breadth and processing speed.
 */

const PRACTICE_TRIALS = 3;
const SCORED_TRIALS = 30;
const TOTAL_TRIALS = PRACTICE_TRIALS + SCORED_TRIALS;
const PRACTICE_DURATION_MS = 300; // Fixed easy duration for practice (not staircase)
const POSITIONS = 8; // 8 peripheral positions (like clock positions)
const INITIAL_DURATION_MS = 300;
const MIN_DURATION_MS = 30;
const MAX_DURATION_MS = 500;
const STAIRCASE_STEP = 0.7; // multiply/divide factor
const MASK_MS = 200;
const RADIUS_PX = 120; // peripheral target distance from center
const PRACTICE_DONE_MS = 1000;

function getPositionCoords(index: number): { x: number; y: number } {
  const angle = (index / POSITIONS) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(angle) * RADIUS_PX,
    y: Math.sin(angle) * RADIUS_PX,
  };
}

export default function UFOVGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [phase, setPhase] = useState<"idle" | "fixation" | "stimulus" | "mask" | "respond" | "feedback" | "practice-done" | "done">("idle");
  const [trialIndex, setTrialIndex] = useState(0);
  const [targetPos, setTargetPos] = useState(0);
  const [showTarget, setShowTarget] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [currentDuration, setCurrentDuration] = useState(INITIAL_DURATION_MS);

  const startTimeRef = useRef(0);
  const durationRef = useRef(INITIAL_DURATION_MS);
  const correctCount = useRef(0);
  const thresholds = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null!);

  const showNextTrial = useCallback((trialNum: number) => {
    const pos = Math.floor(Math.random() * POSITIONS);
    setTargetPos(pos);
    setShowTarget(false);
    setPhase("fixation");

    // Use fixed easy duration during practice, staircase-controlled duration after
    const isPractice = trialNum < PRACTICE_TRIALS;
    const duration = isPractice ? PRACTICE_DURATION_MS : durationRef.current;

    timerRef.current = setTimeout(() => {
      setShowTarget(true);
      setPhase("stimulus");

      timerRef.current = setTimeout(() => {
        setShowTarget(false);
        setPhase("mask");

        timerRef.current = setTimeout(() => {
          setPhase("respond");
        }, MASK_MS);
      }, duration);
    }, 600 + Math.random() * 400);
  }, []);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    durationRef.current = INITIAL_DURATION_MS;
    setCurrentDuration(INITIAL_DURATION_MS);
    correctCount.current = 0;
    thresholds.current = [];
    setTrialIndex(0);
    showNextTrial(0);
  }, [showNextTrial]);

  const handleResponse = useCallback(
    (selectedPos: number) => {
      if (phase !== "respond") return;

      const isCorrect = selectedPos === targetPos;
      const isPractice = trialIndex < PRACTICE_TRIALS;
      setLastCorrect(isCorrect);

      if (!isPractice) {
        if (isCorrect) {
          correctCount.current++;
          // Staircase: make harder (shorter duration)
          durationRef.current = Math.max(MIN_DURATION_MS, durationRef.current * STAIRCASE_STEP);
        } else {
          // Staircase: make easier (longer duration)
          durationRef.current = Math.min(MAX_DURATION_MS, durationRef.current / STAIRCASE_STEP);
        }
        thresholds.current.push(durationRef.current);
        setCurrentDuration(Math.round(durationRef.current));
      }
      setPhase("feedback");

      timerRef.current = setTimeout(() => {
        const next = trialIndex + 1;
        if (next >= TOTAL_TRIALS) {
          // Average the last 10 thresholds as the estimated threshold
          const last10 = thresholds.current.slice(-10);
          const avgThreshold = last10.reduce((a, b) => a + b, 0) / last10.length;

          setPhase("done");
          onComplete({
            rawScore: avgThreshold,
            durationMs: Date.now() - startTimeRef.current,
            metadata: {
              threshold: Math.round(avgThreshold),
              accuracy: correctCount.current / SCORED_TRIALS,
              totalTrials: SCORED_TRIALS,
              practiceTrials: PRACTICE_TRIALS,
              thresholdHistory: thresholds.current.map(Math.round),
            },
          });
        } else if (next === PRACTICE_TRIALS) {
          // Transition from practice to scored phase
          setPhase("practice-done");
          timerRef.current = setTimeout(() => {
            setTrialIndex(next);
            showNextTrial(next);
          }, PRACTICE_DONE_MS);
        } else {
          setTrialIndex(next);
          showNextTrial(next);
        }
      }, 400);
    },
    [phase, targetPos, trialIndex, onComplete, showNextTrial]
  );

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">{isZh ? "UFOV 视野测试" : "UFOV Visual Field Test"}</h3>
          <p className="text-sm text-muted-foreground">
            {isZh
              ? "注视中心十字。目标会在周围8个位置之一短暂闪现。目标消失后，点击你认为它出现的位置。"
              : "Focus on the center cross. A target will briefly flash at one of 8 positions. After it disappears, click where you think it appeared."}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {isZh
              ? "答对→显示时间缩短(更难) | 答错→显示时间加长"
              : "Correct \u2192 shorter display (harder) | Wrong \u2192 longer display"}
          </p>
          <p className="text-xs text-muted-foreground">{isZh ? `共 ${TOTAL_TRIALS} 题` : `${TOTAL_TRIALS} trials`}</p>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 transition"
        >
          {isZh ? "开始测试" : "Start Test"}
        </button>
        <button onClick={onAbort} className="text-sm text-muted-foreground hover:text-foreground">
          {isZh ? "放弃测试" : "Abort Test"}
        </button>
      </div>
    );
  }

  const isPractice = trialIndex < PRACTICE_TRIALS;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <div className="flex justify-between w-full text-sm text-muted-foreground px-2">
        <span>
          {isPractice
            ? isZh ? `练习 ${trialIndex + 1}/${PRACTICE_TRIALS}` : `Practice ${trialIndex + 1}/${PRACTICE_TRIALS}`
            : isZh ? `第 ${trialIndex + 1 - PRACTICE_TRIALS}/${SCORED_TRIALS} 题` : `Trial ${trialIndex + 1 - PRACTICE_TRIALS}/${SCORED_TRIALS}`}
        </span>
        {isPractice ? (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-md text-xs">
            {isZh ? "练习 — 不计分" : "Practice — not scored"}
          </span>
        ) : (
          <>
            <span>{isZh ? "正确" : "Correct"}: {correctCount.current}</span>
            <span>{isZh ? "显示" : "Display"}: {currentDuration}ms</span>
          </>
        )}
      </div>

      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${((trialIndex + 1) / TOTAL_TRIALS) * 100}%` }} />
      </div>

      {/* Game field */}
      <div className="relative w-[300px] h-[300px] mx-auto">
        {/* Center fixation */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-white/60 select-none">
          {phase === "mask" ? "###" : "+"}
        </div>

        {/* Peripheral positions */}
        {Array.from({ length: POSITIONS }, (_, i) => {
          const { x, y } = getPositionCoords(i);
          const isTarget = i === targetPos;
          const showingTarget = showTarget && isTarget && phase === "stimulus";
          const isResponding = phase === "respond";

          return (
            <button
              key={i}
              onClick={() => handleResponse(i)}
              disabled={!isResponding}
              className={`absolute w-10 h-10 rounded-full border-2 transition-all -translate-x-1/2 -translate-y-1/2 ${
                showingTarget
                  ? "bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-400/50"
                  : isResponding
                    ? "bg-slate-700/50 border-slate-500 hover:bg-slate-600 cursor-pointer"
                    : phase === "feedback" && i === targetPos
                      ? "bg-yellow-400/30 border-yellow-400"
                      : "bg-slate-800/30 border-slate-700/50"
              }`}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
            >
              {isResponding && (
                <span className="text-xs text-muted-foreground">{i + 1}</span>
              )}
            </button>
          );
        })}

        {/* Feedback overlay */}
        {phase === "feedback" && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className={`text-xl font-bold ${lastCorrect ? "text-green-400" : "text-red-400"}`}>
              {lastCorrect ? "✓" : "✗"}
            </span>
          </div>
        )}
        {phase === "practice-done" && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="text-xl font-bold text-primary animate-pulse whitespace-nowrap">
              {isZh ? "开始计分..." : "Now scoring..."}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {phase === "respond"
          ? (isZh ? "点击目标出现的位置" : "Click where the target appeared")
          : (isZh ? "注视中心" : "Focus on center")}
      </p>

      <button onClick={onAbort} className="text-sm text-muted-foreground hover:text-foreground">
        {isZh ? "放弃测试" : "Abort Test"}
      </button>
    </div>
  );
}
