import type { TalentCategory } from "@/types/talent";

export const TALENT_LABELS: Record<TalentCategory, { zh: string; en: string }> =
  {
    reaction_speed: { zh: "反应速度", en: "Reaction Speed" },
    hand_eye_coord: { zh: "手眼协调", en: "Hand-Eye Coordination" },
    spatial_awareness: { zh: "空间感知", en: "Spatial Awareness" },
    memory: { zh: "记忆力", en: "Memory" },
    strategy_logic: { zh: "策略逻辑", en: "Strategy & Logic" },
    rhythm_sense: { zh: "节奏感", en: "Rhythm Sense" },
    pattern_recog: { zh: "图案识别", en: "Pattern Recognition" },
    multitasking: { zh: "多任务处理", en: "Multitasking" },
    decision_speed: { zh: "决策速度", en: "Decision Speed" },
    emotional_control: { zh: "情绪控制", en: "Emotional Control" },
    teamwork_tendency: { zh: "团队协作", en: "Teamwork" },
    risk_assessment: { zh: "风险评估", en: "Risk Assessment" },
    resource_mgmt: { zh: "资源管理", en: "Resource Management" },
  };

/**
 * Lucide icon component names for each talent category.
 * Import the corresponding icon from 'lucide-react' and render it.
 */
export const TALENT_ICON_NAMES: Record<TalentCategory, string> = {
  reaction_speed: "Zap",
  hand_eye_coord: "Target",
  spatial_awareness: "Box",
  memory: "Brain",
  strategy_logic: "Lightbulb",
  rhythm_sense: "Music",
  pattern_recog: "Search",
  multitasking: "Layers",
  decision_speed: "Timer",
  emotional_control: "Heart",
  teamwork_tendency: "Users",
  risk_assessment: "Shield",
  resource_mgmt: "Package",
};

export const GENRE_TALENT_MAP: Record<
  string,
  {
    name: string;
    nameZh: string;
    requiredTalents: Array<{ category: TalentCategory; weight: number }>;
  }
> = {
  fps: {
    name: "FPS",
    nameZh: "射击游戏",
    requiredTalents: [
      { category: "reaction_speed", weight: 0.3 },
      { category: "hand_eye_coord", weight: 0.3 },
      { category: "spatial_awareness", weight: 0.2 },
      { category: "decision_speed", weight: 0.2 },
    ],
  },
  moba: {
    name: "MOBA",
    nameZh: "MOBA",
    requiredTalents: [
      { category: "strategy_logic", weight: 0.2 },
      { category: "teamwork_tendency", weight: 0.2 },
      { category: "reaction_speed", weight: 0.15 },
      { category: "decision_speed", weight: 0.15 },
      { category: "multitasking", weight: 0.15 },
      { category: "spatial_awareness", weight: 0.15 },
    ],
  },
  rpg: {
    name: "RPG",
    nameZh: "角色扮演",
    requiredTalents: [
      { category: "strategy_logic", weight: 0.25 },
      { category: "resource_mgmt", weight: 0.25 },
      { category: "memory", weight: 0.2 },
      { category: "risk_assessment", weight: 0.15 },
      { category: "emotional_control", weight: 0.15 },
    ],
  },
  rhythm: {
    name: "Rhythm",
    nameZh: "音乐节奏",
    requiredTalents: [
      { category: "rhythm_sense", weight: 0.4 },
      { category: "reaction_speed", weight: 0.2 },
      { category: "hand_eye_coord", weight: 0.2 },
      { category: "pattern_recog", weight: 0.2 },
    ],
  },
  puzzle: {
    name: "Puzzle",
    nameZh: "益智解谜",
    requiredTalents: [
      { category: "strategy_logic", weight: 0.3 },
      { category: "pattern_recog", weight: 0.25 },
      { category: "spatial_awareness", weight: 0.25 },
      { category: "memory", weight: 0.2 },
    ],
  },
  strategy: {
    name: "Strategy",
    nameZh: "策略游戏",
    requiredTalents: [
      { category: "strategy_logic", weight: 0.25 },
      { category: "resource_mgmt", weight: 0.25 },
      { category: "risk_assessment", weight: 0.2 },
      { category: "decision_speed", weight: 0.15 },
      { category: "multitasking", weight: 0.15 },
    ],
  },
  battle_royale: {
    name: "Battle Royale",
    nameZh: "大逃杀",
    requiredTalents: [
      { category: "reaction_speed", weight: 0.2 },
      { category: "spatial_awareness", weight: 0.2 },
      { category: "risk_assessment", weight: 0.2 },
      { category: "decision_speed", weight: 0.2 },
      { category: "resource_mgmt", weight: 0.2 },
    ],
  },
  racing: {
    name: "Racing",
    nameZh: "竞速游戏",
    requiredTalents: [
      { category: "reaction_speed", weight: 0.3 },
      { category: "hand_eye_coord", weight: 0.3 },
      { category: "spatial_awareness", weight: 0.2 },
      { category: "emotional_control", weight: 0.2 },
    ],
  },
  simulation: {
    name: "Simulation",
    nameZh: "模拟经营",
    requiredTalents: [
      { category: "resource_mgmt", weight: 0.3 },
      { category: "strategy_logic", weight: 0.25 },
      { category: "multitasking", weight: 0.25 },
      { category: "risk_assessment", weight: 0.2 },
    ],
  },
  card: {
    name: "Card Game",
    nameZh: "卡牌游戏",
    requiredTalents: [
      { category: "strategy_logic", weight: 0.3 },
      { category: "memory", weight: 0.25 },
      { category: "risk_assessment", weight: 0.25 },
      { category: "emotional_control", weight: 0.2 },
    ],
  },
};
