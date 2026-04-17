"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";

const GRID_SIZE = 3;
const INITIAL_SEQ_LENGTH = 3;
const FLASH_DURATION = 500; // ms per tile flash
const FLASH_GAP = 200; // ms between flashes

export default function MemoryGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [phase, setPhase] = useState<
    "idle" | "showing" | "input" | "success" | "fail" | "done"
  >("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [seqLength, setSeqLength] = useState(INITIAL_SEQ_LENGTH);
  const [maxAchieved, setMaxAchieved] = useState(0);
  const [level, setLevel] = useState(1);

  const startTimeRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const levelsCompleted = useRef<number[]>([]);

  const generateSequence = useCallback((length: number): number[] => {
    const seq: number[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE)));
    }
    return seq;
  }, []);

  const showSequence = useCallback(
    (seq: number[]) => {
      setPhase("showing");
      setPlayerInput([]);
      let i = 0;
      const show = () => {
        if (i < seq.length) {
          setActiveCell(seq[i]);
          timersRef.current.push(setTimeout(() => {
            setActiveCell(null);
            i++;
            timersRef.current.push(setTimeout(show, FLASH_GAP));
          }, FLASH_DURATION));
        } else {
          setPhase("input");
        }
      };
      // Small delay before starting sequence
      timersRef.current.push(setTimeout(show, 500));
    },
    []
  );

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    setMaxAchieved(0);
    setSeqLength(INITIAL_SEQ_LENGTH);
    setLevel(1);
    levelsCompleted.current = [];
    const seq = generateSequence(INITIAL_SEQ_LENGTH);
    setSequence(seq);
    showSequence(seq);
  }, [generateSequence, showSequence]);

  const startNextLevel = useCallback(
    (newLength: number) => {
      const seq = generateSequence(newLength);
      setSequence(seq);
      setSeqLength(newLength);
      showSequence(seq);
    },
    [generateSequence, showSequence]
  );

  const finishGame = useCallback(
    (maxLen: number) => {
      setPhase("done");
      onComplete({
        rawScore: maxLen,
        durationMs: Date.now() - startTimeRef.current,
        metadata: {
          maxSequenceLength: maxLen,
          levelsCompleted: levelsCompleted.current,
        },
      });
    },
    [onComplete]
  );

  const handleCellClick = useCallback(
    (cellIndex: number) => {
      if (phase !== "input") return;

      const newInput = [...playerInput, cellIndex];
      setPlayerInput(newInput);

      // Flash the cell briefly
      setActiveCell(cellIndex);
      timersRef.current.push(setTimeout(() => setActiveCell(null), 150));

      const inputIdx = newInput.length - 1;

      // Check if this input is correct
      if (newInput[inputIdx] !== sequence[inputIdx]) {
        // Wrong input - game over
        setPhase("fail");
        timersRef.current.push(setTimeout(() => {
          finishGame(maxAchieved);
        }, 1500));
        return;
      }

      // All correct so far
      if (newInput.length === sequence.length) {
        // Completed this sequence
        const achieved = seqLength;
        setMaxAchieved(achieved);
        levelsCompleted.current.push(achieved);
        setPhase("success");
        setLevel((l) => l + 1);

        timersRef.current.push(setTimeout(() => {
          startNextLevel(seqLength + 1);
        }, 1000));
      }
    },
    [
      phase,
      playerInput,
      sequence,
      seqLength,
      maxAchieved,
      startNextLevel,
      finishGame,
    ]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const gridCells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex justify-between w-full max-w-xs text-sm text-muted-foreground px-2">
        <span>{isZh ? "关卡:" : "Level:"} {level}</span>
        <span>
          {isZh ? "序列长度:" : "Sequence:"} {seqLength} | {isZh ? "最高:" : "Best:"} {maxAchieved}
        </span>
      </div>

      {phase === "idle" && (
        <div className="w-full max-w-sm bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-lg mb-4">{isZh ? "记住闪烁顺序" : "Remember the Sequence"}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {isZh
              ? "方块会按顺序闪烁，请按相同顺序点击方块。序列从3开始，每成功一次加1。直到记错为止，记录你达到的最长序列。"
              : "Squares flash in sequence. Click them back in the same order. Starts at 3, grows by 1 each success. Game ends on first mistake."}
          </p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-lg transition-colors"
          >
            {isZh ? "开始测试" : "Start Test"}
          </button>
        </div>
      )}

      {phase !== "idle" && phase !== "done" && (
        <>
          <div className="text-sm text-center min-h-[1.5rem]">
            {phase === "showing" && (
              <span className="text-yellow-400">{isZh ? "请观察..." : "Watch..."}</span>
            )}
            {phase === "input" && (
              <span className="text-blue-400">
                {isZh ? "请点击!" : "Your turn!"} ({playerInput.length}/{sequence.length})
              </span>
            )}
            {phase === "success" && (
              <span className="text-green-400">{isZh ? "正确! 序列加长!" : "Correct! Sequence grows!"}</span>
            )}
            {phase === "fail" && (
              <span className="text-red-400">{isZh ? "错误! 游戏结束" : "Wrong! Game Over"}</span>
            )}
          </div>

          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              width: GRID_SIZE * 80 + (GRID_SIZE - 1) * 8,
            }}
          >
            {gridCells.map((cellIdx) => {
              const isActive = activeCell === cellIdx;
              const isShowingPhase = phase === "showing";

              return (
                <button
                  key={cellIdx}
                  onClick={() => handleCellClick(cellIdx)}
                  disabled={phase !== "input"}
                  className={`w-20 h-20 rounded-lg transition-all duration-150 ${
                    isActive
                      ? "bg-yellow-400 scale-95 shadow-lg shadow-yellow-400/30"
                      : isShowingPhase
                        ? "bg-slate-700 cursor-default"
                        : phase === "input"
                          ? "bg-slate-600 hover:bg-slate-500 cursor-pointer active:scale-95"
                          : "bg-slate-700 cursor-default"
                  }`}
                />
              );
            })}
          </div>
        </>
      )}

      {phase === "done" && (
        <div className="w-full max-w-sm bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-2xl font-bold mb-2">{isZh ? "测试完成!" : "Test Complete!"}</p>
          <p className="text-4xl font-bold text-primary">{maxAchieved}</p>
          <p className="text-sm text-muted-foreground mt-2">{isZh ? "最长序列长度" : "Longest Sequence"}</p>
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
