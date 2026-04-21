import type { GamePlugin } from "@/types/game";
import { spatialScorer } from "./scorer";
import SpatialGame from "./game";

const plugin: GamePlugin = {
  id: "spatial",
  name: "形状旋转",
  nameEn: "Shape Rotator",
  description: "辨别旋转后的形状，测试空间感知能力",
  primaryTalent: "spatial_awareness",
  difficulty: "medium",
  estimatedDurationSec: 60,
  instructions:
    "每轮会显示一个原始形状和4个选项。请选出正确的旋转形状，其余为镜像或错误旋转。共12轮，形状逐渐变得复杂。",
  icon: "🔄",
  scorer: spatialScorer,
  component: SpatialGame,
  mobileCompatible: true,
};

export default plugin;
