import type { GamePlugin } from "@/types/game";
import { emotionalScorer } from "./scorer";
import StroopGame from "./game";

const plugin: GamePlugin = {
  id: "emotional",
  name: "Stroop 色词测试",
  nameEn: "Stroop Task",
  description: "在色词冲突中保持认知控制，测试抗干扰能力",
  primaryTalent: "emotional_control",
  difficulty: "medium",
  estimatedDurationSec: 45,
  instructions:
    "Color words appear in mismatched ink colors. Press the key for the INK COLOR, not the word. Stay focused!",
  icon: "🎨",
  scorer: emotionalScorer,
  component: StroopGame,
  mobileCompatible: true,
};

export default plugin;
