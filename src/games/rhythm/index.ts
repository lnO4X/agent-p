import type { GamePlugin } from "@/types/game";
import { rhythmScorer } from "./scorer";
import RhythmGame from "./game";

const plugin: GamePlugin = {
  id: "rhythm",
  name: "节拍同步",
  nameEn: "Beat Sync",
  description:
    "与节拍器同步敲击——感觉运动同步（SMS）范式，测量你与 120 BPM 节拍的平均时间偏差",
  primaryTalent: "rhythm_sense",
  difficulty: "medium",
  estimatedDurationSec: 30,
  instructions:
    "跟随固定 120 BPM 节拍敲击空格键或点击。测量你的敲击与节拍的绝对时间偏差（毫秒），偏差越小同步越好。标准 SMS 范式（Repp 2005）。",
  icon: "🎵",
  scorer: rhythmScorer,
  component: RhythmGame,
};

export default plugin;
