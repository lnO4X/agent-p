"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";

const GAME_DURATION = 23_000; // 23 seconds total (3s practice + 20s scored)
const PRACTICE_DURATION = 3_000; // First 3s are unscored "get ready" practice
const SCORED_DURATION = GAME_DURATION - PRACTICE_DURATION;
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
  const [timeLeft, setTimeLeft] = useState(SCORED_DURATION / 1000);
  const [trackPct, setTrackPct] = useState(0);
  const [isPracticePhase, setIsPracticePhase] = useState(true);

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
    const inPractice = elapsed < PRACTICE_DURATION;
    // Once out of practice, remaining is the scored time left
    const remaining = inPractice
      ? Math.max(0, GAME_DURATION - elapsed)
      : Math.max(0, GAME_DURATION - elapsed);
    setTimeLeft(Math.ceil(remaining / 1000));

    // Transition from practice to scored phase
    if (!inPractice && isPracticePhase) {
      setIsPracticePhase(false);
    }

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
          practiceDurationMs: PRACTICE_DURATION,
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
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const dist = Math.sqrt((mx - t.x) ** 2 + (my - t.y) ** 2);
    const isOnTarget = dist <= TARGET_RADIUS;
    // Only count frames AFTER practice period
    if (!inPractice) {
      totalFrames.current++;
      if (isOnTarget) framesOnTarget.current++;
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete, pickNewDirection]);

  const updatePointerPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    mouseRef.current.x = (clientX - rect.left) * scaleX;
    mouseRef.current.y = (clientY - rect.top) * scaleY;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      updatePointerPos(e.clientX, e.clientY);
    },
    [updatePointerPos]
  );

  // Touch handlers: translate finger position to the same pointer ref so the
  // pursuit-rotor paradigm works on mobile. Measurement precision is lower on
  // touch (finger obscures the target, less sub-pixel accuracy) but the
  // percent-on-target metric still scores the player's tracking ability.
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) updatePointerPos(touch.clientX, touch.clientY);
    },
    [updatePointerPos]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) updatePointerPos(touch.clientX, touch.clientY);
    },
    [updatePointerPos]
  );

  const startGame = useCallback(() => {
    completedRef.current = false;
    startTimeRef.current = Date.now();
    gameStartRef.current = Date.now();
    framesOnTarget.current = 0;
    totalFrames.current = 0;
    setIsPracticePhase(true);
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
        {phase === "playing" && isPracticePhase && (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-md text-xs">
            {isZh ? "准备中 — 不计分" : "Get ready — not scored"}
          </span>
        )}
        {phase === "playing" && !isPracticePhase && <span>{isZh ? "剩余:" : "Remaining:"} {timeLeft}s</span>}
      </div>

      {phase === "idle" && (
        <div className="w-full max-w-[600px] flex flex-col items-center gap-4">
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <p className="text-lg mb-4">
              {isZh
                ? "保持鼠标/手指在移动的红色目标圆上"
                : "Keep your cursor or finger on the moving red target"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {isZh
                ? "目标会在画布内随机移动，持续20秒。追踪率越高分数越高。"
                : "The target moves randomly for 20 seconds. Higher tracking = higher score."}
            </p>
            <p className="text-xs text-muted-foreground mb-4 md:hidden">
              {isZh
                ? "提示：手指触控可玩，但在电脑上用鼠标精度更高。"
                : "Tip: Works on touch, but mouse on PC gives higher precision."}
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className="rounded-xl cursor-none w-full max-w-[600px] touch-none select-none"
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
