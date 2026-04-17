"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";

const TOTAL_ROUNDS = 12;

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
  const [phase, setPhase] = useState<"idle" | "playing" | "feedback" | "done">(
    "idle"
  );
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

  const handleSelect = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      const isRight = roundData.options[index].isCorrect;
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
      }, 800);
    },
    [phase, round, roundData, onComplete]
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex justify-between w-full max-w-lg text-sm text-muted-foreground px-2">
        <span>
          {isZh ? `第 ${round + 1}/${TOTAL_ROUNDS} 轮` : `Round ${round + 1}/${TOTAL_ROUNDS}`}
        </span>
        <span>
          {isZh ? "正确:" : "Correct:"} {correct}/{round + (phase === "feedback" || phase === "done" ? 1 : 0)}
        </span>
      </div>

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
          <div className="grid grid-cols-2 gap-3 w-full">
            {roundData.options.map((opt, i) => {
              let borderClass = "border-slate-600 hover:border-slate-400";
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
                    phase === "feedback"
                      ? "cursor-default"
                      : "cursor-pointer"
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
        <div className="w-full max-w-lg bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-2xl font-bold mb-2">{isZh ? "测试完成!" : "Test Complete!"}</p>
          <p className="text-4xl font-bold text-blue-400">
            {correct}/{TOTAL_ROUNDS}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{isZh ? "正确回答" : "Correct Answers"}</p>
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
