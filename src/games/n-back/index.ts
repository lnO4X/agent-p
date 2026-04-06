import type { GamePlugin } from "@/types/game";
import { nBackScorer } from "./scorer";
import NBackGame from "./game";

const plugin: GamePlugin = {
  id: "n-back",
  name: "工作记忆",
  nameEn: "N-Back",
  description: "记住之前出现的位置，判断当前是否匹配",
  primaryTalent: "memory",
  secondaryTalents: ["multitasking"],
  difficulty: "hard",
  estimatedDurationSec: 90,
  instructions:
    "Watch the sequence. Press MATCH if the current position is the same as N steps back.",
  icon: "🧠",
  scorer: nBackScorer,
  component: NBackGame,
  mobileCompatible: true,
};

export default plugin;
