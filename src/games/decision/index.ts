import type { GamePlugin } from "@/types/game";
import { decisionScorer } from "./scorer";
import DecisionGame from "./game";

const plugin: GamePlugin = {
  id: "decision",
  name: "决策者",
  nameEn: "Decision Maker",
  description:
    "从四副牌中抽牌学习哪副有利、哪副有害 — 测量在不确定性和延迟反馈下的决策能力（简化版 Iowa Gambling Task）",
  primaryTalent: "decision_speed",
  secondaryTalents: ["pattern_recog"],
  difficulty: "medium",
  estimatedDurationSec: 180,
  instructions:
    "从四副牌 (A/B/C/D) 中选择抽牌。每张牌会给你奖励，部分牌会扣分。两副牌长期来看亏损，两副牌长期来看盈利。通过试错找出有利的牌堆，最大化余额。共 100 轮（前 10 轮为练习）。",
  icon: "🃏",
  scorer: decisionScorer,
  component: DecisionGame,
  mobileCompatible: true,
};

export default plugin;
