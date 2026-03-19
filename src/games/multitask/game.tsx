"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";

interface FallingObject {
  id: number;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  speed: number;
}

const GAME_DURATION = 30_000;
const BASKET_WIDTH = 18; // percentage
const CATCH_ZONE = 90; // y threshold for catching
const SPAWN_INTERVAL = 800;
const FALL_SPEED = 1.2;

function generateMathProblem(): { question: string; answer: number } {
  const ops = ["+", "-", "*"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;

  switch (op) {
    case "+":
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
      break;
    case "-":
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * a);
      answer = a - b;
      break;
    case "*":
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      break;
  }

  return { question: `${a} ${op} ${b} = ?`, answer };
}

export default function MultitaskGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [basketX, setBasketX] = useState(50);
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const [caught, setCaught] = useState(0);
  const [missed, setMissed] = useState(0);
  const [mathProblem, setMathProblem] = useState(generateMathProblem);
  const [mathInput, setMathInput] = useState("");
  const [mathCorrect, setMathCorrect] = useState(0);
  const [mathTotal, setMathTotal] = useState(0);
  const [flashColor, setFlashColor] = useState<string | null>(null);

  const startTimeRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);
  const objectIdRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const objectsRef = useRef<FallingObject[]>([]);
  const basketXRef = useRef(50);
  const caughtRef = useRef(0);
  const missedRef = useRef(0);
  const mathCorrectRef = useRef(0);
  const mathTotalRef = useRef(0);
  const mathInputRef = useRef<HTMLInputElement>(null);

  const flash = useCallback((color: string) => {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 200);
  }, []);

  const finishGame = useCallback(() => {
    setPhase("done");
    cancelAnimationFrame(animFrameRef.current);
    const totalObjects = caughtRef.current + missedRef.current;
    const catchPercent =
      totalObjects > 0 ? (caughtRef.current / totalObjects) * 100 : 0;
    // Use refs to avoid stale closure values
    const finalMathTotal = mathTotalRef.current;
    const finalMathCorrect = mathCorrectRef.current;
    const finalMathAccuracy =
      finalMathTotal > 0 ? (finalMathCorrect / finalMathTotal) * 100 : 0;
    const rawScore = catchPercent * 0.5 + finalMathAccuracy * 0.5;

    onComplete({
      rawScore: Math.round(rawScore * 100) / 100,
      durationMs: Date.now() - startTimeRef.current,
      metadata: {
        caught: caughtRef.current,
        missed: missedRef.current,
        catchPercent: Math.round(catchPercent * 10) / 10,
        mathCorrect: finalMathCorrect,
        mathTotal: finalMathTotal,
        mathAccuracy: Math.round(finalMathAccuracy * 10) / 10,
      },
    });
  }, [onComplete]);

  const gameLoop = useCallback(
    (timestamp: number) => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        finishGame();
        return;
      }

      // Basket movement
      const speed = 2.5;
      if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) {
        basketXRef.current = Math.max(
          BASKET_WIDTH / 2,
          basketXRef.current - speed
        );
      }
      if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) {
        basketXRef.current = Math.min(
          100 - BASKET_WIDTH / 2,
          basketXRef.current + speed
        );
      }
      setBasketX(basketXRef.current);

      // Spawn objects
      if (timestamp - lastSpawnRef.current > SPAWN_INTERVAL) {
        lastSpawnRef.current = timestamp;
        const newObj: FallingObject = {
          id: objectIdRef.current++,
          x: 10 + Math.random() * 80,
          y: 0,
          speed: FALL_SPEED + Math.random() * 0.5,
        };
        objectsRef.current = [...objectsRef.current, newObj];
      }

      // Update falling objects
      const alive: FallingObject[] = [];
      for (const obj of objectsRef.current) {
        const newY = obj.y + obj.speed;
        if (newY >= CATCH_ZONE) {
          // Check if caught
          const dist = Math.abs(obj.x - basketXRef.current);
          if (dist < BASKET_WIDTH / 2 + 4) {
            caughtRef.current++;
            setCaught(caughtRef.current);
          } else {
            missedRef.current++;
            setMissed(missedRef.current);
          }
        } else {
          alive.push({ ...obj, y: newY });
        }
      }
      objectsRef.current = alive;
      setObjects([...alive]);

      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [finishGame]
  );

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    setPhase("playing");
    setCaught(0);
    setMissed(0);
    setMathCorrect(0);
    setMathTotal(0);
    setMathInput("");
    setMathProblem(generateMathProblem());
    caughtRef.current = 0;
    missedRef.current = 0;
    mathCorrectRef.current = 0;
    mathTotalRef.current = 0;
    objectsRef.current = [];
    objectIdRef.current = 0;
    lastSpawnRef.current = 0;
    basketXRef.current = 50;
    animFrameRef.current = requestAnimationFrame(gameLoop);
    setTimeout(() => mathInputRef.current?.focus(), 100);
  }, [gameLoop]);

  const handleMathSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const answer = parseInt(mathInput, 10);
      if (isNaN(answer)) return;
      mathTotalRef.current++;
      setMathTotal((t) => t + 1);
      if (answer === mathProblem.answer) {
        mathCorrectRef.current++;
        setMathCorrect((c) => c + 1);
        flash("border-green-500");
      } else {
        flash("border-red-500");
      }
      setMathInput("");
      setMathProblem(generateMathProblem());
      mathInputRef.current?.focus();
    },
    [mathInput, mathProblem, flash]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Prevent A/D and arrow keys from typing into the math input
      // A/D are used for basket movement only; math input is type="number"
      if (key === "a" || key === "d" || key === "arrowleft" || key === "arrowright") {
        e.preventDefault();
      }
      keysRef.current.add(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">双重杂耍 - 操作说明</h3>
          <p className="text-sm text-muted-foreground">
            左侧: 用 ← → 或 A/D 键移动篮筐接住下落的球
          </p>
          <p className="text-sm text-muted-foreground">
            右侧: 解答数学题, 输入答案后按 Enter 提交
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

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between w-full text-sm text-muted-foreground px-1">
        <span>
          接住: {caught} | 漏掉: {missed}
        </span>
        <span className="font-mono text-lg font-bold text-foreground">
          {secs}s
        </span>
        <span>
          数学: {mathCorrect}/{mathTotal}
        </span>
      </div>

      {/* Game area */}
      <div className="flex gap-3 w-full" style={{ height: 360 }}>
        {/* Left: Catching game */}
        <div className="flex-1 relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
          {/* Falling objects */}
          {objects.map((obj) => (
            <div
              key={obj.id}
              className="absolute w-6 h-6 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/30"
              style={{
                left: `${obj.x}%`,
                top: `${obj.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          {/* Basket */}
          <div
            className="absolute bottom-2 h-6 bg-blue-500 rounded-lg border-2 border-blue-300"
            style={{
              left: `${basketX - BASKET_WIDTH / 2}%`,
              width: `${BASKET_WIDTH}%`,
            }}
          />

          {/* Catch line indicator */}
          <div
            className="absolute w-full border-t border-dashed border-slate-600 opacity-30"
            style={{ top: `${CATCH_ZONE}%` }}
          />
        </div>

        {/* Right: Math problems */}
        <div
          className={`flex-1 flex flex-col items-center justify-center gap-6 bg-slate-900 rounded-xl border transition-colors ${
            flashColor || "border-slate-700"
          }`}
        >
          <div className="text-3xl font-bold font-mono text-foreground">
            {mathProblem.question}
          </div>
          <form onSubmit={handleMathSubmit} className="flex gap-2">
            <input
              ref={mathInputRef}
              type="number"
              value={mathInput}
              onChange={(e) => setMathInput(e.target.value)}
              className="w-24 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-center text-lg font-mono text-foreground focus:outline-none focus:border-blue-500"
              autoFocus
              placeholder="?"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90"
            >
              确认
            </button>
          </form>
          <p className="text-xs text-muted-foreground">输入答案, 按 Enter</p>
        </div>
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
