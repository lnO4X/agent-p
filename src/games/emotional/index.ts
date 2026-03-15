import type { GamePlugin } from "@/types/game";
import { emotionalScorer } from "./scorer";
import EmotionalGame from "./game";

const plugin: GamePlugin = {
  id: "emotional",
  name: "压力测试",
  nameEn: "Pressure Cooker",
  description: "在加速的打地鼠游戏中保持冷静和准确，测试情绪控制力",
  primaryTalent: "emotional_control",
  secondaryTalents: ["reaction_speed"],
  difficulty: "medium",
  estimatedDurationSec: 35,
  instructions:
    "点击绿色目标得1分，红色目标不要点否则扣2分。游戏速度会逐渐加快，保持冷静，不要被压力影响判断！",
  icon: "🎯",
  scorer: emotionalScorer,
  component: EmotionalGame,
};

export default plugin;
