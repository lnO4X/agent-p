"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";
import { playSound } from "@/lib/audio-fx";
import { ParticleBurst, ComboCounter } from "@/components/game-fx";

type Phase = "idle" | "playing" | "feedback" | "practice-done" | "done";
type RuleType = "magnitude" | "parity";

interface Trial {
  number: number;
  rule: RuleType;
  isSwitch: boolean;
  correctAnswer: boolean; // true = Yes, false = No
}

const PRACTICE_TRIALS = 8; // 4 of each rule, 2 blocks of 4
const SCORED_TRIALS = 32;
const TOTAL_TRIALS = PRACTICE_TRIALS + SCORED_TRIALS;
const BLOCK_SIZE = 4;
const FEEDBACK_MS = 300;
const PRACTICE_DONE_MS = 1000;

// Generate a number 1-9 excluding 5
function randomNumber(): number {
  const nums = [1, 2, 3, 4, 6, 7, 8, 9];
  return nums[Math.floor(Math.random() * nums.length)];
}

function buildTrials(): Trial[] {
  const trials: Trial[] = [];
  let currentRule: RuleType = Math.random() < 0.5 ? "magnitude" : "parity";
  let trialInBlock = 0;

  for (let i = 0; i < TOTAL_TRIALS; i++) {
    // Switch rule every BLOCK_SIZE trials
    if (trialInBlock >= BLOCK_SIZE) {
      currentRule = currentRule === "magnitude" ? "parity" : "magnitude";
      trialInBlock = 0;
    }

    const isSwitch = i > 0 && trialInBlock === 0;
    const num = randomNumber();

    let correctAnswer: boolean;
    if (currentRule === "magnitude") {
      correctAnswer = num > 5;
    } else {
      correctAnswer = num % 2 === 0;
    }

    trials.push({
      number: num,
      rule: currentRule,
      isSwitch,
      correctAnswer,
    });

    trialInBlock++;
  }
  return trials;
}

export default function TaskSwitchGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<Phase>("idle");
  const [trialIndex, setTrialIndex] = useState(0);
  const [currentTrial, setCurrentTrial] = useState<Trial | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  // Polish state — switch-trial streak + block-end celebration
  const [switchStreak, setSwitchStreak] = useState(0);
  const [celebrateTrigger, setCelebrateTrigger] = useState(0);

  const trialsRef = useRef<Trial[]>([]);
  const startTimeRef = useRef(0);
  const trialStartRef = useRef(0);
  const switchTimesRef = useRef<number[]>([]);
  const repeatTimesRef = useRef<number[]>([]);
  const allTimesRef = useRef<{ rt: number; isSwitch: boolean; correct: boolean }[]>([]);
  const correctCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null!);

  const showTrial = useCallback((index: number) => {
    const t = trialsRef.current[index];
    setCurrentTrial(t);
    setTrialIndex(index);
    setPhase("playing");
    trialStartRef.current = performance.now();
  }, []);

  const handleStart = useCallback(() => {
    trialsRef.current = buildTrials();
    switchTimesRef.current = [];
    repeatTimesRef.current = [];
    allTimesRef.current = [];
    correctCountRef.current = 0;
    setCorrectCount(0);
    setSwitchStreak(0);
    startTimeRef.current = Date.now();
    showTrial(0);
  }, [showTrial]);

  const handleAnswer = useCallback(
    (answer: boolean) => {
      if (phase !== "playing" || !currentTrial) return;

      const rt = performance.now() - trialStartRef.current;
      const correct = answer === currentTrial.correctAnswer;
      const isPractice = trialIndex < PRACTICE_TRIALS;

      // Click sound at response time (Tier B safe — the response event itself)
      playSound("click");

      if (correct && !isPractice) {
        correctCountRef.current++;
        setCorrectCount(correctCountRef.current);
      }

      // Only record RT for correct responses (standard in switch-cost research)
      // and exclude practice trials
      if (correct && !isPractice) {
        if (currentTrial.isSwitch) {
          switchTimesRef.current.push(rt);
        } else {
          repeatTimesRef.current.push(rt);
        }
      }

      if (!isPractice) {
        allTimesRef.current.push({
          rt,
          isSwitch: currentTrial.isSwitch,
          correct,
        });
      }

      // Switch-trial bonus: 3 consecutive correct switches → combo chime
      let newSwitchStreak = switchStreak;
      if (currentTrial.isSwitch) {
        newSwitchStreak = correct ? switchStreak + 1 : 0;
        setSwitchStreak(newSwitchStreak);
        if (correct && newSwitchStreak > 0 && newSwitchStreak % 3 === 0) {
          playSound("coin");
        }
      } else if (!correct) {
        // Incorrect on repeat trial still breaks switch streak
        setSwitchStreak(0);
      }

      setLastCorrect(correct);
      setPhase("feedback");
      // Feedback-phase audio
      playSound(correct ? "success" : "error");

      timerRef.current = setTimeout(() => {
        setLastCorrect(null);
        const nextIndex = trialIndex + 1;
        if (nextIndex >= TOTAL_TRIALS) {
          // Calculate switch cost
          const meanSwitch =
            switchTimesRef.current.length > 0
              ? switchTimesRef.current.reduce((a, b) => a + b, 0) /
                switchTimesRef.current.length
              : 0;
          const meanRepeat =
            repeatTimesRef.current.length > 0
              ? repeatTimesRef.current.reduce((a, b) => a + b, 0) /
                repeatTimesRef.current.length
              : 0;
          const switchCost = Math.max(0, meanSwitch - meanRepeat);

          setPhase("done");
          // Block-end celebration: particle burst + success chime
          setCelebrateTrigger((t) => t + 1);
          playSound("success");
          onComplete({
            rawScore: Math.round(switchCost),
            durationMs: Date.now() - startTimeRef.current,
            metadata: {
              switchCostMs: Math.round(switchCost),
              meanSwitchRt: Math.round(meanSwitch),
              meanRepeatRt: Math.round(meanRepeat),
              accuracy:
                Math.round(
                  (correctCountRef.current / SCORED_TRIALS) * 1000
                ) / 10,
              correct: correctCountRef.current,
              total: SCORED_TRIALS,
              practiceTrials: PRACTICE_TRIALS,
              switchTrials: switchTimesRef.current.length,
              repeatTrials: repeatTimesRef.current.length,
              allTrials: allTimesRef.current,
            },
          });
        } else if (nextIndex === PRACTICE_TRIALS) {
          // Transition from practice to scored phase
          setPhase("practice-done");
          timerRef.current = setTimeout(() => showTrial(nextIndex), PRACTICE_DONE_MS);
        } else {
          showTrial(nextIndex);
        }
      }, FEEDBACK_MS);
    },
    [phase, currentTrial, trialIndex, showTrial, onComplete, switchStreak]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "y") {
        handleAnswer(true);
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "n") {
        handleAnswer(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, handleAnswer]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  // Idle screen
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">
            {isZh ? "任务切换" : "Task Switch"}
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {isZh
                ? "两种规则交替出现，根据背景色判断:"
                : "Two rules alternate. Judge based on background color:"}
            </p>
            <div className="flex gap-3 justify-center">
              <span className="px-3 py-1 rounded bg-blue-600/30 text-blue-400 font-medium">
                {isZh ? "蓝色: 数字 > 5?" : "Blue: Number > 5?"}
              </span>
              <span className="px-3 py-1 rounded bg-orange-600/30 text-orange-400 font-medium">
                {isZh ? "橙色: 数字是偶数?" : "Orange: Number even?"}
              </span>
            </div>
            <p>
              {isZh
                ? "点击 是/否 或按 Y/N 键快速回答"
                : "Click Yes/No or press Y/N to answer quickly"}
            </p>
            <p>
              {isZh
                ? `共 ${TOTAL_TRIALS} 轮，每 ${BLOCK_SIZE} 轮规则切换`
                : `${TOTAL_TRIALS} trials, rule switches every ${BLOCK_SIZE}`}
            </p>
          </div>
        </div>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 transition"
        >
          {isZh ? "开始游戏" : "Start Game"}
        </button>
        <button
          onClick={onAbort}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {isZh ? "放弃测试" : "Abort Test"}
        </button>
      </div>
    );
  }

  const bgColor =
    currentTrial?.rule === "magnitude"
      ? "bg-blue-600"
      : "bg-orange-600";

  const ruleText =
    currentTrial?.rule === "magnitude"
      ? isZh
        ? "数字 > 5?"
        : "Number > 5?"
      : isZh
        ? "数字是偶数?"
        : "Is it even?";

  return (
    <div className="relative flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {/* Combo counter — only during feedback on switch-streak milestones */}
      <ComboCounter
        combo={switchStreak}
        x={200}
        y={240}
        enabled={phase === "feedback" && switchStreak >= 3}
      />
      {/* Block-end particle burst — only at done */}
      <ParticleBurst
        trigger={celebrateTrigger}
        x={200}
        y={280}
        color="#FFB800"
        count={28}
        enabled={phase === "done" && celebrateTrigger > 0}
      />
      {/* Progress */}
      <div className="flex justify-between w-full text-sm text-muted-foreground px-1">
        <span>
          {trialIndex < PRACTICE_TRIALS
            ? isZh ? `练习 ${trialIndex + 1}/${PRACTICE_TRIALS}` : `Practice ${trialIndex + 1}/${PRACTICE_TRIALS}`
            : isZh ? `第 ${trialIndex + 1 - PRACTICE_TRIALS}/${SCORED_TRIALS} 轮` : `Trial ${trialIndex + 1 - PRACTICE_TRIALS}/${SCORED_TRIALS}`}
        </span>
        {trialIndex < PRACTICE_TRIALS ? (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-md text-xs">
            {isZh ? "练习 — 不计分" : "Practice — not scored"}
          </span>
        ) : (
          <span>
            {isZh
              ? `正确: ${correctCount}`
              : `Correct: ${correctCount}`}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((trialIndex + 1) / TOTAL_TRIALS) * 100}%` }}
        />
      </div>

      {/* Rule instruction */}
      <div
        className={`w-full text-center py-2 rounded-lg font-bold text-white ${
          currentTrial?.rule === "magnitude"
            ? "bg-blue-600/30 border border-blue-500/40"
            : "bg-orange-600/30 border border-orange-500/40"
        }`}
      >
        {ruleText}
      </div>

      {/* Number display (or practice-done transition) */}
      {phase === "practice-done" ? (
        <div className="w-48 h-48 rounded-2xl flex items-center justify-center bg-slate-800 animate-pulse">
          <span className="text-xl font-bold text-primary text-center px-2">
            {isZh ? "开始计分..." : "Now scoring..."}
          </span>
        </div>
      ) : (
        <div
          className={`w-48 h-48 rounded-2xl flex items-center justify-center ${bgColor} transition-colors duration-150 ${
            lastCorrect === true
              ? "ring-4 ring-green-400"
              : lastCorrect === false
                ? "ring-4 ring-red-400"
                : ""
          }`}
        >
          <span className="text-7xl font-bold text-white select-none">
            {currentTrial?.number}
          </span>
        </div>
      )}

      {/* Switch indicator */}
      {currentTrial?.isSwitch && (
        <div className="text-xs text-yellow-400 font-medium">
          {isZh ? "规则已切换!" : "Rule switched!"}
        </div>
      )}

      {/* Answer buttons */}
      <div className="flex gap-6 w-full">
        <button
          onClick={() => handleAnswer(true)}
          disabled={phase !== "playing"}
          className="flex-1 py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition"
        >
          {isZh ? "是 (Y)" : "Yes (Y)"}
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={phase !== "playing"}
          className="flex-1 py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition"
        >
          {isZh ? "否 (N)" : "No (N)"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        {isZh ? "Y/N 键或 ←/→ 键快速回答" : "Y/N or arrow keys to answer"}
      </p>

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {isZh ? "放弃测试" : "Abort Test"}
      </button>
    </div>
  );
}
