import type { GamePlugin } from "@/types/game";
import { taskSwitchScorer } from "./scorer";
import TaskSwitchGame from "./game";

const plugin: GamePlugin = {
  id: "task-switch",
  name: "任务切换",
  nameEn: "Task Switch",
  description: "在两个规则之间快速切换",
  primaryTalent: "decision_speed",
  secondaryTalents: ["strategy_logic"],
  difficulty: "hard",
  estimatedDurationSec: 60,
  instructions:
    "屏幕会显示一个数字和彩色背景。蓝色背景问'数字>5？'，橙色背景问'数字是偶数？'。每4轮规则切换，尽快按是或否回答。",
  icon: "🔄",
  scorer: taskSwitchScorer,
  component: TaskSwitchGame,
  mobileCompatible: true,
};

export default plugin;
