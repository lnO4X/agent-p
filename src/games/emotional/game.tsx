"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";

/**
 * Stroop Task — Classic cognitive interference paradigm (Stroop, 1935)
 *
 * Show a color word printed in a mismatched ink color.
 * Player must identify the INK COLOR, not the word meaning.
 * Stroop effect = mean RT(incongruent) - mean RT(congruent)
 */

const COLORS = [
  { name: "红", nameEn: "RED", hex: "#ef4444", key: "r" },
  { name: "蓝", nameEn: "BLUE", hex: "#3b82f6", key: "b" },
  { name: "绿", nameEn: "GREEN", hex: "#22c55e", key: "g" },
  { name: "黄", nameEn: "YELLOW", hex: "#eab308", key: "y" },
] as const;

const TOTAL_TRIALS = 40;
const CONGRUENT_RATIO = 0.5;

interface Trial {
  wordIndex: number;
  inkIndex: number;
  congruent: boolean;
}

function generateTrials(): Trial[] {
  const trials: Trial[] = [];
  const congruentCount = Math.round(TOTAL_TRIALS * CONGRUENT_RATIO);

  for (let i = 0; i < congruentCount; i++) {
    const idx = Math.floor(Math.random() * COLORS.length);
    trials.push({ wordIndex: idx, inkIndex: idx, congruent: true });
  }

  for (let i = 0; i < TOTAL_TRIALS - congruentCount; i++) {
    const wordIdx = Math.floor(Math.random() * COLORS.length);
    let inkIdx = Math.floor(Math.random() * (COLORS.length - 1));
    if (inkIdx >= wordIdx) inkIdx++;
    trials.push({ wordIndex: wordIdx, inkIndex: inkIdx, congruent: false });
  }

  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }
  return trials;
}

export default function StroopGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<"idle" | "fixation" | "stimulus" | "feedback" | "done">("idle");
  const [trialIndex, setTrialIndex] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const trialsRef = useRef<Trial[]>([]);
  const trialStartRef = useRef(0);
  const startTimeRef = useRef(0);
  const congruentRTs = useRef<number[]>([]);
  const incongruentRTs = useRef<number[]>([]);
  const correctCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null!);

  const currentTrial = trialsRef.current[trialIndex];

  const showNextTrial = useCallback(() => {
    setPhase("fixation");
    timerRef.current = setTimeout(() => {
      trialStartRef.current = performance.now();
      setPhase("stimulus");
    }, 500 + Math.random() * 500);
  }, []);

  const startGame = useCallback(() => {
    trialsRef.current = generateTrials();
    startTimeRef.current = Date.now();
    congruentRTs.current = [];
    incongruentRTs.current = [];
    correctCount.current = 0;
    setTrialIndex(0);
    showNextTrial();
  }, [showNextTrial]);

  const handleResponse = useCallback(
    (selectedInkIndex: number) => {
      if (phase !== "stimulus" || !currentTrial) return;

      const rt = performance.now() - trialStartRef.current;
      const isCorrect = selectedInkIndex === currentTrial.inkIndex;

      if (isCorrect) {
        correctCount.current++;
        if (currentTrial.congruent) {
          congruentRTs.current.push(rt);
        } else {
          incongruentRTs.current.push(rt);
        }
      }

      setLastCorrect(isCorrect);
      setPhase("feedback");

      timerRef.current = setTimeout(() => {
        const next = trialIndex + 1;
        if (next >= TOTAL_TRIALS) {
          const meanCong =
            congruentRTs.current.length > 0
              ? congruentRTs.current.reduce((a, b) => a + b, 0) / congruentRTs.current.length
              : 500;
          const meanIncong =
            incongruentRTs.current.length > 0
              ? incongruentRTs.current.reduce((a, b) => a + b, 0) / incongruentRTs.current.length
              : 700;
          const stroopEffect = meanIncong - meanCong;

          setPhase("done");
          onComplete({
            rawScore: stroopEffect,
            durationMs: Date.now() - startTimeRef.current,
            metadata: {
              stroopEffect: Math.round(stroopEffect),
              meanCongruent: Math.round(meanCong),
              meanIncongruent: Math.round(meanIncong),
              accuracy: correctCount.current / TOTAL_TRIALS,
              totalTrials: TOTAL_TRIALS,
            },
          });
        } else {
          setTrialIndex(next);
          showNextTrial();
        }
      }, 350);
    },
    [phase, currentTrial, trialIndex, onComplete, showNextTrial]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (phase !== "stimulus") return;
      const idx = COLORS.findIndex((c) => c.key === e.key.toLowerCase());
      if (idx !== -1) handleResponse(idx);
    },
    [phase, handleResponse]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">Stroop 色词测试</h3>
          <p className="text-sm text-muted-foreground">
            屏幕显示颜色词，文字颜色和词义可能不同。判断文字的<strong>颜色</strong>，忽略词义。
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {COLORS.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: c.hex }} />
                <span>{c.name} — 按 {c.key.toUpperCase()}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">共 {TOTAL_TRIALS} 题</p>
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
      </div>

      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${((trialIndex + 1) / TOTAL_TRIALS) * 100}%` }} />
      </div>

      <div className="w-full aspect-video flex items-center justify-center bg-slate-900 rounded-xl min-h-[200px]">
        {phase === "fixation" && <div className="text-4xl text-white/40">+</div>}
        {phase === "stimulus" && currentTrial && (
          <div className="text-5xl md:text-7xl font-black select-none" style={{ color: COLORS[currentTrial.inkIndex].hex }}>
            {COLORS[currentTrial.wordIndex].nameEn}
          </div>
        )}
        {phase === "feedback" && (
          <div className={`text-2xl font-bold ${lastCorrect ? "text-green-400" : "text-red-400"}`}>
            {lastCorrect ? "✓" : "✗"}
          </div>
        )}
      </div>

      {phase === "stimulus" && (
        <div className="grid grid-cols-4 gap-3 w-full">
          {COLORS.map((c, i) => (
            <button
              key={i}
              onClick={() => handleResponse(i)}
              className="py-4 rounded-xl font-bold text-white text-sm hover:opacity-80 active:scale-95 transition"
              style={{ backgroundColor: c.hex }}
            >
              {c.key.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">选择文字的<strong>颜色</strong>，不是词义</p>

      <button onClick={onAbort} className="text-sm text-muted-foreground hover:text-foreground">
        放弃测试
      </button>
    </div>
  );
}
