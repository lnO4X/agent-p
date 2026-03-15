import type { GamePlugin } from "@/types/game";
import { resourceScorer } from "./scorer";
import ResourceGame from "./game";

const plugin: GamePlugin = {
  id: "resource",
  name: "补给线",
  nameEn: "Supply Line",
  description: "管理三种资源应对随机事件，测试你的资源管理能力",
  primaryTalent: "resource_mgmt",
  secondaryTalents: ["strategy_logic"],
  difficulty: "medium",
  estimatedDurationSec: 60,
  instructions:
    "管理金币、木材、食物三种资源（各起始10）。每轮选择：生产（+3目标/-1随机）、交易（3换2）或储备（各+1）。每轮会有随机事件。共8轮，目标最大化最终总资源！",
  icon: "📦",
  scorer: resourceScorer,
  component: ResourceGame,
};

export default plugin;
