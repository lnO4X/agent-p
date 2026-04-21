import type { GamePlugin } from "@/types/game";
import { riskScorer } from "./scorer";
import RiskGame from "./game";

const plugin: GamePlugin = {
  id: "risk",
  name: "风险骰子",
  nameEn: "Risk Roller",
  description: "气球充气游戏，测试你的风险评估能力和决策时机",
  primaryTalent: "risk_assessment",
  secondaryTalents: ["decision_speed"],
  difficulty: "easy",
  estimatedDurationSec: 45,
  instructions:
    '每轮给气球充气，每次充气增加1-3分到奖池。气球爆炸概率随充气次数递增，爆炸则本轮清零！点击"收钱"锁定当前奖池。共10轮，尽量最大化总收入！',
  icon: "🎈",
  scorer: riskScorer,
  component: RiskGame,
  mobileCompatible: true,
};

export default plugin;
