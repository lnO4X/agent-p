import type { GamePlugin } from "@/types/game";
import { patternScorer } from "./scorer";
import PatternGame from "./game";

const plugin: GamePlugin = {
  id: "pattern",
  name: "图案矩阵",
  nameEn: "Pattern Matrix",
  description: "从相似颜色中找出不同方块，测试图案识别能力",
  primaryTalent: "pattern_recog",
  difficulty: "easy",
  estimatedDurationSec: 45,
  instructions:
    "4x4方格中有一个方块颜色与其它略有不同，点击找出它。每轮颜色差异会越来越小，共15轮。找对越多分数越高。",
  icon: "🎨",
  scorer: patternScorer,
  component: PatternGame,
};

export default plugin;
