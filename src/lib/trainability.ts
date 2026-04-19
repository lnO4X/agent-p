import type { TalentCategory } from "@/types/talent";

export interface TrainabilityInfo {
  category: TalentCategory;
  /** Expected % improvement ceiling from published meta-analyses (0-100) */
  trainabilityPct: number;
  /** Rough hours of deliberate practice for measurable change */
  practiceHours: number;
  /** Training approach with some evidence base */
  methodEn: string;
  methodZh: string;
  /** Citation */
  source: string;
  /** Confidence in this trainability estimate: "high" | "medium" | "low" */
  evidenceStrength: "high" | "medium" | "low";
}

export const TRAINABILITY: Record<TalentCategory, TrainabilityInfo> = {
  reaction_speed: {
    category: "reaction_speed",
    trainabilityPct: 12,
    practiceHours: 30,
    methodEn:
      "Aim trainer drills (Aim Lab, Kovaak's), simple-RT stimulus exercises. Genetic ceiling caps gains.",
    methodZh: "瞄准训练器（Aim Lab、Kovaak's）、简单反应时练习。遗传天花板限制提升空间。",
    source: "Draper 2009 meta-analysis on RT training; Dye et al. 2009",
    evidenceStrength: "high",
  },
  hand_eye_coord: {
    category: "hand_eye_coord",
    trainabilityPct: 20,
    practiceHours: 40,
    methodEn:
      "Tracking tasks, pursuit-rotor practice, action games. Larger gains at lower baseline.",
    methodZh: "追踪任务、动作游戏。基线越低提升空间越大。",
    source: "Green & Bavelier 2003; Bediou et al. 2018 meta-analysis on action-game training",
    evidenceStrength: "medium",
  },
  spatial_awareness: {
    category: "spatial_awareness",
    trainabilityPct: 25,
    practiceHours: 50,
    methodEn:
      "Mental-rotation practice, 3D games, puzzle games. Transfers moderately to new spatial tasks.",
    methodZh: "心理旋转练习、3D 游戏、空间解谜。中等迁移到其他空间任务。",
    source: "Uttal et al. 2013 meta-analysis (spatial training, d=0.47)",
    evidenceStrength: "high",
  },
  memory: {
    category: "memory",
    trainabilityPct: 15,
    practiceHours: 40,
    methodEn:
      "N-back training, span tasks, memory palace. Near-transfer reliable, far-transfer weak.",
    methodZh: "N-back 训练、span 任务、记忆宫殿。近迁移可靠，远迁移较弱。",
    source: "Melby-Lervåg & Hulme 2013 meta on WM training: small-to-moderate near-transfer",
    evidenceStrength: "high",
  },
  strategy_logic: {
    category: "strategy_logic",
    trainabilityPct: 20,
    practiceHours: 40,
    methodEn: "Go/No-Go training, task-switching drills, real-time strategy play.",
    methodZh: "Go/No-Go 训练、任务切换练习、RTS 游戏。",
    source: "Karbach & Verhaeghen 2014 meta on task-switch training",
    evidenceStrength: "medium",
  },
  rhythm_sense: {
    category: "rhythm_sense",
    trainabilityPct: 30,
    practiceHours: 50,
    methodEn: "Metronome tapping practice, rhythm games (osu!, Beat Saber), music training.",
    methodZh: "节拍器跟随、节奏游戏（osu!、Beat Saber）、音乐训练。",
    source: "Repp 2005 review on tap timing training",
    evidenceStrength: "medium",
  },
  pattern_recog: {
    category: "pattern_recog",
    trainabilityPct: 18,
    practiceHours: 30,
    methodEn: "Attention-orienting drills, visual search tasks, dual-N-back.",
    methodZh: "注意定向训练、视觉搜索任务、dual N-back。",
    source: "Posner & Petersen 1990; Fan et al. 2001 on attention network training",
    evidenceStrength: "medium",
  },
  multitasking: {
    category: "multitasking",
    trainabilityPct: 22,
    practiceHours: 45,
    methodEn: "Dual-task training (Anguera et al. NeuroRacer), action games.",
    methodZh: "双任务训练（如 NeuroRacer）、动作游戏。",
    source: "Anguera et al. 2013 Nature; Bediou 2018 meta on action games",
    evidenceStrength: "high",
  },
  decision_speed: {
    category: "decision_speed",
    trainabilityPct: 25,
    practiceHours: 50,
    methodEn: "Decision-making practice under time pressure, competitive game play.",
    methodZh: "时间压力下的决策练习、竞技游戏实战。",
    source: "Literature estimate; decision training is understudied",
    evidenceStrength: "low",
  },
  emotional_control: {
    category: "emotional_control",
    trainabilityPct: 15,
    practiceHours: 40,
    methodEn: "Stroop practice, mindfulness training, cognitive-control drills.",
    methodZh: "Stroop 练习、正念训练、认知控制训练。",
    source: "Diamond 2013 review on executive-function training",
    evidenceStrength: "medium",
  },
  teamwork_tendency: {
    category: "teamwork_tendency",
    trainabilityPct: 20,
    practiceHours: 40,
    methodEn: "Perspective-taking exercises, social games, co-op play with communication.",
    methodZh: "视角转换练习、社交游戏、带交流的合作游戏。",
    source: "Literature estimate; perspective-taking training is emerging",
    evidenceStrength: "low",
  },
  risk_assessment: {
    category: "risk_assessment",
    trainabilityPct: 15,
    practiceHours: 30,
    methodEn: "BART-style exposure, poker/probability training, metacognitive journaling.",
    methodZh: "BART 式训练、扑克/概率训练、元认知日记。",
    source: "Literature estimate; risk training is trait-adjacent",
    evidenceStrength: "low",
  },
  resource_mgmt: {
    category: "resource_mgmt",
    trainabilityPct: 25,
    practiceHours: 40,
    methodEn:
      "UFOV training (Edwards et al. protocol), action-game play, attention-breadth drills.",
    methodZh: "UFOV 训练（Edwards 协议）、动作游戏、注意广度训练。",
    source: "Edwards et al. 2009; Bediou 2018 — UFOV is among the most trainable attention measures",
    evidenceStrength: "high",
  },
};

/**
 * Estimate improved score after N hours of evidence-based training.
 * Conservative linear model: score improves at (trainabilityPct / practiceHours) % per hour,
 * tapering at 70% of ceiling (diminishing returns).
 */
export function projectScoreAfterTraining(
  currentScore: number,
  category: TalentCategory,
  hoursPracticed: number
): number {
  const t = TRAINABILITY[category];
  if (!t) return currentScore;
  // Linear up to 70% of ceiling, then diminishing
  const maxGain = currentScore * (t.trainabilityPct / 100);
  const linearHours = t.practiceHours * 0.7;
  if (hoursPracticed <= linearHours) {
    return Math.min(99, currentScore + (maxGain * hoursPracticed) / linearHours);
  }
  // Diminishing returns for remaining 30%
  const remainingGain = maxGain * 0.3;
  const remainingHours = hoursPracticed - linearHours;
  const remainingProgress = Math.min(1, remainingHours / (t.practiceHours * 0.6));
  return Math.min(99, currentScore + maxGain * 0.7 + remainingGain * remainingProgress);
}

export function getTrainability(category: TalentCategory): TrainabilityInfo {
  return TRAINABILITY[category];
}
