import type { GamePlugin } from "@/types/game";
import { rhythmScorer } from "./scorer";
import RhythmGame from "./game";

const plugin: GamePlugin = {
  id: "rhythm",
  name: "节拍捕手",
  nameEn: "Beat Catcher",
  description: "在正确时机击打落下的音符，测试节奏感",
  primaryTalent: "rhythm_sense",
  difficulty: "medium",
  estimatedDurationSec: 40,
  instructions:
    "音符从上方落下，到达蓝色命中区域时按空格键或点击画布。节奏从90BPM开始逐渐加快，共20个音符。计时偏差越小分数越高。",
  icon: "🎵",
  scorer: rhythmScorer,
  component: RhythmGame,
};

export default plugin;
