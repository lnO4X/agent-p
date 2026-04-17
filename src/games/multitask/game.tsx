"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";

/**
 * Dual-Task — Attention allocation paradigm (Pashler 1994)
 *
 * Task A: Visual tracking — follow a moving dot, click when it turns red.
 * Task B: Auditory classification — classify a number as odd/even.
 *
 * Both tasks run simultaneously. Measures dual-task cost.
 */

const TOTAL_TRIALS = 24;
const SINGLE_TRIALS = 8; // first 8 single-task, then 16 dual
const TRIAL_DURATION_MS = 3000;

type TaskPhase = "idle" | "single-visual" | "single-classify" | "dual" | "response" | "feedback" | "done";

interface TrialResult {
  type: "single-visual" | "single-classify" | "dual";
  visualCorrect: boolean | null;
  classifyCorrect: boolean | null;
  visualRT: number | null;
}

function randomNumber(): { value: number; isOdd: boolean } {
  const v = Math.floor(Math.random() * 9) + 1; // 1-9
  return { value: v, isOdd: v % 2 === 1 };
}

export default function DualTaskGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [phase, setPhase] = useState<TaskPhase>("idle");
  const [trialIndex, setTrialIndex] = useState(0);
  const [dotX, setDotX] = useState(50);
  const [dotY, setDotY] = useState(50);
  const [dotIsRed, setDotIsRed] = useState(false);
  const [classifyNum, setClassifyNum] = useState({ value: 5, isOdd: true });
  const [showClassify, setShowClassify] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackOk, setFeedbackOk] = useState(true);

  const startTimeRef = useRef(0);
  const trialStartRef = useRef(0);
  const dotTurnRedRef = useRef(0);
  const visualRespondedRef = useRef(false);
  const classifyRespondedRef = useRef(false);
  const resultsRef = useRef<TrialResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const animRef = useRef<ReturnType<typeof setInterval>>(null!);
  const dotXRef = useRef(50);
  const dotYRef = useRef(50);
  const dotVxRef = useRef(2);
  const dotVyRef = useRef(1.5);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    pendingTimers.current.push(id);
    return id;
  }, []);

  const getTrialType = (idx: number): "single-visual" | "single-classify" | "dual" => {
    if (idx < 4) return "single-visual";
    if (idx < SINGLE_TRIALS) return "single-classify";
    return "dual";
  };

  const startDotMovement = useCallback(() => {
    dotXRef.current = 50;
    dotYRef.current = 50;
    dotVxRef.current = (Math.random() - 0.5) * 4;
    dotVyRef.current = (Math.random() - 0.5) * 4;
    setDotX(50);
    setDotY(50);
    setDotIsRed(false);

    animRef.current = setInterval(() => {
      dotXRef.current += dotVxRef.current;
      dotYRef.current += dotVyRef.current;
      if (dotXRef.current < 10 || dotXRef.current > 90) dotVxRef.current *= -1;
      if (dotYRef.current < 10 || dotYRef.current > 90) dotVyRef.current *= -1;
      dotXRef.current = Math.max(5, Math.min(95, dotXRef.current));
      dotYRef.current = Math.max(5, Math.min(95, dotYRef.current));
      setDotX(dotXRef.current);
      setDotY(dotYRef.current);
    }, 33);
  }, []);

  const runTrial = useCallback(
    (idx: number) => {
      const type = getTrialType(idx);
      setTrialIndex(idx);
      trialStartRef.current = performance.now();
      visualRespondedRef.current = false;
      classifyRespondedRef.current = false;

      const hasVisual = type === "single-visual" || type === "dual";
      const hasClassify = type === "single-classify" || type === "dual";

      if (hasVisual) {
        startDotMovement();
        // Dot turns red at random time
        const redDelay = 800 + Math.random() * 1500;
        timerRef.current = setTimeout(() => {
          setDotIsRed(true);
          dotTurnRedRef.current = performance.now();
        }, redDelay);
      }

      if (hasClassify) {
        const delay = hasVisual ? 500 + Math.random() * 1000 : 300;
        scheduleTimer(() => {
          setClassifyNum(randomNumber());
          setShowClassify(true);
        }, delay);
      }

      setPhase(type);

      // Auto-end trial after duration
      scheduleTimer(() => {
        clearInterval(animRef.current);

        const result: TrialResult = {
          type,
          visualCorrect: hasVisual ? visualRespondedRef.current : null,
          classifyCorrect: hasClassify ? classifyRespondedRef.current : null,
          visualRT: null,
        };
        resultsRef.current.push(result);

        setShowClassify(false);
        setDotIsRed(false);

        if (!visualRespondedRef.current && hasVisual) {
          setFeedbackText(isZh ? "未点击红点" : "Missed red dot");
          setFeedbackOk(false);
        } else if (!classifyRespondedRef.current && hasClassify) {
          setFeedbackText(isZh ? "未分类数字" : "Missed number");
          setFeedbackOk(false);
        } else {
          setFeedbackText("✓");
          setFeedbackOk(true);
        }
        setPhase("feedback");

        scheduleTimer(() => {
          const next = idx + 1;
          if (next >= TOTAL_TRIALS) {
            finishGame();
          } else {
            runTrial(next);
          }
        }, 500);
      }, TRIAL_DURATION_MS);
    },
    [startDotMovement, isZh]
  );

  const finishGame = useCallback(() => {
    setPhase("done");
    const results = resultsRef.current;

    const singleVisual = results.filter((r) => r.type === "single-visual");
    const singleClassify = results.filter((r) => r.type === "single-classify");
    const dual = results.filter((r) => r.type === "dual");

    const singleVisualAcc = singleVisual.length > 0
      ? singleVisual.filter((r) => r.visualCorrect).length / singleVisual.length
      : 0;
    const singleClassifyAcc = singleClassify.length > 0
      ? singleClassify.filter((r) => r.classifyCorrect).length / singleClassify.length
      : 0;
    const dualVisualAcc = dual.length > 0
      ? dual.filter((r) => r.visualCorrect).length / dual.length
      : 0;
    const dualClassifyAcc = dual.length > 0
      ? dual.filter((r) => r.classifyCorrect).length / dual.length
      : 0;

    // Dual-task cost = drop in accuracy from single to dual
    const visualCost = Math.max(0, singleVisualAcc - dualVisualAcc);
    const classifyCost = Math.max(0, singleClassifyAcc - dualClassifyAcc);
    const avgDualAcc = (dualVisualAcc + dualClassifyAcc) / 2;

    // Higher dual accuracy = better multitasking
    const rawScore = avgDualAcc * 100;

    onComplete({
      rawScore,
      durationMs: Date.now() - startTimeRef.current,
      metadata: {
        singleVisualAcc: Math.round(singleVisualAcc * 100),
        singleClassifyAcc: Math.round(singleClassifyAcc * 100),
        dualVisualAcc: Math.round(dualVisualAcc * 100),
        dualClassifyAcc: Math.round(dualClassifyAcc * 100),
        visualCost: Math.round(visualCost * 100),
        classifyCost: Math.round(classifyCost * 100),
        totalTrials: TOTAL_TRIALS,
      },
    });
  }, [onComplete]);

  const handleDotClick = useCallback(() => {
    if (dotIsRed && !visualRespondedRef.current) {
      visualRespondedRef.current = true;
      setDotIsRed(false);
    }
  }, [dotIsRed]);

  const handleClassify = useCallback(
    (isOdd: boolean) => {
      if (!showClassify || classifyRespondedRef.current) return;
      classifyRespondedRef.current = isOdd === classifyNum.isOdd;
      setShowClassify(false);
    },
    [showClassify, classifyNum]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleDotClick();
      } else if (e.key === "o" || e.key === "O") {
        handleClassify(true);
      } else if (e.key === "e" || e.key === "E") {
        handleClassify(false);
      }
    },
    [handleDotClick, handleClassify]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(animRef.current);
      pendingTimers.current.forEach(clearTimeout);
    };
  }, []);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    resultsRef.current = [];
    runTrial(0);
  }, [runTrial]);

  const trialType = getTrialType(trialIndex);
  const hasVisual = trialType === "single-visual" || trialType === "dual";
  const hasClassify = trialType === "single-classify" || trialType === "dual";

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">{isZh ? "双任务 注意力分配测试" : "Dual-Task Attention Test"}</h3>
          <p className="text-sm text-muted-foreground">
            <strong>{isZh ? "视觉任务" : "Visual task"}</strong>: {isZh ? "追踪移动的圆点，变红时点击/按空格" : "Track the moving dot, click/press space when it turns red"}<br />
            <strong>{isZh ? "分类任务" : "Classification task"}</strong>: {isZh ? "数字出现时，奇数按 O，偶数按 E" : "When a number appears, press O for odd, E for even"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {isZh ? `先单独练习，再同时进行两个任务。共 ${TOTAL_TRIALS} 轮` : `Practice each task alone first, then do both together. ${TOTAL_TRIALS} trials total`}
          </p>
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

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
      <div className="flex justify-between w-full text-sm text-muted-foreground px-2">
        <span>{isZh ? "第" : "Trial"} {trialIndex + 1}/{TOTAL_TRIALS} {isZh ? "轮" : ""}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${
          trialType === "dual" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
        }`}>
          {trialType === "single-visual" ? (isZh ? "单: 视觉" : "Single: Visual") : trialType === "single-classify" ? (isZh ? "单: 分类" : "Single: Classify") : (isZh ? "双任务" : "Dual-Task")}
        </span>
      </div>

      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${((trialIndex + 1) / TOTAL_TRIALS) * 100}%` }} />
      </div>

      {/* Visual tracking area */}
      {hasVisual && phase !== "feedback" && (
        <div
          onClick={handleDotClick}
          className="relative w-full aspect-square max-w-[280px] bg-slate-900 rounded-xl cursor-pointer overflow-hidden"
        >
          <div
            className={`absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2 transition-colors ${
              dotIsRed
                ? "bg-red-500 shadow-lg shadow-red-500/50 animate-pulse"
                : "bg-blue-400 shadow-lg shadow-blue-400/30"
            }`}
            style={{ left: `${dotX}%`, top: `${dotY}%` }}
          />
          {dotIsRed && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-red-400 font-bold animate-pulse">
              {isZh ? "点击!" : "Click!"}
            </div>
          )}
        </div>
      )}

      {/* Classification area */}
      {hasClassify && phase !== "feedback" && (
        <div className="w-full max-w-[280px] space-y-3">
          {showClassify ? (
            <>
              <div className="text-center text-5xl font-bold font-mono text-foreground py-4 bg-slate-800 rounded-xl">
                {classifyNum.value}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleClassify(true)}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition"
                >
                  {isZh ? "O 奇数" : "O Odd"}
                </button>
                <button
                  onClick={() => handleClassify(false)}
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition"
                >
                  {isZh ? "E 偶数" : "E Even"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              {isZh ? "等待数字出现..." : "Waiting for number..."}
            </div>
          )}
        </div>
      )}

      {phase === "feedback" && (
        <div className={`text-xl font-bold py-8 ${feedbackOk ? "text-green-400" : "text-red-400"}`}>
          {feedbackText}
        </div>
      )}

      <button onClick={onAbort} className="text-sm text-muted-foreground hover:text-foreground mt-1">
        {isZh ? "放弃测试" : "Abort Test"}
      </button>
    </div>
  );
}
