"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import type { GameComponentProps } from "@/types/game";

/**
 * Sensorimotor Synchronization (SMS) tapping task.
 *
 * Classical paradigm (Repp 2005 review). Subject taps in time with an
 * isochronous metronome. We schedule beats via Web Audio API for
 * sample-accurate timing (setTimeout drifts ~10-50ms under load), record
 * tap times against `audioContext.currentTime`, and compute the mean
 * absolute asynchrony to the nearest scored beat.
 *
 * Structure:
 *   - 4 listen beats (no tap scored)
 *   - 8 practice beats (taps accepted but not scored)
 *   - 32 scored beats (asynchronies averaged)
 * Tempo: 120 BPM (500ms IOI) — preferred-tempo range for adults.
 */

const BPM = 120;
const IOI = 60 / BPM; // inter-onset interval, seconds = 0.5
const LISTEN_BEATS = 4;
const PRACTICE_BEATS = 8;
const SCORED_BEATS = 32;
const TOTAL_BEATS = LISTEN_BEATS + PRACTICE_BEATS + SCORED_BEATS; // 44
const SCORED_START_INDEX = LISTEN_BEATS + PRACTICE_BEATS; // 12
const SCORED_END_INDEX = TOTAL_BEATS; // 44 (exclusive)

// A tap is only matched to a beat if within this absolute window.
// Beyond this, the tap is treated as unattributable and the beat counts
// as missed. 250ms = half the IOI, the standard attribution window.
const MAX_MATCH_WINDOW_MS = 250;

// Visual pulse half-life (ms) — how long the beat ring stays lit after a beat.
const PULSE_DECAY_MS = 150;
// Tap flash duration (ms) — how long the tap feedback color stays visible.
const TAP_FLASH_MS = 180;

type Phase = "idle" | "playing" | "done";
type TapFlash = "none" | "accurate" | "late";

interface Beat {
  index: number;
  audioTime: number; // audioContext time (seconds) of beat onset
}

/** Schedule a single metronome click at the given AudioContext time. */
function scheduleBeat(ctx: AudioContext, audioTime: number, accent: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  // Accent (downbeat every 4 beats in listen phase) uses a slightly higher
  // pitch so the subject hears the pulse clearly. Standard metronome sound.
  osc.frequency.value = accent ? 1000 : 800;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.0001, audioTime);
  gain.gain.exponentialRampToValueAtTime(0.35, audioTime + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioTime + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(audioTime);
  osc.stop(audioTime + 0.06);
}

export default function RhythmGame({ onComplete, onAbort }: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<Phase>("idle");
  const [beatIndex, setBeatIndex] = useState(0); // 0..TOTAL_BEATS
  const [pulseActive, setPulseActive] = useState(false);
  const [tapFlash, setTapFlash] = useState<TapFlash>("none");
  const [resultMs, setResultMs] = useState<number | null>(null);
  const [missedCount, setMissedCount] = useState(0);

  // Refs for audio + timing (avoid re-renders breaking scheduling)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beatsRef = useRef<Beat[]>([]);
  const asynchroniesRef = useRef<number[]>([]);
  const tapsRef = useRef<number[]>([]); // audioTime of each tap
  const matchedBeatsRef = useRef<Set<number>>(new Set());
  const startWallClockRef = useRef(0);
  const rafRef = useRef<number>(0);
  const completedRef = useRef(false);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupAudio = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== "closed") {
      ctx.close().catch(() => {
        // No-op — AudioContext close rejection is not actionable here.
      });
    }
    audioCtxRef.current = null;
  }, []);

  // Final completion: compute mean absolute asynchrony and call onComplete.
  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    const asyncs = asynchroniesRef.current;
    const missed = SCORED_BEATS - asyncs.length;
    const meanAbs =
      asyncs.length > 0
        ? asyncs.reduce((a, b) => a + Math.abs(b), 0) / asyncs.length
        : MAX_MATCH_WINDOW_MS;

    const rounded = Math.round(meanAbs * 10) / 10;
    setResultMs(rounded);
    setMissedCount(missed);
    setPhase("done");

    onComplete({
      rawScore: rounded,
      durationMs: Date.now() - startWallClockRef.current,
      metadata: {
        asynchronies: asyncs,
        missedBeats: missed,
        scoredBeats: SCORED_BEATS,
        bpm: BPM,
        listenBeats: LISTEN_BEATS,
        practiceBeats: PRACTICE_BEATS,
      },
    });
  }, [onComplete]);

  // rAF loop: watch `audioContext.currentTime`, advance beatIndex as each
  // beat onset passes, trigger visual pulse. Also handle end-of-trial.
  const tick = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || completedRef.current) return;

    const now = ctx.currentTime;
    const beats = beatsRef.current;

    // Advance beat index through any beats whose onset has now passed.
    let passed = 0;
    let nextIndex = beatIndex;
    for (let i = beatIndex; i < beats.length; i++) {
      if (now >= beats[i].audioTime) {
        nextIndex = i + 1;
        passed++;
      } else {
        break;
      }
    }

    if (passed > 0) {
      setBeatIndex(nextIndex);
      setPulseActive(true);
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = setTimeout(() => setPulseActive(false), PULSE_DECAY_MS);
    }

    // End condition: last beat has passed + grace window for a late tap
    const lastBeat = beats[beats.length - 1];
    if (lastBeat && now >= lastBeat.audioTime + MAX_MATCH_WINDOW_MS / 1000) {
      finish();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [beatIndex, finish]);

  // Handle a tap (keyboard or click). Record the audio-time and, if in the
  // scored window, match it to the nearest scored beat within the attribution
  // window and log the asynchrony (signed: negative = early, positive = late).
  const handleTap = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || completedRef.current) return;

    const tapAudioTime = ctx.currentTime;
    tapsRef.current.push(tapAudioTime);

    const beats = beatsRef.current;
    if (beats.length === 0) return;

    // Find nearest beat overall (for visual feedback only; practice beats
    // also flash accurate/late). But only scored beats update asynchronies.
    let nearestIdx = 0;
    let nearestDelta = Infinity;
    for (let i = 0; i < beats.length; i++) {
      const delta = tapAudioTime - beats[i].audioTime; // seconds, signed
      if (Math.abs(delta) < Math.abs(nearestDelta)) {
        nearestDelta = delta;
        nearestIdx = i;
      }
    }

    const nearestDeltaMs = nearestDelta * 1000;
    const absMs = Math.abs(nearestDeltaMs);

    // Visual feedback: green if accurate (< 60ms, within typical adult range),
    // red/amber otherwise.
    const flash: TapFlash = absMs <= 60 ? "accurate" : "late";
    setTapFlash(flash);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setTapFlash("none"), TAP_FLASH_MS);

    // Score only taps attributable to a SCORED beat (indexes 12..43 inclusive).
    // Also enforce that each scored beat is matched at most once — if the
    // subject taps twice near the same beat, the second tap is dropped.
    if (
      nearestIdx >= SCORED_START_INDEX &&
      nearestIdx < SCORED_END_INDEX &&
      absMs <= MAX_MATCH_WINDOW_MS &&
      !matchedBeatsRef.current.has(nearestIdx)
    ) {
      matchedBeatsRef.current.add(nearestIdx);
      asynchroniesRef.current.push(nearestDeltaMs);
    }
  }, []);

  // Keyboard listener — space bar triggers tap during the playing phase.
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, handleTap]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      completedRef.current = true;
      cleanupAudio();
    };
  }, [cleanupAudio]);

  // Start the trial. MUST be invoked from a user gesture so that the
  // AudioContext can be created/resumed on browsers that require it.
  const start = useCallback(async () => {
    if (phase !== "idle") return;

    // Create AudioContext on user gesture (Safari/iOS requirement).
    let ctx: AudioContext;
    try {
      const AudioCtxCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new AudioCtxCtor();
    } catch {
      // AudioContext unavailable — cannot run precise SMS. Abort gracefully.
      onAbort();
      return;
    }

    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // Resume failed — continue; scheduling will still work once audio unlocks.
      }
    }

    audioCtxRef.current = ctx;
    completedRef.current = false;
    asynchroniesRef.current = [];
    tapsRef.current = [];
    matchedBeatsRef.current = new Set();
    startWallClockRef.current = Date.now();

    // Schedule all TOTAL_BEATS at exact IOI intervals starting 0.6s from now.
    // 0.6s lead-in gives the AudioContext clock time to stabilise + user
    // a moment before the first beat.
    const t0 = ctx.currentTime + 0.6;
    const beats: Beat[] = [];
    for (let i = 0; i < TOTAL_BEATS; i++) {
      const at = t0 + i * IOI;
      beats.push({ index: i, audioTime: at });
      // Accent every 4 beats during listen phase so the meter is clear.
      const accent = i < LISTEN_BEATS && i % 4 === 0;
      scheduleBeat(ctx, at, accent);
    }
    beatsRef.current = beats;

    setBeatIndex(0);
    setPulseActive(false);
    setTapFlash("none");
    setResultMs(null);
    setMissedCount(0);
    setPhase("playing");

    rafRef.current = requestAnimationFrame(tick);
  }, [phase, onAbort, tick]);

  // Phase label for the current beat.
  const currentPhaseLabel = (() => {
    if (beatIndex <= LISTEN_BEATS) return isZh ? "聆听..." : "Listen...";
    if (beatIndex <= LISTEN_BEATS + PRACTICE_BEATS)
      return isZh ? "练习..." : "Practice...";
    return isZh ? "跟上节拍!" : "Tap to the beat!";
  })();

  const progressPct = Math.min(100, (beatIndex / TOTAL_BEATS) * 100);

  // Pulse ring color by phase for clarity.
  const isListen = beatIndex < LISTEN_BEATS;
  const isPractice =
    beatIndex >= LISTEN_BEATS && beatIndex < LISTEN_BEATS + PRACTICE_BEATS;
  const ringBase = isListen
    ? "border-slate-400"
    : isPractice
    ? "border-amber-400"
    : "border-teal-400";
  const ringGlow =
    tapFlash === "accurate"
      ? "bg-green-500/60 border-green-400 shadow-[0_0_40px_rgba(74,222,128,0.9)]"
      : tapFlash === "late"
      ? "bg-red-500/50 border-red-400 shadow-[0_0_40px_rgba(248,113,113,0.8)]"
      : pulseActive
      ? isListen
        ? "bg-slate-400/30 border-slate-300 shadow-[0_0_30px_rgba(148,163,184,0.6)]"
        : isPractice
        ? "bg-amber-400/30 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.7)]"
        : "bg-teal-400/30 border-teal-300 shadow-[0_0_30px_rgba(45,212,191,0.8)]"
      : `${ringBase} bg-transparent`;

  const pulseScale = pulseActive || tapFlash !== "none" ? "scale-110" : "scale-100";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {phase === "idle" && (
        <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 md:p-8 text-center">
          <p className="text-lg font-semibold mb-3">
            {isZh ? "节拍同步" : "Beat Sync"}
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            {isZh
              ? "与 120 BPM 节拍器同步敲击空格键或点击。"
              : "Tap space or click in time with a 120 BPM metronome."}
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            {isZh
              ? "4 拍聆听 → 8 拍练习 → 32 拍计分。"
              : "4 beats listen → 8 beats practice → 32 beats scored."}
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            {isZh
              ? "测量你的敲击与节拍的绝对时间偏差（毫秒）。越小越好。"
              : "We measure the mean absolute asynchrony (ms) between your taps and the beat. Lower is better."}
          </p>
          <button
            onClick={start}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-lg transition-colors"
          >
            {isZh ? "开始测试" : "Start Test"}
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          <div className="w-full flex justify-between text-sm text-muted-foreground px-1">
            <span>{currentPhaseLabel}</span>
            <span>
              {Math.min(beatIndex, TOTAL_BEATS)}/{TOTAL_BEATS}
            </span>
          </div>

          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-[width] duration-150 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <button
            type="button"
            onClick={handleTap}
            aria-label={isZh ? "敲击" : "Tap"}
            className="relative w-64 h-64 md:w-72 md:h-72 rounded-full bg-slate-800 flex items-center justify-center cursor-pointer select-none touch-none focus:outline-none"
          >
            <div
              className={`absolute inset-0 rounded-full border-4 transition-all duration-100 ease-out ${ringGlow} ${pulseScale}`}
            />
            <div className="relative z-10 text-center text-white">
              <div className="text-3xl font-bold">120</div>
              <div className="text-xs opacity-70">BPM</div>
            </div>
          </button>

          <p className="text-xs text-muted-foreground">
            {isZh
              ? "按 空格键 或 点击圆圈"
              : "Press SPACE or click the circle"}
          </p>
        </div>
      )}

      {phase === "done" && resultMs !== null && (
        <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 md:p-8 text-center">
          <p className="text-2xl font-bold mb-2">
            {isZh ? "测试完成!" : "Test Complete!"}
          </p>
          <p className="text-4xl font-bold text-teal-400">{resultMs}ms</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isZh ? "平均绝对时间偏差" : "Mean Absolute Asynchrony"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isZh
              ? `命中 ${SCORED_BEATS - missedCount}/${SCORED_BEATS} 拍`
              : `Matched ${SCORED_BEATS - missedCount}/${SCORED_BEATS} beats`}
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
