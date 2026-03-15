import type { GamePlugin } from "@/types/game";
import { decisionScorer } from "./scorer";
import DecisionGame from "./game";

const plugin: GamePlugin = {
  id: "decision",
  name: "快速分类",
  nameEn: "Rapid Triage",
  description: "根据变化的规则快速分类卡片，测试决策速度和灵活性",
  primaryTalent: "decision_speed",
  secondaryTalents: ["pattern_recog"],
  difficulty: "medium",
  estimatedDurationSec: 40,
  instructions:
    "屏幕上会出现带有表情符号的卡片，根据当前规则将其分到左边或右边。使用方向键或点击按钮分类。注意每8张卡片规则会改变！",
  icon: "🃏",
  scorer: decisionScorer,
  component: DecisionGame,
};

export default plugin;
