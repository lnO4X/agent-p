"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";

const GRID = 4;
const TOTAL_ROUNDS = 15;
const TILE_COUNT = GRID * GRID;

interface RoundData {
  baseHue: number;
  baseSat: number;
  baseLightness: number;
  oddIndex: number;
  oddLightnessDiff: number;
}

// Simple seeded random for consistent per-round but different per-game results
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

// Generate round data with decreasing color difference
function generateRound(roundIndex: number, gameSeed: number): RoundData {
  const rng = seededRandom(gameSeed + roundIndex * 997 + 42);

  // Base color varies each round - randomized per game
  const baseHue = Math.floor(rng() * 360);
  const baseSat = 45 + Math.floor(rng() * 35);
  const baseLightness = 30 + Math.floor(rng() * 25);

  // Odd tile index - random position each round
  const oddIndex = Math.floor(rng() * TILE_COUNT);

  // Difference decreases each round: starts large, gets subtle
  const maxDiff = 25;
  const minDiff = 3;
  const diff = maxDiff - ((maxDiff - minDiff) * roundIndex) / (TOTAL_ROUNDS - 1);

  // Randomly go lighter or darker
  const direction = rng() < 0.5 ? 1 : -1;

  return {
    baseHue,
    baseSat,
    baseLightness,
    oddIndex,
    oddLightnessDiff: diff * direction,
  };
}

function tileColor(hue: number, sat: number, lightness: number): string {
  return `hsl(${hue}, ${sat}%, ${lightness}%)`;
}

export default function PatternGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<
    "idle" | "playing" | "feedback" | "done"
  >("idle");
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);

  const startTimeRef = useRef(0);
  const roundResults = useRef<boolean[]>([]);
  const gameSeedRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roundData = useMemo(() => generateRound(round, gameSeedRef.current), [round]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    gameSeedRef.current = Math.floor(Math.random() * 100000);
    setRound(0);
    setCorrect(0);
    setSelected(null);
    roundResults.current = [];
    setPhase("playing");
  }, []);

  const handleTileClick = useCallback(
    (index: number) => {
      if (phase !== "playing") return;

      const isRight = index === roundData.oddIndex;
      setSelected(index);
      setWasCorrect(isRight);
      if (isRight) setCorrect((c) => c + 1);
      roundResults.current.push(isRight);
      setPhase("feedback");

      timeoutRef.current = setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          const finalCorrect = roundResults.current.filter(Boolean).length;
          setPhase("done");
          onComplete({
            rawScore: finalCorrect,
            durationMs: Date.now() - startTimeRef.current,
            metadata: {
              rounds: TOTAL_ROUNDS,
              results: roundResults.current,
            },
          });
        } else {
          setRound(nextRound);
          setSelected(null);
          setPhase("playing");
        }
      }, 600);
    },
    [phase, round, roundData, onComplete]
  );

  const baseColor = tileColor(
    roundData.baseHue,
    roundData.baseSat,
    roundData.baseLightness
  );
  const oddColor = tileColor(
    roundData.baseHue,
    roundData.baseSat,
    roundData.baseLightness + roundData.oddLightnessDiff
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex justify-between w-full max-w-xs text-sm text-muted-foreground px-2">
        <span>
          第 {round + 1}/{TOTAL_ROUNDS} 轮
        </span>
        <span>
          正确: {correct}/{round + (phase === "feedback" || phase === "done" ? 1 : 0)}
        </span>
      </div>

      {phase === "idle" && (
        <div className="w-full max-w-sm bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-lg mb-4">找出不同颜色的方块</p>
          <p className="text-sm text-muted-foreground mb-6">
            4x4方格中有一个方块颜色与其它略有不同。每轮颜色差异会越来越小。
            共15轮，找对越多分数越高。
          </p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-lg transition-colors"
          >
            开始测试
          </button>
        </div>
      )}

      {(phase === "playing" || phase === "feedback") && (
        <>
          <p className="text-sm text-muted-foreground">
            点击颜色不同的方块
          </p>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}
          >
            {Array.from({ length: TILE_COUNT }, (_, i) => {
              const isOdd = i === roundData.oddIndex;
              const color = isOdd ? oddColor : baseColor;

              let borderStyle = "";
              if (phase === "feedback") {
                if (i === roundData.oddIndex) {
                  borderStyle = "ring-2 ring-green-400";
                } else if (i === selected && !wasCorrect) {
                  borderStyle = "ring-2 ring-red-400";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleTileClick(i)}
                  disabled={phase === "feedback"}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg transition-all ${
                    phase === "playing"
                      ? "cursor-pointer hover:scale-95 active:scale-90"
                      : "cursor-default"
                  } ${borderStyle}`}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>

          {phase === "feedback" && (
            <p
              className={`text-sm font-bold ${wasCorrect ? "text-green-400" : "text-red-400"}`}
            >
              {wasCorrect ? "正确!" : "错误!"}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            难度: {round + 1}/{TOTAL_ROUNDS} (差异越来越小)
          </p>
        </>
      )}

      {phase === "done" && (
        <div className="w-full max-w-sm bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-2xl font-bold mb-2">测试完成!</p>
          <p className="text-4xl font-bold text-cyan-400">
            {correct}/{TOTAL_ROUNDS}
          </p>
          <p className="text-sm text-muted-foreground mt-2">正确辨别</p>
        </div>
      )}

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        放弃测试
      </button>
    </div>
  );
}
