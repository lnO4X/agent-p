import type { GamePlugin } from "@/types/game";
import { motScorer } from "./scorer";
import MOTGame from "./game";

const plugin: GamePlugin = {
  id: "mot",
  name: "多目标追踪",
  nameEn: "Multi-Object Tracking",
  description: "同时追踪多个移动目标",
  primaryTalent: "spatial_awareness",
  secondaryTalents: ["multitasking"],
  difficulty: "hard",
  estimatedDurationSec: 90,
  instructions:
    "屏幕上会出现8个圆球，其中几个会闪红色标记为目标。所有圆球变为相同颜色后开始移动，移动停止后点选你认为是目标的圆球。共8轮，难度递增。",
  icon: "👁️",
  scorer: motScorer,
  component: MOTGame,
  mobileCompatible: true,
};

export default plugin;
