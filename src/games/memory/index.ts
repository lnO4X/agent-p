import type { GamePlugin } from "@/types/game";
import { memoryScorer } from "./scorer";
import MemoryGame from "./game";

const plugin: GamePlugin = {
  id: "memory",
  name: "序列记忆",
  nameEn: "Sequence Memory",
  description: "记住并重复闪烁序列，测试短期记忆能力",
  primaryTalent: "memory",
  difficulty: "medium",
  estimatedDurationSec: 60,
  instructions:
    "3x3方格会按顺序闪烁，请按照相同顺序点击方格。序列从3个开始，每成功一次增加1个。记错则游戏结束，记录你的最长序列。",
  icon: "🧠",
  scorer: memoryScorer,
  component: MemoryGame,
};

export default plugin;
