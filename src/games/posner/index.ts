import type { GamePlugin } from "@/types/game";
import { posnerScorer } from "./scorer";
import PosnerGame from "./game";

/**
 * Posner Cueing Task (Posner 1980; Posner & Petersen 1990).
 *
 * A canonical attention paradigm measuring attentional orienting.
 * Metric: Validity Effect = mean RT(invalid) - mean RT(valid).
 * Lower effect = more efficient attention reorienting.
 *
 * This is the research-grade attention-orienting measure, reserved for the Pro
 * tier. The Quick / Standard tier's "pattern" slot uses the lighter-weight
 * "Find the Odd One" color discrimination task (see src/games/pattern/).
 */
const plugin: GamePlugin = {
  id: "posner",
  name: "\u6CE8\u610F\u529B\u805A\u7126", // 注意力聚焦
  nameEn: "Posner Cueing",
  description:
    "Posner \u6CE8\u610F\u7EBF\u7D22\u4EFB\u52A1 \u2014 \u6D4B\u91CF\u7EBF\u7D22\u8BEF\u5BFC\u65F6\u6CE8\u610F\u529B\u7684\u91CD\u65B0\u5B9A\u5411\u901F\u5EA6",
  primaryTalent: "pattern_recog",
  difficulty: "medium",
  estimatedDurationSec: 120,
  instructions:
    "Watch the fixation cross. A cue will briefly flash on one side, then a target (*) appears. Press LEFT or RIGHT arrow (or tap the box) indicating the target's location. Ignore the cue when it misleads you.",
  icon: "\uD83C\uDFAF", // 🎯
  scorer: posnerScorer,
  component: PosnerGame,
  mobileCompatible: true,
};

export default plugin;
