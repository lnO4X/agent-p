"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";

type MoleType = "green" | "red" | null;

interface MoleState {
  type: MoleType;
  visible: boolean;
  id: number;
}

const GAME_DURATION = 30_000;
const GRID_SIZE = 9; // 3x3
const INITIAL_VISIBLE_MS = 1000;
const FINAL_VISIBLE_MS = 400;
const GREEN_RATIO = 0.65;

export default function EmotionalGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [moles, setMoles] = useState<MoleState[]>(
    Array.from({ length: GRID_SIZE }, (_, i) => ({
      type: null,
      visible: false,
      id: i,
    }))
  );
  const [score, setScore] = useState(0);
  const [lastHitFeedback, setLastHitFeedback] = useState<{
    index: number;
    type: "good" | "bad";
  } | null>(null);

  const startTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null!);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null!);
  const moleTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const hitsRef = useRef<Array<{ time: number; correct: boolean }>>([]);
  const appearedRef = useRef<Array<{ time: number; type: MoleType }>>([]);
  const molesRef = useRef<MoleState[]>([]);

  const getVisibleDuration = useCallback((elapsed: number) => {
    // Linearly interpolate from INITIAL to FINAL over game duration
    const progress = Math.min(1, elapsed / GAME_DURATION);
    return INITIAL_VISIBLE_MS - progress * (INITIAL_VISIBLE_MS - FINAL_VISIBLE_MS);
  }, []);

  const spawnMole = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed >= GAME_DURATION) return;

    // Find empty holes
    const emptyIndices = molesRef.current
      .map((m, i) => (!m.visible ? i : -1))
      .filter((i) => i >= 0);

    if (emptyIndices.length === 0) return;

    const targetIndex =
      emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const isGreen = Math.random() < GREEN_RATIO;
    const type: MoleType = isGreen ? "green" : "red";

    const visibleDuration = getVisibleDuration(elapsed);

    molesRef.current = molesRef.current.map((m, i) =>
      i === targetIndex ? { ...m, type, visible: true } : m
    );
    setMoles([...molesRef.current]);

    appearedRef.current.push({ time: elapsed, type });

    // Auto-hide after duration
    const timeout = setTimeout(() => {
      molesRef.current = molesRef.current.map((m, i) =>
        i === targetIndex ? { ...m, type: null, visible: false } : m
      );
      setMoles([...molesRef.current]);
      moleTimeoutsRef.current.delete(targetIndex);
    }, visibleDuration);

    moleTimeoutsRef.current.set(targetIndex, timeout);
  }, [getVisibleDuration]);

  const finishGame = useCallback(() => {
    setPhase("done");
    clearInterval(intervalRef.current);
    clearInterval(timerRef.current);
    moleTimeoutsRef.current.forEach((t) => clearTimeout(t));

    const hits = hitsRef.current;
    const totalDuration = Date.now() - startTimeRef.current;

    // Split into first and last 10 seconds of hits
    const firstHits = hits.filter((h) => h.time < 10_000);
    const lastHits = hits.filter((h) => h.time > totalDuration - 10_000);

    const firstCorrect = firstHits.filter((h) => h.correct).length;
    const firstTotal = firstHits.length;
    const lastCorrect = lastHits.filter((h) => h.correct).length;
    const lastTotal = lastHits.length;

    const firstAccuracy = firstTotal > 0 ? firstCorrect / firstTotal : 0.5;
    const lastAccuracy = lastTotal > 0 ? lastCorrect / lastTotal : 0.5;

    // Consistency ratio: how well did accuracy hold up?
    const consistencyRatio =
      firstAccuracy > 0 ? lastAccuracy / firstAccuracy : lastAccuracy > 0 ? 1.0 : 0.5;

    onComplete({
      rawScore: Math.round(consistencyRatio * 1000) / 1000,
      durationMs: totalDuration,
      metadata: {
        totalScore: score,
        totalHits: hits.length,
        firstPeriodAccuracy: Math.round(firstAccuracy * 1000) / 10,
        lastPeriodAccuracy: Math.round(lastAccuracy * 1000) / 10,
        consistencyRatio: Math.round(consistencyRatio * 1000) / 1000,
      },
    });
  }, [onComplete, score]);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    hitsRef.current = [];
    appearedRef.current = [];
    molesRef.current = Array.from({ length: GRID_SIZE }, (_, i) => ({
      type: null,
      visible: false,
      id: i,
    }));
    setMoles([...molesRef.current]);
    setScore(0);
    setPhase("playing");

    // Timer countdown
    timerRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        GAME_DURATION - (Date.now() - startTimeRef.current)
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        finishGame();
      }
    }, 100);

    // Spawn moles at variable rate
    const spawnLoop = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= GAME_DURATION) return;
      spawnMole();
      // Speed up spawning over time
      const baseInterval = 600;
      const minInterval = 300;
      const progress = elapsed / GAME_DURATION;
      const nextDelay =
        baseInterval - progress * (baseInterval - minInterval) +
        Math.random() * 200;
      intervalRef.current = setTimeout(spawnLoop, nextDelay) as unknown as ReturnType<typeof setInterval>;
    };
    spawnLoop();
  }, [spawnMole, finishGame]);

  const handleWhack = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      const mole = molesRef.current[index];
      if (!mole.visible || !mole.type) return;

      const elapsed = Date.now() - startTimeRef.current;
      const isGreen = mole.type === "green";

      hitsRef.current.push({ time: elapsed, correct: isGreen });

      if (isGreen) {
        setScore((s) => s + 1);
        setLastHitFeedback({ index, type: "good" });
      } else {
        setScore((s) => Math.max(0, s - 2));
        setLastHitFeedback({ index, type: "bad" });
      }

      // Hide the mole
      const timeout = moleTimeoutsRef.current.get(index);
      if (timeout) {
        clearTimeout(timeout);
        moleTimeoutsRef.current.delete(index);
      }
      molesRef.current = molesRef.current.map((m, i) =>
        i === index ? { ...m, type: null, visible: false } : m
      );
      setMoles([...molesRef.current]);

      setTimeout(() => setLastHitFeedback(null), 200);
    },
    [phase]
  );

  useEffect(() => {
    const moleTimeouts = moleTimeoutsRef.current;
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
      moleTimeouts.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">压力测试 - 操作说明</h3>
          <p className="text-sm text-muted-foreground">
            打地鼠! 点击绿色目标得分(+1), 不要点红色目标(-2)
          </p>
          <p className="text-sm text-muted-foreground">
            速度会逐渐加快, 保持冷静和准确!
          </p>
          <p className="text-sm text-muted-foreground">时限: 30 秒</p>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 transition"
        >
          开始游戏
        </button>
        <button
          onClick={onAbort}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          放弃测试
        </button>
      </div>
    );
  }

  const secs = Math.ceil(timeLeft / 1000);
  const progress = 1 - timeLeft / GAME_DURATION;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between w-full text-sm px-1">
        <span className="text-muted-foreground">
          得分: <span className="text-foreground font-bold">{score}</span>
        </span>
        <span className="font-mono text-lg font-bold text-foreground">
          {secs}s
        </span>
        <span className="text-xs text-muted-foreground">
          速度: {Math.round(progress * 100)}%
        </span>
      </div>

      {/* Speed bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs aspect-square">
        {moles.map((mole, i) => (
          <button
            key={i}
            onClick={() => handleWhack(i)}
            className={`relative aspect-square rounded-2xl border-2 transition-all duration-150 flex items-center justify-center text-4xl ${
              mole.visible && mole.type === "green"
                ? "bg-green-600/30 border-green-500 scale-105 cursor-pointer hover:bg-green-600/50"
                : mole.visible && mole.type === "red"
                  ? "bg-red-600/30 border-red-500 scale-105 cursor-pointer hover:bg-red-600/50"
                  : "bg-slate-800/50 border-slate-700 cursor-default"
            } ${
              lastHitFeedback?.index === i
                ? lastHitFeedback.type === "good"
                  ? "ring-2 ring-green-400"
                  : "ring-2 ring-red-400"
                : ""
            }`}
          >
            {mole.visible && mole.type === "green" && "🟢"}
            {mole.visible && mole.type === "red" && "🔴"}
            {!mole.visible && (
              <div className="w-8 h-8 rounded-full bg-slate-700/50" />
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-xs text-muted-foreground">
        <span>🟢 点击 +1</span>
        <span>🔴 不要点 -2</span>
      </div>

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground mt-2"
      >
        放弃测试
      </button>
    </div>
  );
}
