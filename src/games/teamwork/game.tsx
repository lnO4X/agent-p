"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";

// Each scenario has visible clues that indicate the correct choice
interface Scenario {
  title: string;
  description: string;
  clues: string[]; // visible hints the player must read
  correctChoice: "solo" | "team";
  explanation: string;
  soloReward: number;
  teamReward: number;
}

// Pool of scenarios with clear correct answers based on readable clues
const SCENARIO_POOL: Scenario[] = [
  {
    title: "紧急修复",
    description: "服务器凌晨3点宕机，需要紧急修复。",
    clues: ["队友A：正在赶回公司", "队友B：我之前处理过类似问题", "系统日志：错误类型复杂，涉及多个模块"],
    correctChoice: "team",
    explanation: "多模块问题需要协作，且队友B有经验",
    soloReward: 10,
    teamReward: 14,
  },
  {
    title: "UI原型设计",
    description: "为新功能快速制作一个UI原型。",
    clues: ["截止：2小时后", "设计要求简单明确", "队友们都在忙其他项目"],
    correctChoice: "solo",
    explanation: "任务简单明确且队友不可用，独自更高效",
    soloReward: 14,
    teamReward: 8,
  },
  {
    title: "系统架构评审",
    description: "即将上线的新系统需要做架构评审。",
    clues: ["系统涉及前端、后端、数据库三个领域", "你只精通后端", "评审结果影响全组半年工作"],
    correctChoice: "team",
    explanation: "跨领域评审需要不同专长的人参与",
    soloReward: 8,
    teamReward: 15,
  },
  {
    title: "日报撰写",
    description: "每天下班前需要提交工作日报。",
    clues: ["这是个人工作总结", "只需10分钟", "队友说可以帮你写"],
    correctChoice: "solo",
    explanation: "个人日报只有自己最了解情况",
    soloReward: 12,
    teamReward: 6,
  },
  {
    title: "竞品调研报告",
    description: "老板要求一份竞品分析报告。",
    clues: ["需要分析5个竞品", "每个竞品涉及不同市场", "截止：后天", "团队中有人了解不同市场"],
    correctChoice: "team",
    explanation: "多市场调研分工协作更全面高效",
    soloReward: 7,
    teamReward: 14,
  },
  {
    title: "代码重构",
    description: "一个你写的模块需要重构优化。",
    clues: ["你最熟悉这段代码", "改动范围较小", "需求很明确", "队友不了解这个模块历史"],
    correctChoice: "solo",
    explanation: "自己最熟悉的小范围重构，独自更高效",
    soloReward: 15,
    teamReward: 9,
  },
  {
    title: "线上事故响应",
    description: "线上出现资金相关的严重bug。",
    clues: ["影响数千用户", "需要同时修代码、联系用户、通报领导", "每分钟都在增加损失", "需要DBA配合回滚数据"],
    correctChoice: "team",
    explanation: "严重事故需要多人并行处理不同方面",
    soloReward: 6,
    teamReward: 16,
  },
  {
    title: "技术博客",
    description: "公司鼓励写技术博客分享。",
    clues: ["主题是你最近独立研究的技术", "你对这个领域有独特见解", "截止时间灵活"],
    correctChoice: "solo",
    explanation: "个人观点和研究，独自写更有深度和个性",
    soloReward: 13,
    teamReward: 7,
  },
  {
    title: "跨部门协调",
    description: "项目需要协调三个部门的资源。",
    clues: ["你不认识其他部门的人", "队友小王跟产品部很熟", "队友小李跟运维部关系好", "协调涉及多方利益平衡"],
    correctChoice: "team",
    explanation: "跨部门协调需要利用团队的人脉网络",
    soloReward: 5,
    teamReward: 15,
  },
  {
    title: "算法优化",
    description: "一个核心算法的性能需要优化。",
    clues: ["你是算法专家", "已经有明确的优化思路", "需要安静专注的环境", "讨论可能反而打断思路"],
    correctChoice: "solo",
    explanation: "深度算法工作需要专注，且你已有明确思路",
    soloReward: 14,
    teamReward: 8,
  },
  {
    title: "新人培训",
    description: "部门新来了3位实习生需要培训。",
    clues: ["涵盖前端、后端、测试三个方向", "你只擅长后端", "培训需要实际演示操作"],
    correctChoice: "team",
    explanation: "三个方向的培训需要不同专长的人分担",
    soloReward: 7,
    teamReward: 13,
  },
  {
    title: "快速修复typo",
    description: "文档里有个明显的拼写错误。",
    clues: ["一个字的修改", "你已经知道在哪里", "改完需要部署"],
    correctChoice: "solo",
    explanation: "极其简单的任务，组织团队反而浪费时间",
    soloReward: 12,
    teamReward: 5,
  },
];

const TOTAL_ROUNDS = 8;
const TIME_LIMIT_MS = 15000; // 15s per round

interface RoundResult {
  scenario: Scenario;
  choice: "solo" | "team";
  isCorrect: boolean;
  pointsEarned: number;
  timeSpentMs: number;
}

export default function TeamworkGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<"idle" | "choosing" | "result" | "done">("idle");
  const [round, setRound] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_MS);

  const startTimeRef = useRef(0);
  const roundStartRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null!);

  const startGame = useCallback(() => {
    // Shuffle and pick 8 scenarios
    const shuffled = [...SCENARIO_POOL].sort(() => Math.random() - 0.5);
    setScenarios(shuffled.slice(0, TOTAL_ROUNDS));
    startTimeRef.current = Date.now();
    roundStartRef.current = Date.now();
    setRound(0);
    setTotalPoints(0);
    setHistory([]);
    setTimeLeft(TIME_LIMIT_MS);
    setPhase("choosing");

    // Start countdown timer
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - roundStartRef.current;
      const remaining = Math.max(0, TIME_LIMIT_MS - elapsed);
      setTimeLeft(remaining);
    }, 100);
  }, []);

  const makeChoice = useCallback(
    (choice: "solo" | "team") => {
      const scenario = scenarios[round];
      if (!scenario) return;

      clearInterval(timerRef.current);

      const timeSpent = Date.now() - roundStartRef.current;
      const isCorrect = choice === scenario.correctChoice;

      // Points: correct choice earns full reward, wrong earns partial
      // Time bonus: faster correct answers get bonus points
      let pointsEarned: number;
      if (isCorrect) {
        const basePoints = choice === "solo" ? scenario.soloReward : scenario.teamReward;
        const timeBonus = timeSpent < 5000 ? 3 : timeSpent < 10000 ? 1 : 0;
        pointsEarned = basePoints + timeBonus;
      } else {
        pointsEarned = Math.floor(
          (choice === "solo" ? scenario.soloReward : scenario.teamReward) * 0.3
        );
      }

      const result: RoundResult = {
        scenario,
        choice,
        isCorrect,
        pointsEarned,
        timeSpentMs: timeSpent,
      };

      setRoundResult(result);
      setTotalPoints((p) => p + pointsEarned);
      setHistory((h) => [...h, result]);
      setPhase("result");
    },
    [round, scenarios]
  );

  // Auto-skip on timeout
  const handleTimeout = useCallback(() => {
    const scenario = scenarios[round];
    if (!scenario || phase !== "choosing") return;

    clearInterval(timerRef.current);

    const result: RoundResult = {
      scenario,
      choice: "solo",
      isCorrect: false,
      pointsEarned: 0,
      timeSpentMs: TIME_LIMIT_MS,
    };

    setRoundResult(result);
    setHistory((h) => [...h, result]);
    setPhase("result");
  }, [round, scenarios, phase]);

  // Check for timeout
  useEffect(() => {
    if (timeLeft <= 0 && phase === "choosing") {
      handleTimeout();
    }
  }, [timeLeft, phase, handleTimeout]);

  const nextRound = useCallback(() => {
    const nextIdx = round + 1;
    if (nextIdx >= TOTAL_ROUNDS) {
      setPhase("done");
      clearInterval(timerRef.current);

      const allResults = [...history];
      if (roundResult) allResults.push(roundResult);
      const finalResults = allResults.slice(0, TOTAL_ROUNDS);

      const correctCount = finalResults.filter((r) => r.isCorrect).length;
      const totalPts = finalResults.reduce((a, r) => a + r.pointsEarned, 0);

      onComplete({
        rawScore: totalPts,
        durationMs: Date.now() - startTimeRef.current,
        metadata: {
          totalPoints: totalPts,
          correctDecisions: correctCount,
          totalRounds: TOTAL_ROUNDS,
          accuracy: Math.round((correctCount / TOTAL_ROUNDS) * 100),
          rounds: finalResults.map((r) => ({
            title: r.scenario.title,
            choice: r.choice,
            correct: r.isCorrect,
            points: r.pointsEarned,
            timeMs: r.timeSpentMs,
          })),
        },
      });
      return;
    }

    setRound(nextIdx);
    setRoundResult(null);
    roundStartRef.current = Date.now();
    setTimeLeft(TIME_LIMIT_MS);
    setPhase("choosing");

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - roundStartRef.current;
      const remaining = Math.max(0, TIME_LIMIT_MS - elapsed);
      setTimeLeft(remaining);
    }, 100);
  }, [round, history, roundResult, onComplete]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">协作判断 - 操作说明</h3>
          <p className="text-sm text-muted-foreground">
            每轮面对一个工作场景，阅读线索判断该独自完成还是团队协作
          </p>
          <p className="text-sm text-muted-foreground">
            仔细阅读线索！正确判断得全分，错误只得30%
          </p>
          <p className="text-sm text-muted-foreground">
            每轮限时15秒，快速正确判断有额外加分
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

  const scenario = scenarios[round];
  const timerSecs = Math.ceil(timeLeft / 1000);
  const timerUrgent = timeLeft < 5000;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between w-full text-sm text-muted-foreground px-1">
        <span>第 {round + 1}/{TOTAL_ROUNDS} 轮</span>
        <span className={`font-mono font-bold ${timerUrgent ? "text-red-400" : "text-foreground"}`}>
          {timerSecs}s
        </span>
        <span>总分: <span className="text-foreground font-bold">{totalPoints}</span></span>
      </div>

      {/* Timer bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${timerUrgent ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${(timeLeft / TIME_LIMIT_MS) * 100}%` }}
        />
      </div>

      {phase === "choosing" && scenario && (
        <>
          {/* Scenario card */}
          <div className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-lg">📋 {scenario.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {scenario.description}
            </p>

            {/* Clues - the key info for making the decision */}
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-bold text-yellow-400">💡 关键信息:</p>
              {scenario.clues.map((clue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-yellow-400/60 mt-0.5">•</span>
                  <span>{clue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Choice buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => makeChoice("solo")}
              className="flex-1 p-4 bg-amber-900/30 border border-amber-700/50 rounded-xl hover:bg-amber-900/50 active:bg-amber-900/70 transition text-left space-y-1"
            >
              <div className="font-bold text-amber-400">🦸 独自完成</div>
              <div className="text-xs text-muted-foreground">
                适合简单、个人专长、需要专注的任务
              </div>
            </button>
            <button
              onClick={() => makeChoice("team")}
              className="flex-1 p-4 bg-blue-900/30 border border-blue-700/50 rounded-xl hover:bg-blue-900/50 active:bg-blue-900/70 transition text-left space-y-1"
            >
              <div className="font-bold text-blue-400">🤝 团队协作</div>
              <div className="text-xs text-muted-foreground">
                适合复杂、跨领域、需要多人并行的任务
              </div>
            </button>
          </div>
        </>
      )}

      {phase === "result" && roundResult && (
        <div
          className={`w-full p-5 rounded-xl border space-y-3 ${
            roundResult.isCorrect
              ? "bg-green-900/20 border-green-700/50"
              : "bg-red-900/20 border-red-700/50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {roundResult.isCorrect ? "✅" : "❌"}
            </span>
            <h3 className="font-bold">
              {roundResult.pointsEarned === 0
                ? "超时！未做选择"
                : roundResult.isCorrect
                  ? "判断正确！"
                  : "判断有误"}
            </h3>
          </div>

          <div className="space-y-1 text-sm">
            <p>
              最佳选择:{" "}
              <span className="font-bold">
                {roundResult.scenario.correctChoice === "solo" ? "🦸 独自完成" : "🤝 团队协作"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {roundResult.scenario.explanation}
            </p>
            <p className="text-lg font-bold mt-2">
              +{roundResult.pointsEarned} 分
            </p>
          </div>

          <button
            onClick={nextRound}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition"
          >
            {round + 1 < TOTAL_ROUNDS ? "下一轮" : "查看结果"}
          </button>
        </div>
      )}

      {/* History */}
      {history.length > 0 && phase !== "done" && (
        <div className="w-full space-y-1">
          <div className="flex gap-1.5 flex-wrap">
            {history.map((h, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  h.isCorrect
                    ? "bg-green-600/30 text-green-400"
                    : "bg-red-600/30 text-red-400"
                }`}
                title={`${h.scenario.title}: ${h.isCorrect ? "正确" : "错误"} (${h.pointsEarned}分)`}
              >
                {h.pointsEarned}
              </div>
            ))}
          </div>
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
