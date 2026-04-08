import type { GamePlugin } from "@/types/game";
import { strategyScorer } from "./scorer";
import GoNoGoGame from "./game";

const plugin: GamePlugin = {
  id: "strategy",
  name: "Go/No-Go 冲动控制",
  nameEn: "Go/No-Go",
  description: "在快速反应中控制冲动，测试执行功能与抑制控制",
  primaryTalent: "strategy_logic",
  difficulty: "medium",
  estimatedDurationSec: 50,
  instructions:
    "Green circle = press space. Red circle = do NOT press. Most are green, building a 'press' habit. Can you resist the red ones?",
  icon: "🚦",
  scorer: strategyScorer,
  component: GoNoGoGame,
  mobileCompatible: true,
};

export default plugin;
