"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";

const GAME_DURATION = 20_000; // 20 seconds
const TARGET_RADIUS = 30;
const CANVAS_W = 600;
const CANVAS_H = 400;
const SPEED = 2.5; // pixels per frame

interface TargetPos {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export default function HandEyeGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [trackPct, setTrackPct] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<TargetPos>({
    x: CANVAS_W / 2,
    y: CANVAS_H / 2,
    dx: SPEED,
    dy: SPEED * 0.7,
  });
  const mouseRef = useRef({ x: 0, y: 0 });
  const framesOnTarget = useRef(0);
  const totalFrames = useRef(0);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const gameStartRef = useRef(0);
  const completedRef = useRef(false);

  const pickNewDirection = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const speed = SPEED + Math.random() * 1.5;
    targetRef.current.dx = Math.cos(angle) * speed;
    targetRef.current.dy = Math.sin(angle) * speed;
  }, []);

  const gameLoop = useCallback(() => {
    if (completedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const elapsed = Date.now() - gameStartRef.current;
    const remaining = Math.max(0, GAME_DURATION - elapsed);
    setTimeLeft(Math.ceil(remaining / 1000));

    if (remaining <= 0) {
      const pct =
        totalFrames.current > 0
          ? (framesOnTarget.current / totalFrames.current) * 100
          : 0;
      const finalPct = Math.round(pct * 10) / 10;
      setTrackPct(finalPct);
      setPhase("done");
      completedRef.current = true;
      onComplete({
        rawScore: finalPct,
        durationMs: Date.now() - startTimeRef.current,
        metadata: {
          framesOnTarget: framesOnTarget.current,
          totalFrames: totalFrames.current,
        },
      });
      return;
    }

    // Update target position
    const t = targetRef.current;
    t.x += t.dx;
    t.y += t.dy;

    // Bounce off walls
    if (t.x - TARGET_RADIUS < 0 || t.x + TARGET_RADIUS > CANVAS_W) {
      t.dx = -t.dx;
      t.x = Math.max(TARGET_RADIUS, Math.min(CANVAS_W - TARGET_RADIUS, t.x));
    }
    if (t.y - TARGET_RADIUS < 0 || t.y + TARGET_RADIUS > CANVAS_H) {
      t.dy = -t.dy;
      t.y = Math.max(TARGET_RADIUS, Math.min(CANVAS_H - TARGET_RADIUS, t.y));
    }

    // Randomly change direction occasionally
    if (Math.random() < 0.01) {
      pickNewDirection();
    }

    // Check if mouse is on target
    totalFrames.current++;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const dist = Math.sqrt((mx - t.x) ** 2 + (my - t.y) ** 2);
    const isOnTarget = dist <= TARGET_RADIUS;
    if (isOnTarget) framesOnTarget.current++;

    // Update live percentage display
    const livePct =
      totalFrames.current > 0
        ? Math.round(
            (framesOnTarget.current / totalFrames.current) * 100 * 10
          ) / 10
        : 0;
    setTrackPct(livePct);

    // Draw
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Target circle
    ctx.beginPath();
    ctx.arc(t.x, t.y, TARGET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isOnTarget ? "#22c55e" : "#ef4444";
    ctx.fill();
    ctx.strokeStyle = isOnTarget ? "#86efac" : "#fca5a5";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner dot
    ctx.beginPath();
    ctx.arc(t.x, t.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Crosshair at mouse position
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx - 10, my);
    ctx.lineTo(mx + 10, my);
    ctx.moveTo(mx, my - 10);
    ctx.lineTo(mx, my + 10);
    ctx.stroke();

    animRef.current = requestAnimationFrame(gameLoop);
  }, [onComplete, pickNewDirection]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      mouseRef.current.x = (e.clientX - rect.left) * scaleX;
      mouseRef.current.y = (e.clientY - rect.top) * scaleY;
    },
    []
  );

  const startGame = useCallback(() => {
    completedRef.current = false;
    startTimeRef.current = Date.now();
    gameStartRef.current = Date.now();
    framesOnTarget.current = 0;
    totalFrames.current = 0;
    targetRef.current = {
      x: CANVAS_W / 2,
      y: CANVAS_H / 2,
      dx: SPEED,
      dy: SPEED * 0.7,
    };
    setPhase("playing");
    animRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex justify-between w-full max-w-[600px] text-sm text-muted-foreground px-2">
        <span>{isZh ? "追踪率:" : "Tracking:"} {trackPct}%</span>
        {phase === "playing" && <span>{isZh ? "剩余:" : "Remaining:"} {timeLeft}s</span>}
      </div>

      {phase === "idle" && (
        <div className="w-full max-w-[600px] flex flex-col items-center gap-4">
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <p className="text-lg mb-4">
              {isZh ? "保持鼠标/光标在移动的红色目标圆上" : "Keep your cursor on the moving red target"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {isZh
                ? "目标会在画布内随机移动，持续20秒。追踪率越高分数越高。"
                : "The target moves randomly for 20 seconds. Higher tracking = higher score."}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-lg transition-colors"
            >
              {isZh ? "开始测试" : "Start Test"}
            </button>
          </div>
        </div>
      )}

      {phase === "playing" && (
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseMove={handleMouseMove}
          className="rounded-xl cursor-none w-full max-w-[600px]"
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        />
      )}

      {phase === "done" && (
        <div className="w-full max-w-[600px] bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-2xl font-bold mb-2">{isZh ? "测试完成!" : "Test Complete!"}</p>
          <p className="text-4xl font-bold text-green-400">{trackPct}%</p>
          <p className="text-sm text-muted-foreground mt-2">{isZh ? "追踪准确率" : "Tracking Accuracy"}</p>
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
