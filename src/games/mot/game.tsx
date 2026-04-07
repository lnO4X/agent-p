"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";

type Phase =
  | "idle"
  | "highlight"
  | "tracking"
  | "select"
  | "feedback"
  | "done";

interface Circle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isTarget: boolean;
}

const TOTAL_CIRCLES = 8;
const CIRCLE_RADIUS = 24;
const TOTAL_TRIALS = 8;
const HIGHLIGHT_MS = 2000;
const TRACKING_MS = 5000;
const SPEED = 2; // px per frame at 60fps
const CANVAS_W = 400;
const CANVAS_H = 400;

// Difficulty schedule: how many targets per trial (1-indexed trial)
function targetsForTrial(trial: number): number {
  if (trial <= 3) return 3;
  if (trial <= 6) return 4;
  return 5;
}

function randomVelocity(): number {
  const v = SPEED * 0.7 + Math.random() * SPEED * 0.6;
  return Math.random() < 0.5 ? v : -v;
}

function initCircles(numTargets: number): Circle[] {
  const circles: Circle[] = [];
  for (let i = 0; i < TOTAL_CIRCLES; i++) {
    let x: number, y: number;
    let attempts = 0;
    // Avoid overlap
    do {
      x = CIRCLE_RADIUS + Math.random() * (CANVAS_W - CIRCLE_RADIUS * 2);
      y = CIRCLE_RADIUS + Math.random() * (CANVAS_H - CIRCLE_RADIUS * 2);
      attempts++;
    } while (
      attempts < 100 &&
      circles.some(
        (c) =>
          Math.hypot(c.x - x, c.y - y) < CIRCLE_RADIUS * 3
      )
    );
    circles.push({
      id: i,
      x,
      y,
      vx: randomVelocity(),
      vy: randomVelocity(),
      isTarget: i < numTargets,
    });
  }
  return circles;
}

function moveCircles(circles: readonly Circle[]): Circle[] {
  return circles.map((c) => {
    let nx = c.x + c.vx;
    let ny = c.y + c.vy;
    let nvx = c.vx;
    let nvy = c.vy;
    if (nx - CIRCLE_RADIUS < 0 || nx + CIRCLE_RADIUS > CANVAS_W) {
      nvx = -nvx;
      nx = Math.max(CIRCLE_RADIUS, Math.min(CANVAS_W - CIRCLE_RADIUS, nx));
    }
    if (ny - CIRCLE_RADIUS < 0 || ny + CIRCLE_RADIUS > CANVAS_H) {
      nvy = -nvy;
      ny = Math.max(CIRCLE_RADIUS, Math.min(CANVAS_H - CIRCLE_RADIUS, ny));
    }
    return { ...c, x: nx, y: ny, vx: nvx, vy: nvy };
  });
}

export default function MOTGame({ onComplete, onAbort }: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<Phase>("idle");
  const [trial, setTrial] = useState(0);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [trialResults, setTrialResults] = useState<number[]>([]);
  const [numTargets, setNumTargets] = useState(3);

  const animRef = useRef<number>(0);
  const circlesRef = useRef<Circle[]>([]);
  const phaseRef = useRef<Phase>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const startTimeRef = useRef(0);

  // Sync refs
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const animate = useCallback(() => {
    if (phaseRef.current !== "tracking") return;
    circlesRef.current = moveCircles(circlesRef.current);
    setCircles([...circlesRef.current]);
    animRef.current = requestAnimationFrame(animate);
  }, []);

  const startTrial = useCallback(
    (trialNum: number) => {
      const targets = targetsForTrial(trialNum);
      setNumTargets(targets);
      const newCircles = initCircles(targets);
      circlesRef.current = newCircles;
      setCircles(newCircles);
      setSelected(new Set());
      setPhase("highlight");

      // After HIGHLIGHT_MS, start tracking
      timerRef.current = setTimeout(() => {
        setPhase("tracking");
        animRef.current = requestAnimationFrame(animate);

        // After TRACKING_MS, stop and let player select
        timerRef.current = setTimeout(() => {
          cancelAnimationFrame(animRef.current);
          setPhase("select");
        }, TRACKING_MS);
      }, HIGHLIGHT_MS);
    },
    [animate]
  );

  const handleStart = useCallback(() => {
    startTimeRef.current = Date.now();
    setTrialResults([]);
    setTrial(1);
    startTrial(1);
  }, [startTrial]);

  const handleCircleClick = useCallback(
    (id: number) => {
      if (phase !== "select") return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else if (next.size < numTargets) {
          next.add(id);
        }
        return next;
      });
    },
    [phase, numTargets]
  );

  const handleConfirm = useCallback(() => {
    if (phase !== "select") return;
    // Score this trial
    const correctCount = circlesRef.current.filter(
      (c) => c.isTarget && selected.has(c.id)
    ).length;
    const accuracy = (correctCount / numTargets) * 100;
    const newResults = [...trialResults, accuracy];
    setTrialResults(newResults);
    setPhase("feedback");

    timerRef.current = setTimeout(() => {
      if (newResults.length >= TOTAL_TRIALS) {
        // All done
        const avgAccuracy =
          newResults.reduce((a, b) => a + b, 0) / newResults.length;
        setPhase("done");
        onComplete({
          rawScore: Math.round(avgAccuracy * 10) / 10,
          durationMs: Date.now() - startTimeRef.current,
          metadata: {
            trialResults: newResults,
            trials: TOTAL_TRIALS,
            avgAccuracy: Math.round(avgAccuracy * 10) / 10,
          },
        });
      } else {
        const nextTrial = trial + 1;
        setTrial(nextTrial);
        startTrial(nextTrial);
      }
    }, 1200);
  }, [
    phase,
    selected,
    numTargets,
    trialResults,
    trial,
    startTrial,
    onComplete,
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(timerRef.current);
    };
  }, []);

  const getCircleColor = (c: Circle): string => {
    if (phase === "highlight" && c.isTarget) {
      return "bg-red-500 border-red-400";
    }
    if (phase === "feedback") {
      if (c.isTarget && selected.has(c.id))
        return "bg-green-500 border-green-400";
      if (c.isTarget) return "bg-red-500/60 border-red-400/60";
      if (selected.has(c.id)) return "bg-orange-500 border-orange-400";
      return "bg-slate-500 border-slate-400";
    }
    if (phase === "select" && selected.has(c.id)) {
      return "bg-teal-500 border-teal-400";
    }
    return "bg-slate-500 border-slate-400";
  };

  // Idle screen
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">
            {isZh ? "多目标追踪" : "Multi-Object Tracking"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isZh
              ? "记住红色闪烁的目标圆球，它们开始移动后追踪它们"
              : "Remember the red-flashing target circles, then track them as they move"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isZh
              ? "移动停止后，点选你认为是目标的圆球"
              : "After movement stops, click the circles you think were targets"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isZh
              ? `共 ${TOTAL_TRIALS} 轮，难度递增`
              : `${TOTAL_TRIALS} trials, increasing difficulty`}
          </p>
        </div>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 transition"
        >
          {isZh ? "开始游戏" : "Start Game"}
        </button>
        <button
          onClick={onAbort}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {isZh ? "放弃测试" : "Abort Test"}
        </button>
      </div>
    );
  }

  const lastResult =
    trialResults.length > 0 ? trialResults[trialResults.length - 1] : null;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex justify-between w-full text-sm text-muted-foreground px-1">
        <span>
          {isZh ? `第 ${trial}/${TOTAL_TRIALS} 轮` : `Trial ${trial}/${TOTAL_TRIALS}`}
        </span>
        <span>
          {isZh ? `目标: ${numTargets} 个` : `Targets: ${numTargets}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((trial - 1) / TOTAL_TRIALS) * 100}%` }}
        />
      </div>

      {/* Phase instruction */}
      <div className="text-center text-sm font-medium">
        {phase === "highlight" && (
          <span className="text-red-400">
            {isZh ? "记住红色圆球!" : "Remember the red circles!"}
          </span>
        )}
        {phase === "tracking" && (
          <span className="text-yellow-400">
            {isZh ? "追踪目标..." : "Track the targets..."}
          </span>
        )}
        {phase === "select" && (
          <span className="text-teal-400">
            {isZh
              ? `点选 ${numTargets} 个目标圆球`
              : `Click ${numTargets} target circles`}
          </span>
        )}
        {phase === "feedback" && lastResult !== null && (
          <span
            className={lastResult >= 80 ? "text-green-400" : "text-orange-400"}
          >
            {lastResult === 100
              ? isZh
                ? "完美!"
                : "Perfect!"
              : isZh
                ? `正确率: ${Math.round(lastResult)}%`
                : `Accuracy: ${Math.round(lastResult)}%`}
          </span>
        )}
      </div>

      {/* Game area */}
      <div
        className="relative bg-slate-900 rounded-xl border border-slate-700 overflow-hidden touch-none"
        style={{ width: CANVAS_W, height: CANVAS_H }}
        onTouchStart={(e) => {
          if (phase !== "select") return;
          e.preventDefault();
          const touch = e.touches[0];
          const rect = e.currentTarget.getBoundingClientRect();
          const tx = touch.clientX - rect.left;
          const ty = touch.clientY - rect.top;
          for (const c of circles) {
            if (Math.hypot(c.x - tx, c.y - ty) <= CIRCLE_RADIUS) {
              handleCircleClick(c.id);
              return;
            }
          }
        }}
      >
        {circles.map((c) => (
          <div
            key={c.id}
            onClick={() => handleCircleClick(c.id)}
            onTouchStart={(e) => {
              e.preventDefault();
              handleCircleClick(c.id);
            }}
            className={`absolute rounded-full border-2 transition-colors duration-150 ${getCircleColor(c)} ${
              phase === "select" ? "cursor-pointer hover:scale-110" : ""
            }`}
            style={{
              width: CIRCLE_RADIUS * 2,
              height: CIRCLE_RADIUS * 2,
              left: c.x - CIRCLE_RADIUS,
              top: c.y - CIRCLE_RADIUS,
              transition:
                phase === "tracking"
                  ? "none"
                  : "background-color 150ms, border-color 150ms",
            }}
          />
        ))}
      </div>

      {/* Confirm button (only in select phase) */}
      {phase === "select" && (
        <button
          onClick={handleConfirm}
          disabled={selected.size !== numTargets}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition disabled:opacity-40"
        >
          {isZh
            ? `确认选择 (${selected.size}/${numTargets})`
            : `Confirm (${selected.size}/${numTargets})`}
        </button>
      )}

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {isZh ? "放弃测试" : "Abort Test"}
      </button>
    </div>
  );
}
