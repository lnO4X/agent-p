import type { GamePlugin } from "@/types/game";
import { flankerScorer } from "./scorer";
import FlankerGame from "./game";

const plugin: GamePlugin = {
  id: "flanker",
  name: "\u6CE8\u610F\u529B\u6291\u5236",
  nameEn: "Flanker Test",
  description: "\u5728\u5E72\u6270\u4FE1\u606F\u4E2D\u5FEB\u901F\u8BC6\u522B\u76EE\u6807\u65B9\u5411",
  primaryTalent: "emotional_control",
  difficulty: "medium",
  estimatedDurationSec: 60,
  instructions:
    "Look at the center arrow. Press the direction it points, ignoring the surrounding arrows.",
  icon: "\uD83C\uDFAF",
  scorer: flankerScorer,
  component: FlankerGame,
  mobileCompatible: true,
};

export default plugin;
