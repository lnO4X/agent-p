"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";
import { playSound } from "@/lib/audio-fx";
import {
  ParticleBurst,
  ComboCounter,
  useScreenShake,
} from "@/components/game-fx";

const PRACTICE_ROUNDS = 2;
const SCORED_ROUNDS = 12;
const TOTAL_ROUNDS = PRACTICE_ROUNDS + SCORED_ROUNDS;

interface Point {
  x: number;
  y: number;
}

type ShapeData = {
  points: Point[];
  color: string;
};

// Generate a random polygon with n vertices
function generatePolygon(numVertices: number, seed: number): Point[] {
  const points: Point[] = [];
  const angleStep = (Math.PI * 2) / numVertices;
  const rng = mulberry32(seed);
  for (let i = 0; i < numVertices; i++) {
    const angle = angleStep * i - Math.PI / 2;
    const radius = 30 + rng() * 20;
    points.push({
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
    });
  }
  return points;
}

// Simple seeded random
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Rotate points around center
function rotatePoints(points: Point[], angleDeg: number): Point[] {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = 50,
    cy = 50;
  return points.map((p) => ({
    x: cx + (p.x - cx) * Math.cos(rad) - (p.y - cy) * Math.sin(rad),
    y: cy + (p.x - cx) * Math.sin(rad) + (p.y - cy) * Math.cos(rad),
  }));
}

// Reflect points horizontally
function reflectPoints(points: Point[]): Point[] {
  return points.map((p) => ({ x: 100 - p.x, y: p.y }));
}

// Reflect points vertically
function reflectPointsV(points: Point[]): Point[] {
  return points.map((p) => ({ x: p.x, y: 100 - p.y }));
}

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

function ShapeSVG({
  points,
  color,
  size = 100,
}: {
  points: Point[];
  color: string;
  size?: number;
}) {
  const pathD =
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") +
    " Z";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <path
        d={pathD}
        fill={color}
        fillOpacity={0.3}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function generateRound(roundIndex: number, gameSeed: number = 0): {
  shape: ShapeData;
  options: { points: Point[]; isCorrect: boolean }[];
} {
  const complexity = 3 + Math.floor(roundIndex / 2); // 3 to 8 vertices
  const seed = gameSeed + 1000 + roundIndex * 137;
  const basePoints = generatePolygon(complexity, seed);
  const color = COLORS[roundIndex % COLORS.length];

  // Pick a correct rotation angle (90, 180, or 270)
  const rotationAngles = [90, 180, 270];
  const correctAngle =
    rotationAngles[Math.floor(mulberry32(seed + 1)() * rotationAngles.length)];
  const correctPoints = rotatePoints(basePoints, correctAngle);

  // Generate wrong options: reflections and wrong rotations
  const wrongOptions: Point[][] = [];
  const reflectedH = reflectPoints(basePoints);
  const reflectedV = reflectPointsV(basePoints);
  const wrongRotation = rotatePoints(
    basePoints,
    rotationAngles.find((a) => a !== correctAngle)!
  );
  const reflectedRotated = rotatePoints(reflectedH, correctAngle);

  wrongOptions.push(reflectedH, reflectedV, reflectedRotated);
  // If we need more variety, add wrong rotation
  if (wrongOptions.length < 3) {
    wrongOptions.push(wrongRotation);
  }

  // Pick 3 wrong options
  const rng = mulberry32(seed + 2);
  const shuffledWrong = wrongOptions.sort(() => rng() - 0.5).slice(0, 3);

  // Build options array with correct answer inserted
  const correctIdx = Math.floor(rng() * 4);
  const options: { points: Point[]; isCorrect: boolean }[] = [];
  let wrongIdx = 0;
  for (let i = 0; i < 4; i++) {
    if (i === correctIdx) {
      options.push({ points: correctPoints, isCorrect: true });
    } else {
      options.push({ points: shuffledWrong[wrongIdx++], isCorrect: false });
    }
  }

  return { shape: { points: basePoints, color }, options };
}

export default function SpatialGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [phase, setPhase] = useState<"idle" | "playing" | "feedback" | "practice-done" | "done">(
    "idle"
  );
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [endBurstTrigger, setEndBurstTrigger] = useState(0);
  const [lastComplexity, setLastComplexity] = useState(3);
  const startTimeRef = useRef(0);
  const roundResults = useRef<boolean[]>([]);
  const gameSeedRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { trigger: shake, style: shakeStyle } = useScreenShake();

  const roundData = useMemo(() => generateRound(round, gameSeedRef.current), [round]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Level-up chime on complexity increase (every 2 rounds).
  useEffect(() => {
    if (phase !== "playing") return;
    const complexity = 3 + Math.floor(round / 2);
    if (complexity > lastComplexity && round > 0) {
      playSound("coin", 0.15);
      setLastComplexity(complexity);
    }
  }, [round, phase, lastComplexity]);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    gameSeedRef.current = Math.floor(Math.random() * 100000);
    setRound(0);
    setCorrect(0);
    setSelected(null);
    setStreak(0);
    setLastComplexity(3);
    roundResults.current = [];
    setPhase("playing");
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      const isRight = roundData.options[index].isCorrect;
      const isPractice = round < PRACTICE_ROUNDS;
      setSelected(index);
      setWasCorrect(isRight);
      if (isRight && !isPractice) setCorrect((c) => c + 1);
      roundResults.current.push(isRight);
      setPhase("feedback");

      // Click feedback immediately
      playSound("click", 0.15);

      // Feedback reveal after 300ms (audio + particles + shake)
      feedbackTimeoutRef.current = setTimeout(() => {
        if (isRight) {
          playSound("success");
          setBurstTrigger((n) => n + 1);
          setStreak((s) => s + 1);
        } else {
          playSound("error");
          shake();
          setStreak(0);
        }
      }, 300);

      timeoutRef.current = setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          // Exclude practice rounds from scored results
          const scoredResults = roundResults.current.slice(PRACTICE_ROUNDS);
          const finalCorrect = scoredResults.filter(Boolean).length;
          setPhase("done");
          playSound("success");
          setEndBurstTrigger((n) => n + 1);
          onComplete({
            rawScore: finalCorrect,
            durationMs: Date.now() - startTimeRef.current,
            metadata: {
              rounds: SCORED_ROUNDS,
              practiceRounds: PRACTICE_ROUNDS,
              results: scoredResults,
            },
          });
        } else if (nextRound === PRACTICE_ROUNDS) {
          // Transition from practice to scored phase
          setPhase("practice-done");
          setTimeout(() => {
            setRound(nextRound);
            setSelected(null);
            setPhase("playing");
          }, 1000);
        } else {
          setRound(nextRound);
          setSelected(null);
          setPhase("playing");
        }
      }, 800);
    },
    [phase, round, roundData, onComplete, shake]
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full relative" style={shakeStyle}>
      <div className="flex justify-between w-full max-w-lg text-sm text-muted-foreground px-2">
        <span>
          {round < PRACTICE_ROUNDS
            ? isZh
              ? `练习 ${round + 1}/${PRACTICE_ROUNDS}`
              : `Practice ${round + 1}/${PRACTICE_ROUNDS}`
            : isZh
              ? `第 ${round + 1 - PRACTICE_ROUNDS}/${SCORED_ROUNDS} 轮`
              : `Round ${round + 1 - PRACTICE_ROUNDS}/${SCORED_ROUNDS}`}
        </span>
        {round < PRACTICE_ROUNDS ? (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-md text-xs">
            {isZh ? "练习 — 不计分" : "Practice — not scored"}
          </span>
        ) : (
          <span>
            {isZh ? "正确:" : "Correct:"} {correct}/{Math.max(0, round - PRACTICE_ROUNDS + (phase === "feedback" || phase === "done" ? 1 : 0))}
          </span>
        )}
      </div>
      <ComboCounter combo={streak} x={200} y={20} enabled={phase === "feedback" || phase === "playing"} />

      {phase === "idle" && (
        <div className="w-full max-w-lg bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-lg mb-4">{isZh ? "找出正确的旋转形状" : "Find the Correct Rotation"}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {isZh
              ? "上方会显示一个原始形状，下方4个选项中只有一个是正确的旋转。其余是镜像或错误旋转。共12轮，形状逐渐变得复杂。"
              : "A shape is shown above. One of the 4 options below is the correct rotation. Others are mirrors or wrong rotations. 12 rounds — shapes get more complex."}
          </p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg transition-colors"
          >
            {isZh ? "开始测试" : "Start Test"}
          </button>
        </div>
      )}

      {phase === "practice-done" && (
        <div className="w-full max-w-lg bg-slate-800 rounded-xl p-8 text-center animate-pulse">
          <p className="text-xl font-bold text-primary">
            {isZh ? "开始计分..." : "Now scoring..."}
          </p>
        </div>
      )}

      {(phase === "playing" || phase === "feedback") && (
        <div className="w-full max-w-lg flex flex-col items-center gap-6">
          {/* Original shape */}
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col items-center">
            <p className="text-xs text-muted-foreground mb-2">{isZh ? "原始形状" : "Original Shape"}</p>
            <ShapeSVG
              points={roundData.shape.points}
              color={roundData.shape.color}
              size={120}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            {isZh ? "哪个是正确的旋转？" : "Which is the correct rotation?"}
          </p>

          {/* Options */}
          <div className="relative grid grid-cols-2 gap-3 w-full">
            {roundData.options.map((opt, i) => {
              let borderClass = "border-slate-600 hover:border-slate-400";
              const isSelectedFeedback = phase === "feedback" && i === selected;
              if (phase === "feedback") {
                if (opt.isCorrect) {
                  borderClass = "border-green-500 bg-green-500/10";
                } else if (i === selected && !wasCorrect) {
                  borderClass = "border-red-500 bg-red-500/10";
                }
              } else if (i === selected) {
                borderClass = "border-blue-500";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={phase === "feedback"}
                  className={`border-2 rounded-xl p-3 flex items-center justify-center transition-all ${borderClass} ${
                    phase === "feedback" ? "cursor-default" : "cursor-pointer"
                  } ${
                    isSelectedFeedback && wasCorrect
                      ? "animate-pulse ring-2 ring-green-400"
                      : isSelectedFeedback && !wasCorrect
                        ? "animate-pulse ring-2 ring-red-400"
                        : ""
                  }`}
                >
                  <ShapeSVG
                    points={opt.points}
                    color={roundData.shape.color}
                    size={100}
                  />
                </button>
              );
            })}
            <ParticleBurst
              trigger={burstTrigger}
              x={240}
              y={100}
              color="#00D4AA"
              count={16}
              enabled={burstTrigger > 0}
            />
          </div>

          {phase === "feedback" && (
            <p
              className={`text-sm font-bold ${wasCorrect ? "text-green-400" : "text-red-400"}`}
            >
              {wasCorrect ? (isZh ? "正确!" : "Correct!") : (isZh ? "错误!" : "Wrong!")}
            </p>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="relative w-full max-w-lg bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-2xl font-bold mb-2">{isZh ? "测试完成!" : "Test Complete!"}</p>
          <p className="text-4xl font-bold text-blue-400">
            {correct}/{SCORED_ROUNDS}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{isZh ? "正确回答" : "Correct Answers"}</p>
          <ParticleBurst
            trigger={endBurstTrigger}
            x={240}
            y={80}
            color="#FFB800"
            count={Math.max(20, correct * 5)}
            enabled={endBurstTrigger > 0}
          />
        </div>
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
