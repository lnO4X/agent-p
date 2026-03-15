import type { GamePlugin } from "@/types/game";
import { multitaskScorer } from "./scorer";
import MultitaskGame from "./game";

const plugin: GamePlugin = {
  id: "multitask",
  name: "双重杂耍",
  nameEn: "Dual Juggle",
  description: "同时完成接球和数学题，测试你的多任务处理能力",
  primaryTalent: "multitasking",
  secondaryTalents: ["hand_eye_coord"],
  difficulty: "hard",
  estimatedDurationSec: 35,
  instructions:
    "左侧用方向键或A/D移动篮筐接住下落的球，右侧同时解答数学题并按Enter提交。持续30秒，尽量两边都兼顾！",
  icon: "🤹",
  scorer: multitaskScorer,
  component: MultitaskGame,
  mobileCompatible: false,
};

export default plugin;
