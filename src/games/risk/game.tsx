"use client";

import { useState, useRef, useCallback } from "react";
import type { GameComponentProps } from "@/types/game";

const TOTAL_ROUNDS = 10;
const SAFE_PUMPS = 2; // First 2 pumps per round guaranteed safe
const POP_INCREMENT = 0.06; // After safe zone: 6%, 12%, 18%, ...

export default function RiskGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<"idle" | "pumping" | "banked" | "popped" | "done">("idle");
  const [round, setRound] = useState(1);
  const [pumps, setPumps] = useState(0);
  const [currentPot, setCurrentPot] = useState(0);
  const [totalBanked, setTotalBanked] = useState(0);
  const [balloonScale, setBalloonScale] = useState(1.0);
  const [shakeAnim, setShakeAnim] = useState(false);
  const [roundHistory, setRoundHistory] = useState<
    Array<{ pumps: number; earned: number; popped: boolean }>
  >([]);

  const startTimeRef = useRef(0);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    setRound(1);
    setPumps(0);
    setCurrentPot(0);
    setTotalBanked(0);
    setBalloonScale(1.0);
    setRoundHistory([]);
    setPhase("pumping");
  }, []);

  const pump = useCallback(() => {
    if (phase !== "pumping") return;

    const newPumps = pumps + 1;
    // First SAFE_PUMPS pumps are guaranteed safe (0% pop chance)
    const popChance =
      newPumps <= SAFE_PUMPS ? 0 : (newPumps - SAFE_PUMPS) * POP_INCREMENT;

    // Random points per pump: 1-3
    const pointsAdded = Math.floor(Math.random() * 3) + 1;

    if (Math.random() < popChance) {
      // Popped!
      setShakeAnim(true);
      setTimeout(() => setShakeAnim(false), 500);
      setPhase("popped");
      setRoundHistory((h) => [
        ...h,
        { pumps: newPumps, earned: 0, popped: true },
      ]);
      setPumps(newPumps);
      setCurrentPot(0);
      setBalloonScale(1.0);
    } else {
      const newPot = currentPot + pointsAdded;
      setPumps(newPumps);
      setCurrentPot(newPot);
      setBalloonScale(1.0 + newPumps * 0.12);
    }
  }, [phase, pumps, currentPot]);

  const bank = useCallback(() => {
    if (phase !== "pumping" || currentPot === 0) return;

    setTotalBanked((t) => t + currentPot);
    setRoundHistory((h) => [
      ...h,
      { pumps, earned: currentPot, popped: false },
    ]);
    setPhase("banked");
  }, [phase, currentPot, pumps]);

  const nextRound = useCallback(() => {
    const nextR = round + 1;
    if (nextR > TOTAL_ROUNDS) {
      setPhase("done");

      onComplete({
        rawScore: totalBanked,
        durationMs: Date.now() - startTimeRef.current,
        metadata: {
          totalBanked,
          rounds: roundHistory,
          avgPumps:
            roundHistory.length > 0
              ? Math.round(
                  (roundHistory.reduce((a, r) => a + r.pumps, 0) /
                    roundHistory.length) *
                    10
                ) / 10
              : 0,
          poppedCount: roundHistory.filter((r) => r.popped).length,
        },
      });
      return;
    }

    setRound(nextR);
    setPumps(0);
    setCurrentPot(0);
    setBalloonScale(1.0);
    setPhase("pumping");
  }, [round, totalBanked, roundHistory, onComplete, phase]);

  // Display the pop chance for the NEXT pump
  const nextPumpNum = pumps + 1;
  const nextPopChance =
    nextPumpNum <= SAFE_PUMPS ? 0 : (nextPumpNum - SAFE_PUMPS) * POP_INCREMENT;
  const popChanceDisplay = Math.round(nextPopChance * 100);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">风险骰子 - 操作说明</h3>
          <p className="text-sm text-muted-foreground">
            给气球充气, 每次充气增加1-3分到奖池
          </p>
          <p className="text-sm text-muted-foreground">
            前{SAFE_PUMPS}次充气安全, 之后爆炸概率递增!
          </p>
          <p className="text-sm text-muted-foreground">
            先充气再点&quot;收钱&quot;将奖池收入囊中, 爆炸则清零
          </p>
          <p className="text-sm text-muted-foreground">共 {TOTAL_ROUNDS} 轮</p>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 transition"
        >
          开始游戏
        </button>
        <button
          onClick={onAbort}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          放弃测试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between w-full text-sm px-1">
        <span className="text-muted-foreground">
          第 {round}/{TOTAL_ROUNDS} 轮
        </span>
        <span className="text-muted-foreground">
          已收: <span className="text-green-400 font-bold">{totalBanked}</span>{" "}
          分
        </span>
      </div>

      {/* Progress */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{
            width: `${((round - 1 + (phase === "banked" || phase === "popped" ? 1 : 0)) / TOTAL_ROUNDS) * 100}%`,
          }}
        />
      </div>

      {/* Balloon area */}
      <div className="relative w-full h-56 flex items-center justify-center">
        {phase === "popped" ? (
          <div
            className={`text-center ${shakeAnim ? "animate-pulse" : ""}`}
          >
            <div className="text-6xl mb-2">💥</div>
            <p className="text-red-400 font-bold text-lg">气球爆了!</p>
            <p className="text-sm text-muted-foreground">
              本轮 {pumps} 次充气, 损失所有奖池
            </p>
          </div>
        ) : phase === "banked" ? (
          <div className="text-center">
            <div className="text-6xl mb-2">💰</div>
            <p className="text-green-400 font-bold text-lg">
              成功收钱!
            </p>
            <p className="text-sm text-muted-foreground">
              本轮收入 {roundHistory[roundHistory.length - 1]?.earned || 0} 分
            </p>
          </div>
        ) : (
          <div className="text-center">
            {/* Balloon */}
            <div
              className="transition-transform duration-200 ease-out"
              style={{ transform: `scale(${balloonScale})` }}
            >
              <div className="text-8xl select-none">🎈</div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-2xl font-bold text-foreground">
                奖池: {currentPot} 分
              </p>
              <p className="text-xs text-muted-foreground">
                充气次数: {pumps} | 下次爆炸概率:{" "}
                {popChanceDisplay === 0 ? (
                  <span className="text-green-400">安全</span>
                ) : (
                  <span className="text-red-400">~{popChanceDisplay}%</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {phase === "pumping" && (
        <div className="flex gap-3 w-full">
          <button
            onClick={pump}
            className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-lg transition"
          >
            🫁 充气
          </button>
          <button
            onClick={bank}
            disabled={currentPot === 0}
            className="flex-1 py-4 bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition"
          >
            {currentPot === 0 ? "← 先充气" : "💰 收钱"}
          </button>
        </div>
      )}

      {(phase === "banked" || phase === "popped") && (
        <button
          onClick={nextRound}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 transition"
        >
          {round < TOTAL_ROUNDS ? "下一轮" : "查看结果"}
        </button>
      )}

      {/* History */}
      {roundHistory.length > 0 && (
        <div className="w-full space-y-1">
          <p className="text-xs text-muted-foreground">历史记录:</p>
          <div className="flex gap-1.5 flex-wrap">
            {roundHistory.map((r, i) => (
              <div
                key={i}
                className={`px-2 py-1 rounded text-xs font-mono ${
                  r.popped
                    ? "bg-red-600/20 text-red-400"
                    : "bg-green-600/20 text-green-400"
                }`}
                title={`${r.pumps}次充气, ${r.popped ? "爆炸" : `收入${r.earned}分`}`}
              >
                {r.popped ? "💥0" : `+${r.earned}`}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground mt-2"
      >
        放弃测试
      </button>
    </div>
  );
}
