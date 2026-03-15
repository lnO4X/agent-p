import type { GamePlugin } from "@/types/game";
import { teamworkScorer } from "./scorer";
import TeamworkGame from "./game";

const plugin: GamePlugin = {
  id: "teamwork",
  name: "协作模拟",
  nameEn: "Coordination Sim",
  description: "在团队场景中做出策略选择，测试你的协作倾向",
  primaryTalent: "teamwork_tendency",
  secondaryTalents: ["strategy_logic"],
  difficulty: "medium",
  estimatedDurationSec: 60,
  instructions:
    "每轮会展示一个工作场景和两个选项：独自完成（高风险高回报）或团队协作（稳定可靠）。AI队友会做出自己的选择，影响团队结果。共8轮，尽量最大化总分！",
  icon: "🤝",
  scorer: teamworkScorer,
  component: TeamworkGame,
};

export default plugin;
