"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";

type Phase = "waiting" | "fixation" | "stimulus" | "feedback" | "practice-done" | "done";
type Direction = "left" | "right";
type Condition = "congruent" | "incongruent";

interface Trial {
  condition: Condition;
  targetDirection: Direction;
  flankerDirection: Direction;
  rt: number;
  correct: boolean;
}

const PRACTICE_TRIALS = 5;
const SCORED_TRIALS = 40;
const TOTAL_TRIALS = PRACTICE_TRIALS + SCORED_TRIALS;
const CONGRUENT_COUNT = 20;
const FIXATION_MS = 500;
const FEEDBACK_MS = 400;
const MAX_RT_MS = 2000;
const PRACTICE_DONE_MS = 1000;

/** Build a shuffled trial list: PRACTICE_TRIALS practice + 20 congruent + 20 incongruent scored */
function buildTrialList(): Array<{
  condition: Condition;
  targetDirection: Direction;
  flankerDirection: Direction;
}> {
  const scored: Array<{
    condition: Condition;
    targetDirection: Direction;
    flankerDirection: Direction;
  }> = [];

  for (let i = 0; i < CONGRUENT_COUNT; i++) {
    const dir: Direction = Math.random() < 0.5 ? "left" : "right";
    scored.push({ condition: "congruent", targetDirection: dir, flankerDirection: dir });
  }

  const incongruentCount = SCORED_TRIALS - CONGRUENT_COUNT;
  for (let i = 0; i < incongruentCount; i++) {
    const target: Direction = Math.random() < 0.5 ? "left" : "right";
    const flanker: Direction = target === "left" ? "right" : "left";
    scored.push({ condition: "incongruent", targetDirection: target, flankerDirection: flanker });
  }

  // Fisher-Yates shuffle for scored trials
  for (let i = scored.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [scored[i], scored[j]] = [scored[j], scored[i]];
  }

  // Practice trials: mix congruent and incongruent for the player to learn both
  const practice: Array<{
    condition: Condition;
    targetDirection: Direction;
    flankerDirection: Direction;
  }> = [];
  for (let i = 0; i < PRACTICE_TRIALS; i++) {
    const target: Direction = Math.random() < 0.5 ? "left" : "right";
    const isCongruent = i % 2 === 0;
    const flanker: Direction = isCongruent ? target : (target === "left" ? "right" : "left");
    practice.push({
      condition: isCongruent ? "congruent" : "incongruent",
      targetDirection: target,
      flankerDirection: flanker,
    });
  }

  return [...practice, ...scored];
}

function arrowChar(dir: Direction): string {
  return dir === "left" ? "\u2190" : "\u2192";
}

function buildStimulusDisplay(
  targetDir: Direction,
  flankerDir: Direction
): string {
  const f = arrowChar(flankerDir);
  const t = arrowChar(targetDir);
  return `${f} ${f} ${t} ${f} ${f}`;
}

export default function FlankerGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<Phase>("waiting");
  const [trialIndex, setTrialIndex] = useState(0);
  const [results, setResults] = useState<Trial[]>([]);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [stimulus, setStimulus] = useState("");
  const [currentTarget, setCurrentTarget] = useState<Direction>("left");

  const trialListRef = useRef<ReturnType<typeof buildTrialList>>([]);
  const stimulusTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const startTimeRef = useRef(Date.now());
  const respondedRef = useRef(false);
  const lastResponseTimeRef = useRef(0);

  const startTrial = useCallback((index: number) => {
    respondedRef.current = false;
    setPhase("fixation");

    timerRef.current = setTimeout(() => {
      const trial = trialListRef.current[index];
      const display = buildStimulusDisplay(
        trial.targetDirection,
        trial.flankerDirection
      );
      setStimulus(display);
      setCurrentTarget(trial.targetDirection);
      stimulusTimeRef.current = performance.now();
      setPhase("stimulus");

      // Auto-timeout after MAX_RT_MS
      timeoutTimerRef.current = setTimeout(() => {
        if (!respondedRef.current) {
          respondedRef.current = true;
          handleResponse(index, null);
        }
      }, MAX_RT_MS);
    }, FIXATION_MS);
  }, []);

  const handleResponse = useCallback(
    (index: number, chosenDirection: Direction | null) => {
      const trial = trialListRef.current[index];
      const rt =
        chosenDirection !== null
          ? performance.now() - stimulusTimeRef.current
          : MAX_RT_MS;
      const correct = chosenDirection === trial.targetDirection;

      const trialResult: Trial = {
        condition: trial.condition,
        targetDirection: trial.targetDirection,
        flankerDirection: trial.flankerDirection,
        rt: Math.round(rt),
        correct,
      };

      setLastCorrect(correct);
      setResults((prev) => {
        const updated = [...prev, trialResult];

        if (updated.length >= TOTAL_TRIALS) {
          // All trials done — compute flanker effect
          setPhase("done");
          setTimeout(() => {
            // Only pass scored trials (exclude practice) to finishGame
            finishGame(updated.slice(PRACTICE_TRIALS));
          }, 800);
        }

        return updated;
      });

      if (index + 1 < TOTAL_TRIALS) {
        setPhase("feedback");
        // After last practice trial, show "Now scoring..." transition
        if (index + 1 === PRACTICE_TRIALS) {
          timerRef.current = setTimeout(() => {
            setPhase("practice-done");
            timerRef.current = setTimeout(() => {
              const nextIndex = index + 1;
              setTrialIndex(nextIndex);
              startTrial(nextIndex);
            }, PRACTICE_DONE_MS);
          }, FEEDBACK_MS);
        } else {
          timerRef.current = setTimeout(() => {
            const nextIndex = index + 1;
            setTrialIndex(nextIndex);
            startTrial(nextIndex);
          }, FEEDBACK_MS);
        }
      }
    },
    [startTrial]
  );

  const finishGame = useCallback(
    (allResults: Trial[]) => {
      const congruentCorrect = allResults.filter(
        (t) => t.condition === "congruent" && t.correct
      );
      const incongruentCorrect = allResults.filter(
        (t) => t.condition === "incongruent" && t.correct
      );

      const meanCongruent =
        congruentCorrect.length > 0
          ? congruentCorrect.reduce((sum, t) => sum + t.rt, 0) /
            congruentCorrect.length
          : 0;
      const meanIncongruent =
        incongruentCorrect.length > 0
          ? incongruentCorrect.reduce((sum, t) => sum + t.rt, 0) /
            incongruentCorrect.length
          : 0;

      const flankerEffect = meanIncongruent - meanCongruent;
      const totalCorrect = allResults.filter((t) => t.correct).length;
      const accuracy = totalCorrect / allResults.length;

      onComplete({
        rawScore: Math.round(flankerEffect),
        durationMs: Date.now() - startTimeRef.current,
        metadata: {
          flankerEffect: Math.round(flankerEffect),
          meanCongruentRT: Math.round(meanCongruent),
          meanIncongruentRT: Math.round(meanIncongruent),
          accuracy,
          totalCorrect,
          totalTrials: allResults.length,
          congruentCorrect: congruentCorrect.length,
          incongruentCorrect: incongruentCorrect.length,
          allTrials: allResults,
        },
      });
    },
    [onComplete]
  );

  const handleDirection = useCallback(
    (dir: Direction) => {
      if (phase !== "stimulus" || respondedRef.current) return;
      const now = performance.now();
      if (now - lastResponseTimeRef.current < 200) return;
      respondedRef.current = true;
      lastResponseTimeRef.current = now;
      clearTimeout(timeoutTimerRef.current);
      handleResponse(trialIndex, dir);
    },
    [phase, trialIndex, handleResponse]
  );

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handleDirection("left");
      } else if (e.key === "ArrowRight") {
        handleDirection("right");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDirection]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(timeoutTimerRef.current);
    };
  }, []);

  const handleStart = useCallback(() => {
    startTimeRef.current = Date.now();
    trialListRef.current = buildTrialList();
    setTrialIndex(0);
    setResults([]);
    startTrial(0);
  }, [startTrial]);

  const progress = results.length / TOTAL_TRIALS;
  const scoredResults = results.slice(PRACTICE_TRIALS);
  const correctCount = scoredResults.filter((r) => r.correct).length;
  const isPractice = trialIndex < PRACTICE_TRIALS;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Progress bar */}
      <div className="flex justify-between w-full max-w-lg text-sm text-muted-foreground px-2">
        <span>
          {isPractice
            ? isZh ? `练习 ${trialIndex + 1}/${PRACTICE_TRIALS}` : `Practice ${trialIndex + 1}/${PRACTICE_TRIALS}`
            : `${Math.max(0, results.length - PRACTICE_TRIALS)}/${SCORED_TRIALS}`}
        </span>
        {isPractice ? (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-md text-xs">
            {isZh ? "练习 — 不计分" : "Practice — not scored"}
          </span>
        ) : (
          <span>
            {isZh ? "正确" : "Correct"}: {correctCount}
          </span>
        )}
      </div>
      <div className="w-full max-w-lg h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Game area */}
      <div className="w-full max-w-lg aspect-video rounded-xl flex flex-col items-center justify-center bg-slate-800 select-none relative overflow-hidden">
        {phase === "waiting" && (
          <div className="text-center px-4">
            <div className="text-6xl mb-4">
              {"\u2190 \u2190 \u2192 \u2190 \u2190"}
            </div>
            <p className="text-white text-lg font-bold mb-2">
              {isZh
                ? "\u770B\u4E2D\u95F4\u7BAD\u5934\uFF0C\u6309\u5B83\u6307\u5411\u7684\u65B9\u5411"
                : "Look at the CENTER arrow. Press its direction."}
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              {isZh
                ? "\u5FFD\u7565\u4E24\u4FA7\u5E72\u6270\u7BAD\u5934\uFF0C\u53EA\u770B\u4E2D\u95F4"
                : "Ignore the surrounding arrows. Focus on the middle one."}
            </p>
            <button
              onClick={handleStart}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              {isZh ? "\u5F00\u59CB\u6D4B\u8BD5" : "Start Test"}
            </button>
          </div>
        )}

        {phase === "fixation" && (
          <div className="text-white text-6xl font-bold">+</div>
        )}

        {phase === "stimulus" && (
          <div className="text-white text-5xl sm:text-6xl font-mono tracking-widest">
            {stimulus}
          </div>
        )}

        {phase === "feedback" && (
          <div
            className={`text-2xl font-bold ${
              lastCorrect ? "text-green-400" : "text-red-400"
            }`}
          >
            {lastCorrect
              ? isZh
                ? "\u2713 \u6B63\u786E"
                : "\u2713 Correct"
              : isZh
                ? "\u2717 \u9519\u8BEF"
                : "\u2717 Wrong"}
          </div>
        )}

        {phase === "practice-done" && (
          <div className="text-xl font-bold text-primary animate-pulse">
            {isZh ? "开始计分..." : "Now scoring..."}
          </div>
        )}

        {phase === "done" && (
          <div className="text-white text-xl font-bold">
            {isZh ? "\u6D4B\u8BD5\u5B8C\u6210\uFF01" : "Test Complete!"}
          </div>
        )}
      </div>

      {/* Left / Right buttons for mobile */}
      {(phase === "stimulus" || phase === "fixation") && (
        <div className="flex gap-4 w-full max-w-lg">
          <button
            onClick={() => handleDirection("left")}
            className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 active:scale-[0.97] text-white text-2xl font-bold rounded-xl transition-all"
          >
            {"\u2190"}
          </button>
          <button
            onClick={() => handleDirection("right")}
            className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 active:scale-[0.97] text-white text-2xl font-bold rounded-xl transition-all"
          >
            {"\u2192"}
          </button>
        </div>
      )}

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {isZh ? "\u653E\u5F03\u6D4B\u8BD5" : "Abort Test"}
      </button>
    </div>
  );
}
