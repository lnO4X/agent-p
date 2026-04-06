"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";

const GRID_SIZE = 3;
const N = 2; // 2-back
const TOTAL_TRIALS = 30;
const TRIAL_DURATION_MS = 1500;
const MATCH_RATIO = 0.33; // ~33% of scorable trials are matches

type Phase = "idle" | "showing" | "responding" | "feedback" | "done";

interface TrialResult {
  isMatch: boolean;
  responded: boolean;
  responseCorrect: boolean;
}

/** Generate a sequence of cell positions (0-8) with ~33% matches after trial N */
function generateSequence(length: number, n: number): number[] {
  const seq: number[] = [];
  const totalCells = GRID_SIZE * GRID_SIZE;

  // First N trials: random, no match possible
  for (let i = 0; i < n; i++) {
    seq.push(Math.floor(Math.random() * totalCells));
  }

  // Remaining trials: decide match or not
  for (let i = n; i < length; i++) {
    const isMatch = Math.random() < MATCH_RATIO;
    if (isMatch) {
      seq.push(seq[i - n]);
    } else {
      // Pick a position different from n-back
      let pos: number;
      do {
        pos = Math.floor(Math.random() * totalCells);
      } while (pos === seq[i - n]);
      seq.push(pos);
    }
  }

  return seq;
}

export default function NBackGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<Phase>("idle");
  const [trialIndex, setTrialIndex] = useState(0);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [results, setResults] = useState<TrialResult[]>([]);

  const sequenceRef = useRef<number[]>([]);
  const trialTimerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const startTimeRef = useRef(0);
  const respondedRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const finishGame = useCallback(
    (allResults: TrialResult[]) => {
      // Only score trials from index N onward (first N have no n-back reference)
      const scorable = allResults.slice(N);
      const correct = scorable.filter((r) => r.responseCorrect).length;
      const accuracy = scorable.length > 0
        ? Math.round((correct / scorable.length) * 1000) / 10
        : 0;

      // d-prime components for metadata
      const matches = scorable.filter((r) => r.isMatch);
      const nonMatches = scorable.filter((r) => !r.isMatch);
      const hits = matches.filter((r) => r.responded).length;
      const misses = matches.filter((r) => !r.responded).length;
      const falseAlarms = nonMatches.filter((r) => r.responded).length;
      const correctRejections = nonMatches.filter((r) => !r.responded).length;

      const hitRate = matches.length > 0 ? hits / matches.length : 0;
      const falseAlarmRate = nonMatches.length > 0
        ? falseAlarms / nonMatches.length
        : 0;

      onComplete({
        rawScore: accuracy,
        durationMs: Date.now() - startTimeRef.current,
        metadata: {
          n: N,
          totalTrials: TOTAL_TRIALS,
          scorableTrials: scorable.length,
          accuracy,
          hits,
          misses,
          falseAlarms,
          correctRejections,
          hitRate,
          falseAlarmRate,
          dPrimeApprox: Math.round((hitRate - falseAlarmRate) * 100) / 100,
        },
      });
    },
    [onComplete]
  );

  const advanceTrial = useCallback(
    (currentResults: TrialResult[]) => {
      const nextIndex = currentResults.length;

      if (nextIndex >= TOTAL_TRIALS) {
        setPhase("done");
        setActiveCell(null);
        finishGame(currentResults);
        return;
      }

      // Show next cell
      respondedRef.current = false;
      setTrialIndex(nextIndex);
      setActiveCell(sequenceRef.current[nextIndex]);
      setPhase("showing");

      // After TRIAL_DURATION_MS, if no response, record as no-response
      trialTimerRef.current = setTimeout(() => {
        if (phaseRef.current !== "showing") return;

        const isMatch = nextIndex >= N &&
          sequenceRef.current[nextIndex] === sequenceRef.current[nextIndex - N];
        const isScorable = nextIndex >= N;
        const result: TrialResult = {
          isMatch,
          responded: false,
          responseCorrect: isScorable ? !isMatch : true,
        };

        const updated = [...currentResults, result];
        setResults(updated);

        // Brief feedback for missed matches
        if (isScorable && isMatch) {
          setFeedbackType("incorrect");
          setPhase("feedback");
          feedbackTimerRef.current = setTimeout(() => {
            advanceTrial(updated);
          }, 400);
        } else {
          advanceTrial(updated);
        }
      }, TRIAL_DURATION_MS);
    },
    [finishGame]
  );

  const startGame = useCallback(() => {
    const seq = generateSequence(TOTAL_TRIALS, N);
    sequenceRef.current = seq;
    startTimeRef.current = Date.now();
    setResults([]);
    setTrialIndex(0);
    advanceTrial([]);
  }, [advanceTrial]);

  const handleResponse = useCallback(
    (playerSaysMatch: boolean) => {
      if (phase !== "showing") return;
      if (respondedRef.current) return;
      respondedRef.current = true;

      clearTimeout(trialTimerRef.current);

      const isMatch = trialIndex >= N &&
        sequenceRef.current[trialIndex] ===
          sequenceRef.current[trialIndex - N];
      const isScorable = trialIndex >= N;

      let responseCorrect: boolean;
      if (!isScorable) {
        // First N trials: any response is fine (no penalty)
        responseCorrect = true;
      } else {
        responseCorrect = playerSaysMatch === isMatch;
      }

      const result: TrialResult = {
        isMatch,
        responded: true,
        responseCorrect,
      };

      const updated = [...results, result];
      setResults(updated);

      // Show feedback
      setFeedbackType(responseCorrect ? "correct" : "incorrect");
      setPhase("feedback");

      feedbackTimerRef.current = setTimeout(() => {
        advanceTrial(updated);
      }, 400);
    },
    [phase, trialIndex, results, advanceTrial]
  );

  // Keyboard support: M for match, N for no-match
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === "showing") {
        if (e.key === "m" || e.key === "M") {
          handleResponse(true);
        } else if (e.key === "n" || e.key === "N") {
          handleResponse(false);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleResponse]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      clearTimeout(trialTimerRef.current);
      clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const scorableResults = results.slice(N);
  const correctCount = scorableResults.filter((r) => r.responseCorrect).length;
  const currentAccuracy = scorableResults.length > 0
    ? Math.round((correctCount / scorableResults.length) * 100)
    : 0;

  const isScorable = trialIndex >= N;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Header */}
      <div className="flex justify-between w-full max-w-sm text-sm text-muted-foreground px-2">
        <span>
          {isZh ? "试次" : "Trial"} {Math.min(trialIndex + 1, TOTAL_TRIALS)}/
          {TOTAL_TRIALS}
        </span>
        <span>
          {isZh ? "2-Back" : "2-Back"}
          {scorableResults.length > 0 && ` · ${currentAccuracy}%`}
        </span>
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-sm aspect-square">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const isActive = activeCell === i && (phase === "showing" || phase === "feedback");
          const feedbackBorder =
            phase === "feedback" && isActive && feedbackType === "correct"
              ? "ring-2 ring-green-400"
              : phase === "feedback" && isActive && feedbackType === "incorrect"
                ? "ring-2 ring-red-400"
                : "";

          return (
            <div
              key={i}
              className={`rounded-lg transition-colors duration-100 ${
                isActive
                  ? "bg-primary"
                  : "bg-muted/50"
              } ${feedbackBorder}`}
            />
          );
        })}
      </div>

      {/* Instructions / Status */}
      {phase === "idle" && (
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground max-w-sm">
            {isZh
              ? "记住每个亮起的位置。如果当前位置与2步前相同，按「匹配」。"
              : "Remember each highlighted position. Press MATCH if it matches the position from 2 steps ago."}
          </p>
          <button
            onClick={startGame}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium pressable"
          >
            {isZh ? "开始测试" : "Start Test"}
          </button>
        </div>
      )}

      {/* Non-scorable indicator for first N trials */}
      {(phase === "showing" || phase === "feedback") && !isScorable && (
        <p className="text-xs text-muted-foreground">
          {isZh ? "观察阶段（不计分）" : "Observation (not scored)"}
        </p>
      )}

      {/* Response Buttons */}
      {(phase === "showing" || phase === "feedback") && isScorable && (
        <div className="flex gap-3">
          <button
            onClick={() => handleResponse(true)}
            disabled={phase !== "showing"}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg font-medium pressable text-sm"
          >
            {isZh ? "匹配" : "Match"}{" "}
            <kbd className="ml-1 text-xs opacity-60">M</kbd>
          </button>
          <button
            onClick={() => handleResponse(false)}
            disabled={phase !== "showing"}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg font-medium pressable text-sm"
          >
            {isZh ? "不匹配" : "No Match"}{" "}
            <kbd className="ml-1 text-xs opacity-60">N</kbd>
          </button>
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className="text-center space-y-1">
          <p className="text-lg font-bold">
            {isZh ? "测试完成" : "Test Complete"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isZh ? "准确率" : "Accuracy"}: {currentAccuracy}%
          </p>
        </div>
      )}

      {/* Abort */}
      {phase !== "done" && (
        <button
          onClick={onAbort}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {isZh ? "放弃测试" : "Abort Test"}
        </button>
      )}
    </div>
  );
}
