import type { GamePlugin } from "@/types/game";
import { reactionSpeedScorer } from "./scorer";
import ReactionSpeedGame from "./game";

const plugin: GamePlugin = {
  id: "reaction-speed",
  name: "快速点击",
  nameEn: "Quick Click",
  description: "测试你的反应速度，屏幕变绿时尽快点击",
  primaryTalent: "reaction_speed",
  difficulty: "easy",
  estimatedDurationSec: 30,
  instructions:
    "屏幕会从红色变为绿色，变绿后请尽快点击。注意不要提前点击！共10轮，测量你的平均反应时间。",
  icon: "⚡",
  scorer: reactionSpeedScorer,
  component: ReactionSpeedGame,
};

export default plugin;
