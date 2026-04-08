import type { GamePlugin } from "@/types/game";
import { teamworkScorer } from "./scorer";
import PerspectiveGame from "./game";

const plugin: GamePlugin = {
  id: "teamwork",
  name: "视角判断",
  nameEn: "Perspective Taking",
  description: "从他人视角判断可见物品，测试协作认知能力",
  primaryTalent: "teamwork_tendency",
  secondaryTalents: ["spatial_awareness"],
  difficulty: "medium",
  estimatedDurationSec: 50,
  instructions:
    "A grid shows objects and a wall. A director stands on one side. Determine if the director can see the highlighted object.",
  icon: "👁️‍🗨️",
  scorer: teamworkScorer,
  component: PerspectiveGame,
  mobileCompatible: true,
};

export default plugin;
