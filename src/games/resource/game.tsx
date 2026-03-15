"use client";

import { useState, useRef, useCallback } from "react";
import type { GameComponentProps } from "@/types/game";

type ResourceType = "gold" | "wood" | "food";
type ActionType = "produce" | "trade" | "invest";

interface Resources {
  gold: number;
  wood: number;
  food: number;
}

interface Demand {
  resource: ResourceType;
  amount: number;
  reward: number;
}

interface RandomEvent {
  name: string;
  description: string;
  apply: (r: Resources) => Resources;
}

const RESOURCE_LABELS: Record<ResourceType, { name: string; icon: string }> = {
  gold: { name: "金币", icon: "🪙" },
  wood: { name: "木材", icon: "🪵" },
  food: { name: "食物", icon: "🍖" },
};

const RESOURCE_KEYS: ResourceType[] = ["gold", "wood", "food"];

const EVENTS: RandomEvent[] = [
  { name: "干旱", description: "食物 -3", apply: (r) => ({ ...r, food: Math.max(0, r.food - 3) }) },
  { name: "金矿发现", description: "金币 +3", apply: (r) => ({ ...r, gold: r.gold + 3 }) },
  { name: "森林火灾", description: "木材 -4", apply: (r) => ({ ...r, wood: Math.max(0, r.wood - 4) }) },
  { name: "丰收", description: "食物 +3", apply: (r) => ({ ...r, food: r.food + 3 }) },
  { name: "盗贼来袭", description: "金币 -3", apply: (r) => ({ ...r, gold: Math.max(0, r.gold - 3) }) },
  { name: "和平时期", description: "无事发生", apply: (r) => r },
  { name: "商队到来", description: "所有资源 +1", apply: (r) => ({ gold: r.gold + 1, wood: r.wood + 1, food: r.food + 1 }) },
  { name: "暴风雪", description: "木材和食物各 -2", apply: (r) => ({ ...r, wood: Math.max(0, r.wood - 2), food: Math.max(0, r.food - 2) }) },
  { name: "贸易繁荣", description: "金币 +2", apply: (r) => ({ ...r, gold: r.gold + 2 }) },
  { name: "虫害", description: "食物 -2, 木材 -1", apply: (r) => ({ ...r, food: Math.max(0, r.food - 2), wood: Math.max(0, r.wood - 1) }) },
];

const TOTAL_ROUNDS = 8;
const STARTING_RESOURCES: Resources = { gold: 5, wood: 5, food: 5 };

// Generate a random demand that creates strategic tension
function generateDemand(roundIndex: number): Demand {
  const resources: ResourceType[] = ["gold", "wood", "food"];
  const resource = resources[Math.floor(Math.random() * resources.length)];
  // Demands get larger as rounds progress
  const baseAmount = 4 + Math.floor(roundIndex / 2) * 2;
  const amount = baseAmount + Math.floor(Math.random() * 3);
  // Reward scales with demand
  const reward = Math.floor(amount * 1.8) + Math.floor(Math.random() * 3);
  return { resource, amount, reward };
}

export default function ResourceGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<"idle" | "action" | "event" | "done">("idle");
  const [round, setRound] = useState(1);
  const [resources, setResources] = useState<Resources>({ ...STARTING_RESOURCES });
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [produceTarget, setProduceTarget] = useState<ResourceType | null>(null);
  const [tradeFrom, setTradeFrom] = useState<ResourceType | null>(null);
  const [tradeTo, setTradeTo] = useState<ResourceType | null>(null);
  const [currentEvent, setCurrentEvent] = useState<RandomEvent | null>(null);
  const [currentDemand, setCurrentDemand] = useState<Demand | null>(null);
  const [demandMet, setDemandMet] = useState(false);
  const [totalBonus, setTotalBonus] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const startTimeRef = useRef(0);
  const historyRef = useRef<Array<{ round: number; action: string; event: string; resources: Resources }>>([]);

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    setRound(1);
    setResources({ ...STARTING_RESOURCES });
    setSelectedAction(null);
    setProduceTarget(null);
    setTradeFrom(null);
    setTradeTo(null);
    setCurrentEvent(null);
    setCurrentDemand(generateDemand(0));
    setDemandMet(false);
    setTotalBonus(0);
    setLog([]);
    historyRef.current = [];
    setPhase("action");
  }, []);

  const executeAction = useCallback(() => {
    if (!selectedAction) return;

    const newResources = { ...resources };
    let actionDesc = "";

    if (selectedAction === "produce" && produceTarget) {
      // Produce: +4 target, -1 random other
      newResources[produceTarget] += 4;
      const others = RESOURCE_KEYS.filter((k) => k !== produceTarget);
      const loseTarget = others[Math.floor(Math.random() * others.length)];
      newResources[loseTarget] = Math.max(0, newResources[loseTarget] - 1);
      actionDesc = `生产 ${RESOURCE_LABELS[produceTarget].name} +4, ${RESOURCE_LABELS[loseTarget].name} -1`;
    } else if (selectedAction === "trade" && tradeFrom && tradeTo && tradeFrom !== tradeTo) {
      if (newResources[tradeFrom] < 2) {
        actionDesc = `交易失败: ${RESOURCE_LABELS[tradeFrom].name} 不足`;
      } else {
        // Trade: spend 2, get 3 — makes trading valuable for rebalancing
        newResources[tradeFrom] -= 2;
        newResources[tradeTo] += 3;
        actionDesc = `交易: ${RESOURCE_LABELS[tradeFrom].name} -2 → ${RESOURCE_LABELS[tradeTo].name} +3`;
      }
    } else if (selectedAction === "invest") {
      // Invest: small gain now, but check if minimum not at risk
      newResources.gold += 1;
      newResources.wood += 1;
      newResources.food += 1;
      actionDesc = "储备: 所有资源 +1";
    } else {
      return;
    }

    // Check demand fulfillment before event
    let bonusEarned = 0;
    if (currentDemand && newResources[currentDemand.resource] >= currentDemand.amount) {
      bonusEarned = currentDemand.reward;
      setDemandMet(true);
    }

    setResources(newResources);
    setLog((l) => [...l, `[第${round}轮] ${actionDesc}`]);

    // Roll random event
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const afterEvent = event.apply(newResources);
    setResources(afterEvent);
    setCurrentEvent(event);

    if (bonusEarned > 0) {
      setTotalBonus((b) => b + bonusEarned);
      setLog((l) => [...l, `  ✅ 需求达成! +${bonusEarned} 奖励分`]);
    }

    historyRef.current.push({
      round,
      action: actionDesc,
      event: event.name,
      resources: { ...afterEvent },
    });

    setLog((l) => [...l, `  → 事件: ${event.name} (${event.description})`]);
    setPhase("event");

    setSelectedAction(null);
    setProduceTarget(null);
    setTradeFrom(null);
    setTradeTo(null);
  }, [selectedAction, produceTarget, tradeFrom, tradeTo, resources, round, currentDemand]);

  const nextRound = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      setPhase("done");
      const total = resources.gold + resources.wood + resources.food;
      // Penalty for any resource at 0 — encourages balance
      const zeroPenalty = RESOURCE_KEYS.filter((k) => resources[k] === 0).length * 5;
      // Balance bonus: reward having no resource below 3
      const minResource = Math.min(resources.gold, resources.wood, resources.food);
      const balanceBonus = minResource >= 3 ? 8 : minResource >= 1 ? 3 : 0;
      const finalScore = total + totalBonus + balanceBonus - zeroPenalty;

      onComplete({
        rawScore: Math.max(0, Math.min(100, finalScore)),
        durationMs: Date.now() - startTimeRef.current,
        metadata: {
          finalResources: { ...resources },
          totalResources: total,
          demandBonus: totalBonus,
          balanceBonus,
          zeroPenalty,
          finalScore,
          history: historyRef.current,
        },
      });
      return;
    }

    // New demand each round
    setCurrentDemand(generateDemand(round));
    setDemandMet(false);
    setRound((r) => r + 1);
    setCurrentEvent(null);
    setPhase("action");
  }, [round, resources, totalBonus, onComplete]);

  const canExecute =
    selectedAction === "invest" ||
    (selectedAction === "produce" && produceTarget) ||
    (selectedAction === "trade" && tradeFrom && tradeTo && tradeFrom !== tradeTo);

  const totalResources = resources.gold + resources.wood + resources.food;

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">补给线 - 操作说明</h3>
          <p className="text-sm text-muted-foreground">
            管理三种资源: 金币、木材、食物 (各起始5)
          </p>
          <p className="text-sm text-muted-foreground">
            每轮选择: 生产(+4/-1) | 交易(2换3) | 储备(各+1)
          </p>
          <p className="text-sm text-muted-foreground">
            每轮有需求目标，达成获得奖励分！资源归零会扣分
          </p>
          <p className="text-sm text-muted-foreground">共 {TOTAL_ROUNDS} 轮, 目标: 最大化总分</p>
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
    <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between w-full text-sm px-1">
        <span className="text-muted-foreground">第 {round}/{TOTAL_ROUNDS} 轮</span>
        <span className="text-muted-foreground">
          资源: <span className="text-foreground font-bold">{totalResources}</span>
          {totalBonus > 0 && <span className="text-yellow-400 ml-1">+{totalBonus}🏆</span>}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((round - 1 + (phase === "event" ? 1 : 0)) / TOTAL_ROUNDS) * 100}%` }}
        />
      </div>

      {/* Resource dashboard */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {RESOURCE_KEYS.map((key) => (
          <div
            key={key}
            className={`bg-slate-800/50 border rounded-xl p-3 text-center ${
              resources[key] === 0 ? "border-red-500/50" : "border-slate-700"
            }`}
          >
            <div className="text-2xl">{RESOURCE_LABELS[key].icon}</div>
            <div className="text-xs text-muted-foreground mt-1">{RESOURCE_LABELS[key].name}</div>
            <div className={`text-xl font-bold ${resources[key] === 0 ? "text-red-400" : "text-foreground"}`}>
              {resources[key]}
            </div>
          </div>
        ))}
      </div>

      {/* Current demand */}
      {currentDemand && phase === "action" && !demandMet && (
        <div className="w-full text-center py-2 bg-yellow-500/15 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400/70">本轮需求目标</p>
          <p className="text-sm font-bold text-yellow-400">
            {RESOURCE_LABELS[currentDemand.resource].icon} {RESOURCE_LABELS[currentDemand.resource].name} ≥ {currentDemand.amount}
            <span className="text-xs ml-2 text-yellow-400/70">(奖励 +{currentDemand.reward}分)</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            当前: {resources[currentDemand.resource]} / {currentDemand.amount}
          </p>
        </div>
      )}
      {demandMet && phase === "action" && (
        <div className="w-full text-center py-2 bg-green-500/15 border border-green-500/30 rounded-lg text-sm text-green-400 font-bold">
          ✅ 需求已达成!
        </div>
      )}

      {phase === "action" && (
        <>
          <div className="w-full space-y-2">
            <p className="text-sm font-bold">选择行动:</p>
            <div className="grid grid-cols-3 gap-2">
              {(["produce", "trade", "invest"] as ActionType[]).map((action) => (
                <button
                  key={action}
                  onClick={() => {
                    setSelectedAction(action);
                    setProduceTarget(null);
                    setTradeFrom(null);
                    setTradeTo(null);
                  }}
                  className={`p-3 rounded-xl border text-center transition ${
                    selectedAction === action
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <div className="text-lg">
                    {action === "produce" ? "⚒️" : action === "trade" ? "🔄" : "📦"}
                  </div>
                  <div className="text-xs mt-1">
                    {action === "produce" ? "生产" : action === "trade" ? "交易" : "储备"}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {action === "produce" ? "+4/-1" : action === "trade" ? "2→3" : "各+1"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedAction === "produce" && (
            <div className="w-full space-y-2">
              <p className="text-xs text-muted-foreground">选择生产目标 (+4 目标, -1 随机其他):</p>
              <div className="flex gap-2">
                {RESOURCE_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setProduceTarget(key)}
                    className={`flex-1 py-2 rounded-lg border text-sm transition ${
                      produceTarget === key
                        ? "bg-primary/20 border-primary"
                        : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {RESOURCE_LABELS[key].icon} {RESOURCE_LABELS[key].name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedAction === "trade" && (
            <div className="w-full space-y-2">
              <p className="text-xs text-muted-foreground">选择交换 (消耗2 → 获得3):</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">消耗:</p>
                  <div className="flex gap-1">
                    {RESOURCE_KEYS.map((key) => (
                      <button
                        key={key}
                        onClick={() => setTradeFrom(key)}
                        disabled={resources[key] < 2}
                        className={`flex-1 py-1.5 rounded text-xs transition ${
                          tradeFrom === key
                            ? "bg-red-600/30 border border-red-500"
                            : resources[key] < 2
                              ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
                              : "bg-slate-800/50 border border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {RESOURCE_LABELS[key].icon}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-lg">→</span>
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">获得:</p>
                  <div className="flex gap-1">
                    {RESOURCE_KEYS.map((key) => (
                      <button
                        key={key}
                        onClick={() => setTradeTo(key)}
                        disabled={key === tradeFrom}
                        className={`flex-1 py-1.5 rounded text-xs transition ${
                          tradeTo === key
                            ? "bg-green-600/30 border border-green-500"
                            : key === tradeFrom
                              ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
                              : "bg-slate-800/50 border border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {RESOURCE_LABELS[key].icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedAction === "invest" && (
            <div className="w-full text-center text-sm text-muted-foreground py-2">
              所有资源各 +1 (安全但缓慢)
            </div>
          )}

          <button
            onClick={executeAction}
            disabled={!canExecute}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            执行行动
          </button>
        </>
      )}

      {phase === "event" && currentEvent && (
        <div className="w-full space-y-3">
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 text-center space-y-2">
            <p className="text-xs text-amber-400/70">随机事件</p>
            <p className="text-lg font-bold text-amber-400">{currentEvent.name}</p>
            <p className="text-sm text-muted-foreground">{currentEvent.description}</p>
          </div>

          <button
            onClick={nextRound}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition"
          >
            {round < TOTAL_ROUNDS ? "下一轮" : "查看结果"}
          </button>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="w-full max-h-24 overflow-y-auto space-y-0.5 text-xs text-muted-foreground bg-slate-900/50 rounded-lg p-2 border border-slate-800">
          {log.map((entry, i) => (
            <div key={i} className="font-mono">{entry}</div>
          ))}
        </div>
      )}

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground mt-1"
      >
        放弃测试
      </button>
    </div>
  );
}
