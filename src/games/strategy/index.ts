import type { GamePlugin } from "@/types/game";
import { strategyScorer } from "./scorer";
import StrategyGame from "./game";

const plugin: GamePlugin = {
  id: "strategy",
  name: "塔防谜题",
  nameEn: "Tower Defense Puzzle",
  description: "在路径旁放置防御塔消灭敌人，测试策略思维",
  primaryTalent: "strategy_logic",
  difficulty: "hard",
  estimatedDurationSec: 45,
  instructions:
    "敌人沿路径从左向右移动。每轮在路径旁放置3座防御塔，塔会自动攻击范围内的敌人。共2轮不同路径，消灭的敌人比例越高分数越高。",
  icon: "🏰",
  scorer: strategyScorer,
  component: StrategyGame,
};

export default plugin;
