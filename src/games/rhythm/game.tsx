"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import type { GameComponentProps } from "@/types/game";

const TOTAL_NOTES = 30;
const CANVAS_W = 400;
const CANVAS_H = 500;
const NOTE_RADIUS = 18;
const HIT_ZONE_Y = CANVAS_H - 60;
const HIT_ZONE_HEIGHT = 8;
const HIT_WINDOW_MS = 200;
const INITIAL_BPM = 90;
const BPM_INCREMENT = 4;
const NUM_LANES = 3;
const LANE_WIDTH = CANVAS_W / NUM_LANES;

interface Note {
  id: number;
  lane: number;
  targetTime: number;
  hitDeviation: number | null;
  y: number;
  active: boolean;
}

export default function RhythmGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [hitCount, setHitCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [lastHitText, setLastHitText] = useState("");
  const [avgDev, setAvgDev] = useState(0);

  const isZhRef = useRef(isZh);
  isZhRef.current = isZh;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const notesRef = useRef<Note[]>([]);
  const animRef = useRef<number>(0);
  const gameStartRef = useRef(0);
  const startTimeRef = useRef(0);
  const processedRef = useRef(0);
  const deviationsRef = useRef<number[]>([]);
  const completedRef = useRef(false);

  const generateNotes = useCallback((): Note[] => {
    const notes: Note[] = [];
    let currentTime = 2000;
    for (let i = 0; i < TOTAL_NOTES; i++) {
      const bpm = INITIAL_BPM + Math.floor(i / 5) * BPM_INCREMENT;
      const beatInterval = 60000 / bpm;
      // Random timing swing ±15% for natural feel
      const swing = (Math.random() - 0.5) * 0.3 * beatInterval;
      const lane = Math.floor(Math.random() * NUM_LANES);
      notes.push({
        id: i,
        lane,
        targetTime: currentTime + swing,
        hitDeviation: null,
        y: -NOTE_RADIUS,
        active: true,
      });
      currentTime += beatInterval;
    }
    return notes;
  }, []);

  const gameLoop = useCallback(() => {
    if (completedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const now = performance.now();
    const elapsed = now - gameStartRef.current;
    const notes = notesRef.current;
    const travelTime = 1500;

    for (const note of notes) {
      if (!note.active) continue;
      const timeDiff = elapsed - note.targetTime;
      const progress = (timeDiff + travelTime) / travelTime;
      note.y = progress * HIT_ZONE_Y;

      if (timeDiff > HIT_WINDOW_MS && note.hitDeviation === null) {
        note.active = false;
        setMissCount((m) => m + 1);
        processedRef.current++;
      }
    }

    if (processedRef.current >= TOTAL_NOTES) {
      const devs = deviationsRef.current;
      const avg =
        devs.length > 0
          ? Math.round(devs.reduce((a, b) => a + b, 0) / devs.length)
          : HIT_WINDOW_MS;
      setAvgDev(avg);
      setPhase("done");
      completedRef.current = true;
      onComplete({
        rawScore: avg,
        durationMs: Date.now() - startTimeRef.current,
        metadata: {
          deviations: devs,
          hits: devs.length,
          misses: TOTAL_NOTES - devs.length,
          totalNotes: TOTAL_NOTES,
        },
      });
      return;
    }

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Lane dividers
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < NUM_LANES; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_WIDTH, 0);
      ctx.lineTo(i * LANE_WIDTH, CANVAS_H);
      ctx.stroke();
    }

    // Hit zone
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.fillRect(0, HIT_ZONE_Y - HIT_ZONE_HEIGHT * 3, CANVAS_W, HIT_ZONE_HEIGHT * 6);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(0, HIT_ZONE_Y - HIT_ZONE_HEIGHT / 2, CANVAS_W, HIT_ZONE_HEIGHT);

    const laneColors = ["#ef4444", "#f59e0b", "#22c55e"];
    const laneGlowColors = ["#fca5a5", "#fde68a", "#86efac"];

    for (const note of notes) {
      if (!note.active) continue;
      if (note.y < -NOTE_RADIUS || note.y > CANVAS_H + NOTE_RADIUS) continue;

      const laneX = note.lane * LANE_WIDTH + LANE_WIDTH / 2;

      ctx.beginPath();
      ctx.arc(laneX, note.y, NOTE_RADIUS, 0, Math.PI * 2);

      const distToZone = Math.abs(note.y - HIT_ZONE_Y);
      if (distToZone < 30) {
        ctx.fillStyle = laneGlowColors[note.lane];
        ctx.shadowColor = laneColors[note.lane];
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = laneColors[note.lane];
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(laneX, note.y, NOTE_RADIUS * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(isZhRef.current ? `命中: ${deviationsRef.current.length}` : `Hits: ${deviationsRef.current.length}`, 10, 25);
    ctx.textAlign = "right";
    ctx.fillText(isZhRef.current ? `剩余: ${TOTAL_NOTES - processedRef.current}` : `Left: ${TOTAL_NOTES - processedRef.current}`, CANVAS_W - 10, 25);

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12px sans-serif";
    ctx.fillText(isZhRef.current ? "按 空格键 或 点击" : "Press SPACE or Click", CANVAS_W / 2, CANVAS_H - 15);

    animRef.current = requestAnimationFrame(gameLoop);
  }, [onComplete]);

  const handleHit = useCallback(() => {
    if (phase !== "playing") return;

    const now = performance.now();
    const elapsed = now - gameStartRef.current;
    const notes = notesRef.current;

    let bestNote: Note | null = null;
    let bestDev = Infinity;

    for (const note of notes) {
      if (!note.active || note.hitDeviation !== null) continue;
      const dev = Math.abs(elapsed - note.targetTime);
      if (dev < bestDev && dev <= HIT_WINDOW_MS) {
        bestDev = dev;
        bestNote = note;
      }
    }

    if (bestNote) {
      bestNote.active = false;
      bestNote.hitDeviation = bestDev;
      deviationsRef.current.push(bestDev);
      processedRef.current++;
      setHitCount((h) => h + 1);

      if (bestDev < 30) setLastHitText(isZh ? "完美!" : "Perfect!");
      else if (bestDev < 80) setLastHitText(isZh ? "很好!" : "Great!");
      else setLastHitText(isZh ? "还行" : "OK");
    }
  }, [phase, isZh]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handleHit();
      }
    },
    [handleHit]
  );

  const startGame = useCallback(() => {
    completedRef.current = false;
    startTimeRef.current = Date.now();
    gameStartRef.current = performance.now();
    notesRef.current = generateNotes();
    processedRef.current = 0;
    deviationsRef.current = [];
    setHitCount(0);
    setMissCount(0);
    setLastHitText("");
    setPhase("playing");
    animRef.current = requestAnimationFrame(gameLoop);
  }, [generateNotes, gameLoop]);

  useEffect(() => {
    if (phase === "playing") {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [phase, handleKeyDown]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex justify-between w-full max-w-[400px] text-sm text-muted-foreground px-2">
        <span>{isZh ? "命中" : "Hits"}: {hitCount}</span>
        <span className="text-yellow-400 font-bold min-w-[4rem] text-center">
          {lastHitText}
        </span>
        <span>{isZh ? "失误" : "Miss"}: {missCount}</span>
      </div>

      {phase === "idle" && (
        <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 md:p-8 text-center">
          <p className="text-lg mb-4">{isZh ? "节拍捕手" : "Beat Catcher"}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {isZh
              ? "音符从上方三条轨道落下，到达蓝色区域时按空格键或点击画布。节奏从90BPM开始逐渐加快。共20个音符，计时偏差越小分数越高。"
              : "Notes fall down three lanes. Press SPACE or click when they reach the blue zone. Tempo starts at 90 BPM and increases. 20 notes \u2014 smaller timing deviation = higher score."}
          </p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-lg transition-colors"
          >
            {isZh ? "开始测试" : "Start Test"}
          </button>
        </div>
      )}

      {phase === "playing" && (
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleHit}
          className="rounded-xl cursor-pointer w-full max-w-[400px]"
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        />
      )}

      {phase === "done" && (
        <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 md:p-8 text-center">
          <p className="text-2xl font-bold mb-2">{isZh ? "测试完成!" : "Test Complete!"}</p>
          <p className="text-4xl font-bold text-red-400">{avgDev}ms</p>
          <p className="text-sm text-muted-foreground mt-2">{isZh ? "平均计时偏差" : "Average Timing Deviation"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isZh ? `命中 ${hitCount}/${TOTAL_NOTES}` : `Hits ${hitCount}/${TOTAL_NOTES}`}
          </p>
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
