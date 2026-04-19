import type { GamePlugin } from "@/types/game";
import { patternScorer } from "./scorer";
import PatternGame from "./game";

/**
 * Posner Cueing Task (Posner 1980; Posner & Petersen 1990).
 *
 * A canonical attention paradigm measuring attentional orienting.
 * Metric: Validity Effect = mean RT(invalid) - mean RT(valid).
 * Lower effect = more efficient attention reorienting.
 */
const plugin: GamePlugin = {
  id: "pattern",
  name: "\u6CE8\u610F\u529B\u805A\u7126", // 注意力聚焦
  nameEn: "Attention Focus",
  description:
    "Posner \u6CE8\u610F\u7EBF\u7D22\u4EFB\u52A1 \u2014 \u6D4B\u91CF\u7EBF\u7D22\u8BEF\u5BFC\u65F6\u6CE8\u610F\u529B\u7684\u91CD\u65B0\u5B9A\u5411\u901F\u5EA6",
  primaryTalent: "pattern_recog",
  difficulty: "medium",
  estimatedDurationSec: 120,
  instructions:
    "Watch the fixation cross. A cue will briefly flash on one side, then a target (*) appears. Press LEFT or RIGHT arrow (or tap the box) indicating the target's location. Ignore the cue when it misleads you.",
  icon: "\uD83C\uDFAF", // 🎯
  scorer: patternScorer,
  component: PatternGame,
  mobileCompatible: true,
};

export default plugin;
