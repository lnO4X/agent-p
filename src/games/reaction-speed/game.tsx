"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";

type Phase = "waiting" | "ready" | "go" | "too-early" | "result";

const TOTAL_ROUNDS = 10;

export default function ReactionSpeedGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const goTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const startTimeRef = useRef(Date.now());

  const startRound = useCallback(() => {
    setPhase("ready");
    // Random delay 1-4 seconds
    const delay = 1000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      goTimeRef.current = performance.now();
      setPhase("go");
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (phase === "ready") {
      // Clicked too early
      clearTimeout(timerRef.current);
      setPhase("too-early");
      return;
    }

    if (phase === "go") {
      const reactionTime = performance.now() - goTimeRef.current;
      setCurrentTime(Math.round(reactionTime));
      const newTimes = [...times, reactionTime];
      setTimes(newTimes);
      setPhase("result");

      if (newTimes.length >= TOTAL_ROUNDS) {
        // All rounds done
        const avg =
          newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
        completeTimerRef.current = setTimeout(() => {
          onComplete({
            rawScore: avg,
            durationMs: Date.now() - startTimeRef.current,
            metadata: { times: newTimes, rounds: TOTAL_ROUNDS },
          });
        }, 1000);
      }
      return;
    }

    if (phase === "too-early") {
      startRound();
      return;
    }

    if (phase === "result") {
      setRound((r) => r + 1);
      startRound();
      return;
    }

    if (phase === "waiting") {
      startTimeRef.current = Date.now();
      setRound(1);
      startRound();
    }
  }, [phase, times, startRound, onComplete]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(completeTimerRef.current);
    };
  }, []);

  const avgTime =
    times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex justify-between w-full max-w-lg text-sm text-muted-foreground px-2">
        <span>
          第 {round}/{TOTAL_ROUNDS} 轮
        </span>
        {times.length > 0 && <span>平均: {avgTime}ms</span>}
      </div>

      <div
        onClick={handleClick}
        className={`w-full max-w-lg aspect-video rounded-xl flex items-center justify-center cursor-pointer select-none transition-colors text-white text-xl font-bold ${
          phase === "waiting"
            ? "bg-slate-700"
            : phase === "ready"
              ? "bg-red-600"
              : phase === "go"
                ? "bg-green-500"
                : phase === "too-early"
                  ? "bg-orange-500"
                  : "bg-blue-600"
        }`}
      >
        {phase === "waiting" && "点击开始"}
        {phase === "ready" && "等待绿色..."}
        {phase === "go" && "点击!"}
        {phase === "too-early" && "太早了! 点击重试"}
        {phase === "result" && (
          <div className="text-center">
            <div className="text-4xl">{currentTime}ms</div>
            {round < TOTAL_ROUNDS && (
              <div className="text-sm mt-2 opacity-75">点击继续</div>
            )}
            {round >= TOTAL_ROUNDS && (
              <div className="text-sm mt-2 opacity-75">测试完成!</div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        放弃测试
      </button>
    </div>
  );
}
