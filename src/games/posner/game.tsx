"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";
import { playSound } from "@/lib/audio-fx";
import { ParticleBurst, ComboCounter } from "@/components/game-fx";

/**
 * Posner Cueing Task (Posner 1980; Posner & Petersen 1990).
 *
 * Trial structure:
 *   1. Fixation  (500ms): center "+"
 *   2. Cue       (100ms): arrow or flash at left/right box
 *   3. SOA       (200ms): fixation only
 *   4. Target    (up to 2000ms): "*" appears in left or right box
 *   5. Response  : user presses LEFT/RIGHT arrow or taps box
 *   6. ITI       (800-1200ms jittered): inter-trial interval
 *
 * 4 practice trials (NOT scored) + 40 scored trials (32 valid + 8 invalid).
 */

type Phase =
  | "waiting"
  | "practice-intro"
  | "fixation"
  | "cue"
  | "soa"
  | "target"
  | "feedback"
  | "iti"
  | "done";

type Side = "left" | "right";
type TrialType = "valid" | "invalid";

interface TrialSpec {
  cueSide: Side;
  targetSide: Side;
  type: TrialType;
}

interface TrialResult extends TrialSpec {
  rt: number; // ms from target onset to response; MAX_RT_MS if timeout
  correct: boolean;
  responded: boolean;
}

const PRACTICE_TRIALS = 4;
const SCORED_TRIALS = 40;
const VALID_RATIO = 0.8;

const FIXATION_MS = 500;
const CUE_MS = 100;
const SOA_MS = 200;
const MAX_RT_MS = 2000;
const FEEDBACK_MS = 300;
const ITI_MIN_MS = 800;
const ITI_MAX_MS = 1200;

/** Build a shuffled trial list with the requested valid/invalid ratio */
function buildTrialList(count: number, validRatio: number): TrialSpec[] {
  const validCount = Math.round(count * validRatio);
  const invalidCount = count - validCount;
  const trials: TrialSpec[] = [];

  for (let i = 0; i < validCount; i++) {
    const side: Side = Math.random() < 0.5 ? "left" : "right";
    trials.push({ cueSide: side, targetSide: side, type: "valid" });
  }
  for (let i = 0; i < invalidCount; i++) {
    const cue: Side = Math.random() < 0.5 ? "left" : "right";
    const target: Side = cue === "left" ? "right" : "left";
    trials.push({ cueSide: cue, targetSide: target, type: "invalid" });
  }

  // Fisher-Yates shuffle
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }
  return trials;
}

function jitter(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export default function PosnerGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<Phase>("waiting");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [cueSide, setCueSide] = useState<Side>("left");
  const [targetSide, setTargetSide] = useState<Side>("left");
  // Displayed counters — mirror the refs below for UI rendering
  const [scoredCount, setScoredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [practiceDone, setPracticeDone] = useState(0);
  const [isPracticeDisplay, setIsPracticeDisplay] = useState(true);
  // Polish state — streak tracking + block-end celebration
  const [streak, setStreak] = useState(0);
  const [celebrateTrigger, setCelebrateTrigger] = useState(0);

  // Authoritative mutable state — survives closure staleness
  const trialListRef = useRef<TrialSpec[]>([]);
  const trialIndexRef = useRef(0);
  const isPracticeRef = useRef(true);
  const practiceCountRef = useRef(0);
  const scoredResultsRef = useRef<TrialResult[]>([]);
  const currentTrialRef = useRef<TrialSpec | null>(null);
  const targetOnsetRef = useRef(0);
  const respondedRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const lastResponseTimeRef = useRef(0);
  const finishedRef = useRef(false);

  // Multiple timers — all cleaned up on unmount
  const fixationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (fixationTimerRef.current) clearTimeout(fixationTimerRef.current);
    if (cueTimerRef.current) clearTimeout(cueTimerRef.current);
    if (soaTimerRef.current) clearTimeout(soaTimerRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  /**
   * Compute validity effect and fire onComplete.
   * Guarded by ref flag to prevent double-fires (React Strict Mode etc).
   */
  const finishGame = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const allResults = scoredResultsRef.current;

    const validCorrect = allResults.filter(
      (t) => t.type === "valid" && t.correct && t.responded
    );
    const invalidCorrect = allResults.filter(
      (t) => t.type === "invalid" && t.correct && t.responded
    );

    const meanValidRT =
      validCorrect.length > 0
        ? validCorrect.reduce((s, t) => s + t.rt, 0) / validCorrect.length
        : 0;
    const meanInvalidRT =
      invalidCorrect.length > 0
        ? invalidCorrect.reduce((s, t) => s + t.rt, 0) / invalidCorrect.length
        : 0;

    const validityEffect = meanInvalidRT - meanValidRT;
    const totalCorrect = allResults.filter((t) => t.correct).length;
    const totalResponded = allResults.filter((t) => t.responded).length;
    const accuracy =
      allResults.length > 0 ? totalCorrect / allResults.length : 0;

    onComplete({
      rawScore: Math.round(validityEffect),
      durationMs: Date.now() - startTimeRef.current,
      metadata: {
        validityEffect: Math.round(validityEffect),
        meanValidRT: Math.round(meanValidRT),
        meanInvalidRT: Math.round(meanInvalidRT),
        accuracy,
        totalCorrect,
        totalResponded,
        totalTrials: allResults.length,
        validTrials: allResults.filter((t) => t.type === "valid").length,
        invalidTrials: allResults.filter((t) => t.type === "invalid").length,
        allTrials: allResults,
      },
    });
  }, [onComplete]);

  /** Run a single trial: fixation -> cue -> SOA -> target */
  const startTrial = useCallback((index: number) => {
    respondedRef.current = false;
    const trial = trialListRef.current[index];
    currentTrialRef.current = trial;
    trialIndexRef.current = index;
    setCueSide(trial.cueSide);
    setTargetSide(trial.targetSide);

    // 1. Fixation
    setPhase("fixation");
    fixationTimerRef.current = setTimeout(() => {
      // 2. Cue
      setPhase("cue");
      cueTimerRef.current = setTimeout(() => {
        // 3. SOA (back to fixation-only state)
        setPhase("soa");
        soaTimerRef.current = setTimeout(() => {
          // 4. Target
          setPhase("target");
          targetOnsetRef.current = performance.now();
          timeoutTimerRef.current = setTimeout(() => {
            if (!respondedRef.current) {
              respondedRef.current = true;
              handleResponseRef.current(null);
            }
          }, MAX_RT_MS);
        }, SOA_MS);
      }, CUE_MS);
    }, FIXATION_MS);
  }, []);

  /** Move to the next trial; transitions practice -> scored when appropriate */
  const advanceTrial = useCallback(() => {
    const nextIndex = trialIndexRef.current + 1;
    if (isPracticeRef.current && nextIndex >= PRACTICE_TRIALS) {
      // Transition: practice complete, prepare scored block
      isPracticeRef.current = false;
      setIsPracticeDisplay(false);
      trialListRef.current = buildTrialList(SCORED_TRIALS, VALID_RATIO);
      trialIndexRef.current = 0;
      setPhase("practice-intro");
      return;
    }
    startTrial(nextIndex);
  }, [startTrial]);

  /** Handle a response (from keyboard/tap) or a timeout (chosenSide=null) */
  const handleResponse = useCallback(
    (chosenSide: Side | null) => {
      const trial = currentTrialRef.current;
      if (!trial) return;
      const responded = chosenSide !== null;
      const rt = responded
        ? performance.now() - targetOnsetRef.current
        : MAX_RT_MS;
      const correct = chosenSide === trial.targetSide;

      const result: TrialResult = {
        ...trial,
        rt: Math.round(rt),
        correct,
        responded,
      };

      setLastCorrect(correct);
      setPhase("feedback");
      // Feedback-phase audio (after response recorded — Tier B safe)
      if (responded) {
        playSound(correct ? "success" : "error");
      } else {
        // Timeout counts as incorrect
        playSound("error");
      }
      // Streak tracking (only for scored trials, not practice)
      if (!isPracticeRef.current) {
        setStreak((s) => (correct ? s + 1 : 0));
      }

      feedbackTimerRef.current = setTimeout(() => {
        if (!isPracticeRef.current) {
          // Scored trial
          scoredResultsRef.current = [...scoredResultsRef.current, result];
          setScoredCount(scoredResultsRef.current.length);
          if (correct) {
            setCorrectCount((c) => c + 1);
          }

          if (scoredResultsRef.current.length >= SCORED_TRIALS) {
            setPhase("done");
            // Block-end celebration: particle burst + success chime
            setCelebrateTrigger((t) => t + 1);
            playSound("success");
            itiTimerRef.current = setTimeout(() => {
              finishGame();
            }, 400);
            return;
          }
        } else {
          // Practice trial
          practiceCountRef.current += 1;
          setPracticeDone(practiceCountRef.current);
        }

        // Schedule next trial after jittered ITI
        const iti = jitter(ITI_MIN_MS, ITI_MAX_MS);
        setPhase("iti");
        itiTimerRef.current = setTimeout(() => {
          advanceTrial();
        }, iti);
      }, FEEDBACK_MS);
    },
    [advanceTrial, finishGame]
  );

  // Stable ref for handleResponse so timer callbacks inside startTrial
  // always reach the latest implementation even after state changes.
  const handleResponseRef = useRef(handleResponse);
  useEffect(() => {
    handleResponseRef.current = handleResponse;
  }, [handleResponse]);

  const handleSide = useCallback(
    (side: Side) => {
      if (phase !== "target" || respondedRef.current) return;
      const now = performance.now();
      if (now - lastResponseTimeRef.current < 150) return;
      respondedRef.current = true;
      lastResponseTimeRef.current = now;
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      // Click sound at response time (Tier B safe — after response is registered)
      playSound("click");
      handleResponseRef.current(side);
    },
    [phase]
  );

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSide("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSide("right");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSide]);

  const handleStartPractice = useCallback(() => {
    startTimeRef.current = Date.now();
    trialListRef.current = buildTrialList(PRACTICE_TRIALS, VALID_RATIO);
    isPracticeRef.current = true;
    practiceCountRef.current = 0;
    scoredResultsRef.current = [];
    finishedRef.current = false;
    setIsPracticeDisplay(true);
    setPracticeDone(0);
    setScoredCount(0);
    setCorrectCount(0);
    setStreak(0);
    trialIndexRef.current = 0;
    startTrial(0);
  }, [startTrial]);

  const handleStartScored = useCallback(() => {
    // trialListRef was already reset to the scored list in advanceTrial
    startTrial(0);
  }, [startTrial]);

  const progress = scoredCount / SCORED_TRIALS;

  /** Render left/right boxes. Cue visibility and target visibility are controlled. */
  const renderBoxes = (opts: {
    showCue: boolean;
    showTarget: boolean;
    cueSideDisplay?: Side;
    targetSideDisplay?: Side;
  }) => {
    const {
      showCue,
      showTarget,
      cueSideDisplay,
      targetSideDisplay,
    } = opts;
    return (
      <div className="flex items-center justify-center gap-8 sm:gap-16 w-full">
        {(["left", "right"] as Side[]).map((side) => {
          const isCued = showCue && cueSideDisplay === side;
          const hasTarget = showTarget && targetSideDisplay === side;
          return (
            <button
              key={side}
              onClick={() => handleSide(side)}
              disabled={phase !== "target"}
              aria-label={
                side === "left"
                  ? isZh
                    ? "\u5DE6\u76EE\u6807"
                    : "left target"
                  : isZh
                    ? "\u53F3\u76EE\u6807"
                    : "right target"
              }
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 transition-all ${
                isCued
                  ? "border-yellow-300 bg-yellow-300/20 shadow-[0_0_20px_rgba(253,224,71,0.6)]"
                  : "border-slate-500 bg-slate-700/40"
              } ${phase === "target" ? "cursor-pointer hover:border-slate-300 active:scale-95" : "cursor-default"}`}
            >
              {hasTarget && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold">
                  *
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Progress bar (only during scored trials) */}
      {!isPracticeDisplay &&
        phase !== "practice-intro" &&
        phase !== "waiting" && (
          <>
            <div className="flex justify-between w-full max-w-lg text-sm text-muted-foreground px-2">
              <span>
                {scoredCount}/{SCORED_TRIALS}
              </span>
              <span>
                {isZh ? "\u6B63\u786E" : "Correct"}: {correctCount}
              </span>
            </div>
            <div className="w-full max-w-lg h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </>
        )}

      {/* Practice header */}
      {isPracticeDisplay && phase !== "waiting" && (
        <div className="w-full max-w-lg flex justify-between text-sm px-2">
          <span className="font-bold text-yellow-400">
            {isZh
              ? "\u7EC3\u4E60 \u2014 \u4E0D\u8BA1\u5206"
              : "Practice \u2014 not scored"}
          </span>
          <span className="text-muted-foreground">
            {practiceDone}/{PRACTICE_TRIALS}
          </span>
        </div>
      )}

      {/* Game area */}
      <div className="w-full max-w-lg aspect-video rounded-xl flex flex-col items-center justify-center bg-slate-800 select-none relative overflow-hidden">
        {/* Combo counter — only during ITI when streak >= 3 */}
        <ComboCounter
          combo={streak}
          x={240}
          y={60}
          enabled={phase === "iti" && streak >= 3 && !isPracticeDisplay}
        />
        {/* Block-end particle burst — only at done */}
        <ParticleBurst
          trigger={celebrateTrigger}
          x={240}
          y={120}
          color="#FFB800"
          count={28}
          enabled={phase === "done" && celebrateTrigger > 0}
        />
        {phase === "waiting" && (
          <div className="text-center px-4 py-6">
            <div className="text-4xl mb-3">{"\uD83C\uDFAF"}</div>
            <p className="text-white text-lg font-bold mb-2">
              {isZh
                ? "\u6CE8\u610F\u529B\u805A\u7126\u6D4B\u8BD5"
                : "Attention Focus Test"}
            </p>
            <p className="text-muted-foreground text-sm mb-1">
              {isZh
                ? "\u76EE\u89C6\u4E2D\u95F4\u7684\u201C+\u201D\uFF0C\u53E6\u4E00\u4E2A\u65B9\u5757\u4F1A\u95EA\u5149\u3002"
                : 'Keep your eyes on the "+" in the center. A box will briefly flash (cue).'}
            </p>
            <p className="text-muted-foreground text-sm mb-1">
              {isZh
                ? "\u7136\u540E\u201C*\u201D\u4F1A\u51FA\u73B0\u5728\u5DE6\u6216\u53F3\u65B9\u5757\u3002"
                : 'Then a "*" appears in the left or right box.'}
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              {isZh
                ? "\u6309 \u2190 \u6216 \u2192 \uFF08\u6216\u70B9\u51FB\u65B9\u5757\uFF09\u6307\u793A\u201C*\u201D\u7684\u4F4D\u7F6E\u3002\u7EBF\u7D22\u4F1A\u8BEF\u5BFC\u4F60\u2014\u5FFD\u7565\u5B83\u3002"
                : 'Press \u2190 or \u2192 (or tap a box) to indicate where the "*" is. The cue may mislead \u2014 ignore it.'}
            </p>
            <button
              onClick={handleStartPractice}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              {isZh ? "\u5F00\u59CB\u7EC3\u4E60" : "Start Practice"}
            </button>
          </div>
        )}

        {phase === "practice-intro" && (
          <div className="text-center px-4 py-6">
            <div className="text-3xl mb-3">{"\u2705"}</div>
            <p className="text-white text-lg font-bold mb-2">
              {isZh ? "\u7EC3\u4E60\u5B8C\u6210" : "Practice Complete"}
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              {isZh
                ? `\u73B0\u5728\u5F00\u59CB\u6B63\u5F0F\u6D4B\u8BD5\uFF1A${SCORED_TRIALS} \u8BD5\u6B21`
                : `Now starting the real test: ${SCORED_TRIALS} trials.`}
            </p>
            <button
              onClick={handleStartScored}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              {isZh ? "\u5F00\u59CB\u6D4B\u8BD5" : "Start Test"}
            </button>
          </div>
        )}

        {(phase === "fixation" ||
          phase === "cue" ||
          phase === "soa" ||
          phase === "target" ||
          phase === "iti") && (
          <div className="relative flex flex-col items-center justify-center w-full h-full">
            <div className="text-white text-4xl sm:text-5xl font-bold mb-4">
              +
            </div>
            {renderBoxes({
              showCue: phase === "cue",
              showTarget: phase === "target",
              cueSideDisplay: cueSide,
              targetSideDisplay: targetSide,
            })}
          </div>
        )}

        {phase === "feedback" && (
          <div className="relative flex flex-col items-center justify-center w-full h-full">
            <div className="text-white text-4xl sm:text-5xl font-bold mb-4">
              +
            </div>
            {renderBoxes({
              showCue: false,
              showTarget: false,
            })}
            <div
              className={`absolute bottom-4 text-lg font-bold ${
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
          </div>
        )}

        {phase === "done" && (
          <div className="text-white text-xl font-bold">
            {isZh ? "\u6D4B\u8BD5\u5B8C\u6210\uFF01" : "Test Complete!"}
          </div>
        )}
      </div>

      {/* Mobile tap buttons — shown while test is active */}
      {(phase === "fixation" ||
        phase === "cue" ||
        phase === "soa" ||
        phase === "target" ||
        phase === "feedback" ||
        phase === "iti") && (
        <div className="flex gap-4 w-full max-w-lg">
          <button
            onClick={() => handleSide("left")}
            disabled={phase !== "target"}
            className={`flex-1 py-4 text-white text-2xl font-bold rounded-xl transition-all ${
              phase === "target"
                ? "bg-slate-700 hover:bg-slate-600 active:scale-[0.97]"
                : "bg-slate-800 opacity-50 cursor-not-allowed"
            }`}
          >
            {"\u2190"}
          </button>
          <button
            onClick={() => handleSide("right")}
            disabled={phase !== "target"}
            className={`flex-1 py-4 text-white text-2xl font-bold rounded-xl transition-all ${
              phase === "target"
                ? "bg-slate-700 hover:bg-slate-600 active:scale-[0.97]"
                : "bg-slate-800 opacity-50 cursor-not-allowed"
            }`}
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
