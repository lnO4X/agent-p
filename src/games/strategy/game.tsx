"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";

/**
 * Go/No-Go Task — Impulse control paradigm (Donders 1969; Logan 1994)
 *
 * Green circle = press (Go), Red circle = withhold (No-Go).
 * 75% Go / 25% No-Go creates prepotent "press" response.
 *
 * Metrics: Commission errors (pressing on No-Go), Go RT, d-prime
 */

const TOTAL_TRIALS = 40;
const GO_RATIO = 0.75;
const STIMULUS_MS = 800;
const FIXATION_MIN_MS = 400;
const FIXATION_VAR_MS = 600;

interface Trial {
  isGo: boolean;
}

function generateTrials(): Trial[] {
  const goCount = Math.round(TOTAL_TRIALS * GO_RATIO);
  const trials: Trial[] = [];
  for (let i = 0; i < goCount; i++) trials.push({ isGo: true });
  for (let i = 0; i < TOTAL_TRIALS - goCount; i++) trials.push({ isGo: false });
  // Shuffle
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }
  return trials;
}

export default function GoNoGoGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<"idle" | "fixation" | "stimulus" | "feedback" | "done">("idle");
  const [trialIndex, setTrialIndex] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackOk, setFeedbackOk] = useState(true);

  const trialsRef = useRef<Trial[]>([]);
  const stimStartRef = useRef(0);
  const startTimeRef = useRef(0);
  const goRTs = useRef<number[]>([]);
  const commissionErrors = useRef(0); // pressed on No-Go
  const omissionErrors = useRef(0); // didn't press on Go
  const respondedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null!);

  const currentTrial = trialsRef.current[trialIndex];

  const advanceToNext = useCallback(() => {
    const next = trialIndex + 1;
    if (next >= TOTAL_TRIALS) {
      const meanGoRT =
        goRTs.current.length > 0
          ? goRTs.current.reduce((a, b) => a + b, 0) / goRTs.current.length
          : 600;
      const goTrials = Math.round(TOTAL_TRIALS * GO_RATIO);
      const noGoTrials = TOTAL_TRIALS - goTrials;
      const hitRate = goRTs.current.length / goTrials;
      const falseAlarmRate = commissionErrors.current / noGoTrials;

      // d-prime approximation: Z(hitRate) - Z(falseAlarmRate)
      // We use composite score: lower is better
      // Commission errors are the key metric for impulse control
      const compositeScore = commissionErrors.current * 50 + meanGoRT * 0.5;

      setPhase("done");
      onComplete({
        rawScore: compositeScore,
        durationMs: Date.now() - startTimeRef.current,
        metadata: {
          meanGoRT: Math.round(meanGoRT),
          commissionErrors: commissionErrors.current,
          omissionErrors: omissionErrors.current,
          hitRate: Math.round(hitRate * 100),
          falseAlarmRate: Math.round(falseAlarmRate * 100),
          totalTrials: TOTAL_TRIALS,
        },
      });
    } else {
      setTrialIndex(next);
      respondedRef.current = false;
      setPhase("fixation");
      const fixDuration = FIXATION_MIN_MS + Math.random() * FIXATION_VAR_MS;
      timerRef.current = setTimeout(() => {
        stimStartRef.current = performance.now();
        setPhase("stimulus");
        // Auto-advance after stimulus duration if no response
        timerRef.current = setTimeout(() => {
          if (!respondedRef.current) {
            const trial = trialsRef.current[next];
            if (trial?.isGo) {
              omissionErrors.current++;
              setFeedbackText("太慢!");
              setFeedbackOk(false);
            } else {
              setFeedbackText("✓ 正确抑制");
              setFeedbackOk(true);
            }
            setPhase("feedback");
            timerRef.current = setTimeout(() => advanceToNext(), 300);
          }
        }, STIMULUS_MS);
      }, fixDuration);
    }
  }, [trialIndex, onComplete]);

  const startGame = useCallback(() => {
    trialsRef.current = generateTrials();
    startTimeRef.current = Date.now();
    goRTs.current = [];
    commissionErrors.current = 0;
    omissionErrors.current = 0;
    respondedRef.current = false;
    setTrialIndex(0);
    setPhase("fixation");
    const fixDuration = FIXATION_MIN_MS + Math.random() * FIXATION_VAR_MS;
    timerRef.current = setTimeout(() => {
      stimStartRef.current = performance.now();
      setPhase("stimulus");
      timerRef.current = setTimeout(() => {
        if (!respondedRef.current) {
          const trial = trialsRef.current[0];
          if (trial?.isGo) {
            omissionErrors.current++;
            setFeedbackText("太慢!");
            setFeedbackOk(false);
          } else {
            setFeedbackText("✓ 正确抑制");
            setFeedbackOk(true);
          }
          setPhase("feedback");
          timerRef.current = setTimeout(() => advanceToNext(), 300);
        }
      }, STIMULUS_MS);
    }, fixDuration);
  }, [advanceToNext]);

  const handlePress = useCallback(() => {
    if (phase !== "stimulus" || respondedRef.current) return;
    respondedRef.current = true;
    clearTimeout(timerRef.current);

    const rt = performance.now() - stimStartRef.current;

    if (currentTrial?.isGo) {
      goRTs.current.push(rt);
      setFeedbackText(`${Math.round(rt)}ms`);
      setFeedbackOk(true);
    } else {
      commissionErrors.current++;
      setFeedbackText("✗ 不该按!");
      setFeedbackOk(false);
    }

    setPhase("feedback");
    timerRef.current = setTimeout(() => advanceToNext(), 400);
  }, [phase, currentTrial, advanceToNext]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handlePress();
      }
    },
    [handlePress]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">Go/No-Go 冲动控制测试</h3>
          <p className="text-sm text-muted-foreground">
            🟢 绿色圆 → 立即按空格键或点击<br />
            🔴 红色圆 → 不要按! 忍住冲动
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            共 {TOTAL_TRIALS} 题，多数是绿色，少数红色陷阱
          </p>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 transition"
        >
          开始测试
        </button>
        <button onClick={onAbort} className="text-sm text-muted-foreground hover:text-foreground">
          放弃测试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <div className="flex justify-between w-full text-sm text-muted-foreground px-2">
        <span>第 {trialIndex + 1}/{TOTAL_TRIALS} 题</span>
        <span>误按: {commissionErrors.current}</span>
      </div>

      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${((trialIndex + 1) / TOTAL_TRIALS) * 100}%` }} />
      </div>

      <div
        onClick={handlePress}
        className="w-full aspect-video flex items-center justify-center bg-slate-900 rounded-xl min-h-[220px] cursor-pointer select-none"
      >
        {phase === "fixation" && <div className="text-4xl text-white/40">+</div>}
        {phase === "stimulus" && currentTrial && (
          <div
            className="w-28 h-28 md:w-36 md:h-36 rounded-full transition-transform animate-pulse"
            style={{
              backgroundColor: currentTrial.isGo ? "#22c55e" : "#ef4444",
              boxShadow: currentTrial.isGo
                ? "0 0 40px rgba(34,197,94,0.5)"
                : "0 0 40px rgba(239,68,68,0.5)",
            }}
          />
        )}
        {phase === "feedback" && (
          <div className={`text-2xl font-bold ${feedbackOk ? "text-green-400" : "text-red-400"}`}>
            {feedbackText}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        🟢 按空格/点击 | 🔴 不要按
      </p>

      <button onClick={onAbort} className="text-sm text-muted-foreground hover:text-foreground">
        放弃测试
      </button>
    </div>
  );
}
