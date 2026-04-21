import type { GamePlugin } from "@/types/game";
import { handEyeScorer } from "./scorer";
import HandEyeGame from "./game";

const plugin: GamePlugin = {
  id: "hand-eye",
  name: "目标追踪",
  nameEn: "Target Tracker",
  description: "追踪移动目标，测试手眼协调能力",
  primaryTalent: "hand_eye_coord",
  difficulty: "medium",
  estimatedDurationSec: 25,
  instructions:
    "一个圆形目标会在画布内随机移动，请保持鼠标或手指在目标上。测试持续20秒，追踪时间占比越高分数越高。",
  icon: "🎯",
  scorer: handEyeScorer,
  component: HandEyeGame,
  // Touch supported on mobile, though finger tracking has lower precision
  // than a mouse — the percent-on-target paradigm still works.
  mobileCompatible: true,
};

export default plugin;
