"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";

/**
 * Go/No-Go Task — Impulse control paradigm (Donders 1969; Logan 1994)
 *
 * Green circle = press (Go), Red circle = withhold (No-Go).
 * 75% Go / 25% No-Go creates prepotent "press" response.
 *
 * Metrics: Commission errors (pressing on No-Go), Go RT, d-prime
 */

const PRACTICE_TRIALS = 5;
const SCORED_TRIALS = 40;
const TOTAL_TRIALS = PRACTICE_TRIALS + SCORED_TRIALS;
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
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [phase, setPhase] = useState<"idle" | "fixation" | "stimulus" | "feedback" | "practice-done" | "done">("idle");
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
      const scoredGoTrials = Math.round(SCORED_TRIALS * GO_RATIO);
      const scoredNoGoTrials = SCORED_TRIALS - scoredGoTrials;
      const hitRate = goRTs.current.length / scoredGoTrials;
      const falseAlarmRate = commissionErrors.current / scoredNoGoTrials;

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
          totalTrials: SCORED_TRIALS,
          practiceTrials: PRACTICE_TRIALS,
        },
      });
    } else if (next === PRACTICE_TRIALS) {
      // Transition from practice to scored phase
      setPhase("practice-done");
      timerRef.current = setTimeout(() => {
        setTrialIndex(next);
        respondedRef.current = false;
        setPhase("fixation");
        const fixDuration = FIXATION_MIN_MS + Math.random() * FIXATION_VAR_MS;
        timerRef.current = setTimeout(() => {
          stimStartRef.current = performance.now();
          setPhase("stimulus");
          timerRef.current = setTimeout(() => {
            if (!respondedRef.current) {
              const trial = trialsRef.current[next];
              if (trial?.isGo) {
                omissionErrors.current++;
                setFeedbackText(isZh ? "太慢!" : "Too slow!");
                setFeedbackOk(false);
              } else {
                setFeedbackText(isZh ? "✓ 正确抑制" : "✓ Correct inhibition");
                setFeedbackOk(true);
              }
              setPhase("feedback");
              timerRef.current = setTimeout(() => advanceToNext(), 300);
            }
          }, STIMULUS_MS);
        }, fixDuration);
      }, 1000);
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
              if (next >= PRACTICE_TRIALS) omissionErrors.current++;
              setFeedbackText(isZh ? "太慢!" : "Too slow!");
              setFeedbackOk(false);
            } else {
              setFeedbackText(isZh ? "✓ 正确抑制" : "✓ Correct inhibition");
              setFeedbackOk(true);
            }
            setPhase("feedback");
            timerRef.current = setTimeout(() => advanceToNext(), 300);
          }
        }, STIMULUS_MS);
      }, fixDuration);
    }
  }, [trialIndex, onComplete, isZh]);

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
            // Trial 0 is always practice, don't count errors
            setFeedbackText(isZh ? "太慢!" : "Too slow!");
            setFeedbackOk(false);
          } else {
            setFeedbackText(isZh ? "✓ 正确抑制" : "✓ Correct inhibition");
            setFeedbackOk(true);
          }
          setPhase("feedback");
          timerRef.current = setTimeout(() => advanceToNext(), 300);
        }
      }, STIMULUS_MS);
    }, fixDuration);
  }, [advanceToNext, isZh]);

  const handlePress = useCallback(() => {
    if (phase !== "stimulus" || respondedRef.current) return;
    respondedRef.current = true;
    clearTimeout(timerRef.current);

    const rt = performance.now() - stimStartRef.current;
    const isPractice = trialIndex < PRACTICE_TRIALS;

    if (currentTrial?.isGo) {
      if (!isPractice) goRTs.current.push(rt);
      setFeedbackText(`${Math.round(rt)}ms`);
      setFeedbackOk(true);
    } else {
      if (!isPractice) commissionErrors.current++;
      setFeedbackText(isZh ? "✗ 不该按!" : "✗ Should not press!");
      setFeedbackOk(false);
    }

    setPhase("feedback");
    timerRef.current = setTimeout(() => advanceToNext(), 400);
  }, [phase, currentTrial, advanceToNext, isZh, trialIndex]);

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
          <h3 className="text-lg font-bold">{isZh ? "Go/No-Go 冲动控制测试" : "Go/No-Go Impulse Control Test"}</h3>
          <p className="text-sm text-muted-foreground">
            {isZh ? (
              <>🟢 绿色圆 → 立即按空格键或点击<br />🔴 红色圆 → 不要按! 忍住冲动</>
            ) : (
              <>🟢 Green circle → Press SPACE or click immediately<br />🔴 Red circle → Do NOT press! Resist the urge</>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {isZh ? `共 ${TOTAL_TRIALS} 题，多数是绿色，少数红色陷阱` : `${TOTAL_TRIALS} trials — mostly green, with red traps`}
          </p>
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

  const isPractice = trialIndex < PRACTICE_TRIALS;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <div className="flex justify-between w-full text-sm text-muted-foreground px-2">
        <span>
          {isPractice
            ? isZh ? `练习 ${trialIndex + 1}/${PRACTICE_TRIALS}` : `Practice ${trialIndex + 1}/${PRACTICE_TRIALS}`
            : isZh ? `第 ${trialIndex + 1 - PRACTICE_TRIALS}/${SCORED_TRIALS} 题` : `Trial ${trialIndex + 1 - PRACTICE_TRIALS}/${SCORED_TRIALS}`}
        </span>
        {isPractice ? (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-md text-xs">
            {isZh ? "练习 — 不计分" : "Practice — not scored"}
          </span>
        ) : (
          <span>{isZh ? "误按:" : "Errors:"} {commissionErrors.current}</span>
        )}
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
        {phase === "practice-done" && (
          <div className="text-xl font-bold text-primary animate-pulse">
            {isZh ? "开始计分..." : "Now scoring..."}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {isZh ? "🟢 按空格/点击 | 🔴 不要按" : "🟢 Press SPACE/Click | 🔴 Don't press"}
      </p>

      <button onClick={onAbort} className="text-sm text-muted-foreground hover:text-foreground">
        {isZh ? "放弃测试" : "Abort Test"}
      </button>
    </div>
  );
}
