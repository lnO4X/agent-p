"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";

/**
 * UFOV — Useful Field of View (Ball et al. 1988)
 *
 * Central fixation + peripheral target. Identify where the target appeared.
 * Stimulus duration decreases with staircase: correct → shorter, wrong → longer.
 *
 * Measures visual attention breadth and processing speed.
 */

const TOTAL_TRIALS = 30;
const POSITIONS = 8; // 8 peripheral positions (like clock positions)
const INITIAL_DURATION_MS = 300;
const MIN_DURATION_MS = 30;
const MAX_DURATION_MS = 500;
const STAIRCASE_STEP = 0.7; // multiply/divide factor
const MASK_MS = 200;
const RADIUS_PX = 120; // peripheral target distance from center

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
  const [phase, setPhase] = useState<"idle" | "fixation" | "stimulus" | "mask" | "respond" | "feedback" | "done">("idle");
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

  const showNextTrial = useCallback(() => {
    const pos = Math.floor(Math.random() * POSITIONS);
    setTargetPos(pos);
    setShowTarget(false);
    setPhase("fixation");

    timerRef.current = setTimeout(() => {
      setShowTarget(true);
      setPhase("stimulus");

      timerRef.current = setTimeout(() => {
        setShowTarget(false);
        setPhase("mask");

        timerRef.current = setTimeout(() => {
          setPhase("respond");
        }, MASK_MS);
      }, durationRef.current);
    }, 600 + Math.random() * 400);
  }, []);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    durationRef.current = INITIAL_DURATION_MS;
    setCurrentDuration(INITIAL_DURATION_MS);
    correctCount.current = 0;
    thresholds.current = [];
    setTrialIndex(0);
    showNextTrial();
  }, [showNextTrial]);

  const handleResponse = useCallback(
    (selectedPos: number) => {
      if (phase !== "respond") return;

      const isCorrect = selectedPos === targetPos;
      setLastCorrect(isCorrect);

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
              accuracy: correctCount.current / TOTAL_TRIALS,
              totalTrials: TOTAL_TRIALS,
              thresholdHistory: thresholds.current.map(Math.round),
            },
          });
        } else {
          setTrialIndex(next);
          showNextTrial();
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
          <h3 className="text-lg font-bold">UFOV 视野测试</h3>
          <p className="text-sm text-muted-foreground">
            注视中心十字。目标会在周围8个位置之一短暂闪现。
            目标消失后，点击你认为它出现的位置。
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            答对→显示时间缩短(更难) | 答错→显示时间加长
          </p>
          <p className="text-xs text-muted-foreground">共 {TOTAL_TRIALS} 题</p>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 transition"
        >
          开始测试
        </button>
        <button onClick={onAbort} className="text-sm text-muted-foreground hover:text-foreground">
          放弃测试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <div className="flex justify-between w-full text-sm text-muted-foreground px-2">
        <span>第 {trialIndex + 1}/{TOTAL_TRIALS} 题</span>
        <span>正确: {correctCount.current}</span>
        <span>显示: {currentDuration}ms</span>
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
      </div>

      <p className="text-xs text-muted-foreground">
        {phase === "respond" ? "点击目标出现的位置" : "注视中心"}
      </p>

      <button onClick={onAbort} className="text-sm text-muted-foreground hover:text-foreground">
        放弃测试
      </button>
    </div>
  );
}
