import type { GamePlugin } from "@/types/game";
import { resourceScorer } from "./scorer";
import UFOVGame from "./game";

const plugin: GamePlugin = {
  id: "resource",
  name: "UFOV 视野测试",
  nameEn: "Useful Field of View",
  description: "在短暂闪现中捕捉周边目标，测试视觉注意力广度",
  primaryTalent: "resource_mgmt",
  difficulty: "medium",
  estimatedDurationSec: 50,
  instructions:
    "Focus on the center cross. A target flashes briefly at one of 8 positions. After it disappears, click where you saw it.",
  icon: "👁️",
  scorer: resourceScorer,
  component: UFOVGame,
  mobileCompatible: true,
};

export default plugin;
