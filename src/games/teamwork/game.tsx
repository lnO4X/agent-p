"use client";

import { useState, useRef, useCallback } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";

/**
 * Perspective Taking — Visual perspective / Theory of Mind (Michelon & Zacks 2006)
 *
 * A grid shows objects. Some are blocked by a wall from the "director's" view.
 * Player must identify which objects the director CAN see.
 *
 * Measures social cognition: understanding another's viewpoint.
 */

const TOTAL_TRIALS = 16;
const GRID_SIZE = 4; // 4x4

interface GridObject {
  row: number;
  col: number;
  emoji: string;
  blockedFromDirector: boolean;
}

interface Trial {
  objects: GridObject[];
  wallRow: number; // wall blocks row from director's side
  directorSide: "top" | "right"; // director looks from this side
  questionObject: GridObject; // "Can the director see this?"
  answer: boolean; // correct answer
}

const OBJECT_POOL = ["🍎", "⭐", "🔵", "🟢", "🎯", "💎", "🌙", "⚡", "🔥", "🎵", "🌸", "🎪"];

function generateTrial(trialIdx: number): Trial {
  const directorSide = Math.random() < 0.5 ? "top" : "right";
  // Wall position: blocks some rows or columns from the director
  const wallRow = 1 + Math.floor(Math.random() * 2); // row 1 or 2

  const usedPositions = new Set<string>();
  const objects: GridObject[] = [];
  const objectCount = 4 + Math.min(2, Math.floor(trialIdx / 4)); // 4-6 objects

  const emojis = [...OBJECT_POOL].sort(() => Math.random() - 0.5);

  for (let i = 0; i < objectCount; i++) {
    let row: number, col: number;
    do {
      row = Math.floor(Math.random() * GRID_SIZE);
      col = Math.floor(Math.random() * GRID_SIZE);
    } while (usedPositions.has(`${row},${col}`));

    usedPositions.add(`${row},${col}`);

    // Determine if blocked from director
    let blocked = false;
    if (directorSide === "top") {
      blocked = row > wallRow; // wall blocks rows below it from top view
    } else {
      blocked = col < GRID_SIZE - 1 - wallRow; // wall blocks cols left of it from right view
    }

    objects.push({
      row,
      col,
      emoji: emojis[i % emojis.length],
      blockedFromDirector: blocked,
    });
  }

  // Pick a random object to ask about — balance yes/no answers
  const wantBlocked = Math.random() < 0.5;
  const candidates = objects.filter((o) => o.blockedFromDirector === wantBlocked);
  const fallback = objects;
  const questionObject = (candidates.length > 0 ? candidates : fallback)[
    Math.floor(Math.random() * (candidates.length > 0 ? candidates.length : fallback.length))
  ];

  return {
    objects,
    wallRow,
    directorSide,
    questionObject,
    answer: !questionObject.blockedFromDirector,
  };
}

export default function PerspectiveGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [phase, setPhase] = useState<"idle" | "playing" | "feedback" | "done">("idle");
  const [trialIndex, setTrialIndex] = useState(0);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);

  const startTimeRef = useRef(0);
  const trialStartRef = useRef(0);
  const resultsRef = useRef<{ correct: boolean; rt: number }[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null!);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    resultsRef.current = [];
    setCorrect(0);
    setTrialIndex(0);
    const t = generateTrial(0);
    setTrial(t);
    trialStartRef.current = performance.now();
    setPhase("playing");
  }, []);

  const handleAnswer = useCallback(
    (answer: boolean) => {
      if (phase !== "playing" || !trial) return;

      const rt = performance.now() - trialStartRef.current;
      const isCorrect = answer === trial.answer;
      resultsRef.current.push({ correct: isCorrect, rt });

      setLastCorrect(isCorrect);
      if (isCorrect) setCorrect((c) => c + 1);
      setPhase("feedback");

      timerRef.current = setTimeout(() => {
        const next = trialIndex + 1;
        if (next >= TOTAL_TRIALS) {
          const results = resultsRef.current;
          const correctResults = results.filter((r) => r.correct);
          const accuracy = correctResults.length / results.length;
          const avgRT =
            correctResults.length > 0
              ? correctResults.reduce((a, r) => a + r.rt, 0) / correctResults.length
              : 3000;

          // Composite: accuracy-weighted, RT-penalized
          const rawScore = accuracy * 100 - avgRT * 0.01;

          setPhase("done");
          onComplete({
            rawScore: Math.max(0, rawScore),
            durationMs: Date.now() - startTimeRef.current,
            metadata: {
              accuracy: Math.round(accuracy * 100),
              avgRT: Math.round(avgRT),
              totalTrials: TOTAL_TRIALS,
              correctCount: correctResults.length,
            },
          });
        } else {
          setTrialIndex(next);
          const t = generateTrial(next);
          setTrial(t);
          trialStartRef.current = performance.now();
          setPhase("playing");
        }
      }, 500);
    },
    [phase, trial, trialIndex, onComplete]
  );

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">{isZh ? "视角判断 协作认知测试" : "Perspective Taking - Theory of Mind Test"}</h3>
          <p className="text-sm text-muted-foreground">
            {isZh
              ? "网格中有物品和一面墙。墙的另一边有一个导演。判断导演能否看到指定物品。"
              : "A grid contains objects and a wall. A director stands on the other side. Judge whether the director can see the highlighted object."}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {isZh ? "需要从他人的视角思考 — 协作中最重要的能力" : "Think from others' perspective — the most important skill in teamwork"}
          </p>
          <p className="text-xs text-muted-foreground">{isZh ? `共 ${TOTAL_TRIALS} 题` : `${TOTAL_TRIALS} trials`}</p>
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
        <span>{isZh ? `第 ${trialIndex + 1}/${TOTAL_TRIALS} 题` : `Trial ${trialIndex + 1}/${TOTAL_TRIALS}`}</span>
        <span>{isZh ? "正确:" : "Correct:"} {correct}</span>
      </div>

      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${((trialIndex + 1) / TOTAL_TRIALS) * 100}%` }} />
      </div>

      {trial && (phase === "playing" || phase === "feedback") && (
        <>
          {/* Director indicator */}
          <div className="relative w-[280px] h-[280px] mx-auto">
            {/* Director label */}
            {trial.directorSide === "top" && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-blue-400 font-bold">
                {isZh ? "👤 导演在此" : "👤 Director here"}
              </div>
            )}
            {trial.directorSide === "right" && (
              <div className="absolute top-1/2 -right-8 -translate-y-1/2 text-xs text-blue-400 font-bold rotate-90 whitespace-nowrap">
                {isZh ? "👤 导演" : "👤 Director"}
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-4 gap-1 w-full h-full">
              {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, idx) => {
                const row = Math.floor(idx / GRID_SIZE);
                const col = idx % GRID_SIZE;
                const obj = trial.objects.find((o) => o.row === row && o.col === col);
                const isQuestionObj = trial.questionObject.row === row && trial.questionObject.col === col;

                // Wall visualization
                let isWall = false;
                if (trial.directorSide === "top") {
                  isWall = row === trial.wallRow;
                } else {
                  isWall = col === GRID_SIZE - 1 - trial.wallRow;
                }

                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-md flex items-center justify-center text-xl relative ${
                      isWall
                        ? "bg-stone-600 border-2 border-stone-500"
                        : isQuestionObj
                          ? "bg-yellow-500/20 border-2 border-yellow-400 animate-pulse"
                          : obj
                            ? "bg-slate-800/80 border border-slate-700"
                            : "bg-slate-900/50 border border-slate-800/30"
                    }`}
                  >
                    {isWall && <span className="text-xs text-stone-400">{isZh ? "墙" : "Wall"}</span>}
                    {!isWall && obj && <span className="select-none">{obj.emoji}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question */}
          <div className="text-center space-y-2 py-2">
            <p className="text-sm font-bold">
              {isZh
                ? <>导演能看到 <span className="text-xl">{trial.questionObject.emoji}</span> 吗？</>
                : <>Can the director see <span className="text-xl">{trial.questionObject.emoji}</span>?</>}
            </p>
            {phase === "feedback" && (
              <p className={`text-sm font-bold ${lastCorrect ? "text-green-400" : "text-red-400"}`}>
                {lastCorrect
                  ? (isZh ? "✓ 正确!" : "✓ Correct!")
                  : (isZh ? `✗ 答案是 ${trial.answer ? "能看到" : "看不到"}` : `✗ Answer: ${trial.answer ? "Visible" : "Hidden"}`)}
              </p>
            )}
          </div>

          {/* Answer buttons */}
          {phase === "playing" && (
            <div className="flex gap-4 w-full max-w-xs">
              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition"
              >
                {isZh ? "能看到" : "Visible"}
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-lg transition"
              >
                {isZh ? "看不到" : "Hidden"}
              </button>
            </div>
          )}
        </>
      )}

      <button onClick={onAbort} className="text-sm text-muted-foreground hover:text-foreground mt-1">
        {isZh ? "放弃测试" : "Abort Test"}
      </button>
    </div>
  );
}
