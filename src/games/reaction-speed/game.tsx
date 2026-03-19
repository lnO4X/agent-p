"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";

type Phase = "waiting" | "ready" | "distractor" | "go" | "too-early" | "result";

const TOTAL_ROUNDS = 10;
// Rounds where distractors start appearing (1-indexed)
const DISTRACTOR_START_ROUND = 4;

// Distractor colors that flash briefly to trick the player
const DISTRACTOR_COLORS = [
  "bg-orange-500",
  "bg-purple-600",
  "bg-yellow-500",
  "bg-teal-500",
];

export default function ReactionSpeedGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [distractorBg, setDistractorBg] = useState("bg-orange-500");
  const [falseClickCount, setFalseClickCount] = useState(0);
  const goTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const distractorTimerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const startTimeRef = useRef(Date.now());
  const roundRef = useRef(0);
  const cancelledRef = useRef(false);

  // Schedule distractor flashes before the real "go" signal
  const scheduleDistractions = useCallback(
    (onDone: () => void) => {
      cancelledRef.current = false;
      const currentRound = roundRef.current;
      // More distractors in later rounds: 1-2 for rounds 4-6, 2-3 for rounds 7+
      const maxDistractions = currentRound >= 7 ? 3 : 2;
      const distractorCount = 1 + Math.floor(Math.random() * maxDistractions);

      const flashDistractor = (index: number) => {
        if (cancelledRef.current) return;
        if (index >= distractorCount) {
          // All distractors done, schedule the real "go"
          const finalDelay = 400 + Math.random() * 1200;
          timerRef.current = setTimeout(() => {
            if (!cancelledRef.current) onDone();
          }, finalDelay);
          return;
        }

        // Random delay before each distractor flash
        const delay = 600 + Math.random() * 1500;

        timerRef.current = setTimeout(() => {
          if (cancelledRef.current) return;
          // Pick a random distractor color
          const color =
            DISTRACTOR_COLORS[
              Math.floor(Math.random() * DISTRACTOR_COLORS.length)
            ];
          setDistractorBg(color);
          setPhase("distractor");

          // Flash for 150-300ms then back to red
          const flashDuration = 150 + Math.random() * 150;
          distractorTimerRef.current = setTimeout(() => {
            if (cancelledRef.current) return;
            setPhase("ready");
            flashDistractor(index + 1);
          }, flashDuration);
        }, delay);
      };

      flashDistractor(0);
    },
    []
  );

  const startRound = useCallback(() => {
    cancelledRef.current = false;
    setPhase("ready");
    const currentRound = roundRef.current;
    const hasDistractors = currentRound >= DISTRACTOR_START_ROUND;

    if (hasDistractors) {
      // Schedule distractors, then show green
      scheduleDistractions(() => {
        goTimeRef.current = performance.now();
        setPhase("go");
      });
    } else {
      // Classic behavior: random delay 1-4 seconds then green
      const delay = 1000 + Math.random() * 3000;
      timerRef.current = setTimeout(() => {
        goTimeRef.current = performance.now();
        setPhase("go");
      }, delay);
    }
  }, [scheduleDistractions]);

  const handleClick = useCallback(() => {
    if (phase === "ready") {
      // Clicked too early on red
      cancelledRef.current = true;
      clearTimeout(timerRef.current);
      clearTimeout(distractorTimerRef.current);
      setPhase("too-early");
      return;
    }

    if (phase === "distractor") {
      // Clicked on a distractor color — penalty!
      cancelledRef.current = true;
      clearTimeout(timerRef.current);
      clearTimeout(distractorTimerRef.current);
      setFalseClickCount((c) => c + 1);
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
            metadata: {
              times: newTimes,
              rounds: TOTAL_ROUNDS,
              falseClicks: falseClickCount,
            },
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
      roundRef.current = roundRef.current + 1;
      setRound((r) => r + 1);
      startRound();
      return;
    }

    if (phase === "waiting") {
      startTimeRef.current = Date.now();
      roundRef.current = 1;
      setRound(1);
      startRound();
    }
  }, [phase, times, startRound, onComplete, falseClickCount]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearTimeout(timerRef.current);
      clearTimeout(distractorTimerRef.current);
      clearTimeout(completeTimerRef.current);
    };
  }, []);

  const avgTime =
    times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;

  // Determine background color for the game area
  const getBgClass = () => {
    switch (phase) {
      case "waiting":
        return "bg-slate-700";
      case "ready":
        return "bg-red-600";
      case "distractor":
        return distractorBg;
      case "go":
        return "bg-green-500";
      case "too-early":
        return "bg-orange-500";
      case "result":
        return "bg-blue-600";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex justify-between w-full max-w-lg text-sm text-muted-foreground px-2">
        <span>
          第 {round}/{TOTAL_ROUNDS} 轮
        </span>
        <div className="flex gap-3">
          {times.length > 0 && <span>平均: {avgTime}ms</span>}
          {round >= DISTRACTOR_START_ROUND && (
            <span className="text-orange-400 text-xs">⚡ 干扰模式</span>
          )}
        </div>
      </div>

      <div
        onClick={handleClick}
        className={`w-full max-w-lg aspect-video rounded-xl flex items-center justify-center cursor-pointer select-none transition-colors duration-75 text-white text-xl font-bold ${getBgClass()}`}
      >
        {phase === "waiting" && (
          <div className="text-center">
            <div>点击开始</div>
            <div className="text-sm mt-2 opacity-60">
              第{DISTRACTOR_START_ROUND}轮起出现干扰色, 只点绿色!
            </div>
          </div>
        )}
        {phase === "ready" && "等待绿色..."}
        {phase === "distractor" && "等待绿色..."}
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
