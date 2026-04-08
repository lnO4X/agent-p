import type { GamePlugin } from "@/types/game";
import { multitaskScorer } from "./scorer";
import DualTaskGame from "./game";

const plugin: GamePlugin = {
  id: "multitask",
  name: "双任务 注意力分配",
  nameEn: "Dual-Task",
  description: "同时追踪视觉目标和分类数字，测试注意力分配能力",
  primaryTalent: "multitasking",
  secondaryTalents: ["hand_eye_coord"],
  difficulty: "hard",
  estimatedDurationSec: 50,
  instructions:
    "Track a moving dot and click when it turns red. Simultaneously classify numbers as odd (O) or even (E).",
  icon: "🧩",
  scorer: multitaskScorer,
  component: DualTaskGame,
  mobileCompatible: true,
};

export default plugin;
