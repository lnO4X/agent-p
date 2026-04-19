import type { TalentCategory, TalentProfile } from "@/types/talent";
import type { GameGenreId } from "./genre-cognitive-fit";

export interface RoleProfile {
  id: string;
  genreId: GameGenreId;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  keyDimensions: { cat: TalentCategory; weight: number }[];
  source: string;
}

/**
 * Within-genre role cognitive profiles. Derived from role descriptions
 * and genre cognitive-load research. Treat as hypotheses, not settled
 * psychometric truth.
 */
export const ROLE_PROFILES: RoleProfile[] = [
  // === FPS ===
  {
    id: "fps-rifler",
    genreId: "fps",
    nameEn: "Rifler / Duelist",
    nameZh: "步枪位 / 决斗位",
    descriptionEn:
      "Front-line 1v1 mechanical specialist. Prioritises reaction speed + aim.",
    descriptionZh: "前线 1v1 机械操作专家。重反应速度 + 枪法。",
    keyDimensions: [
      { cat: "reaction_speed", weight: 1.0 },
      { cat: "hand_eye_coord", weight: 1.0 },
      { cat: "pattern_recog", weight: 0.7 },
    ],
    source: "Role-typical emphasis",
  },
  {
    id: "fps-awper",
    genreId: "fps",
    nameEn: "AWPer / Sniper",
    nameZh: "狙击位",
    descriptionEn:
      "Precision single-shot specialist. Prioritises patience, attention breadth, pre-aim.",
    descriptionZh: "精确单发专家。重耐心、视野、预瞄。",
    keyDimensions: [
      { cat: "resource_mgmt", weight: 1.0 }, // attention breadth
      { cat: "hand_eye_coord", weight: 0.8 },
      { cat: "pattern_recog", weight: 0.8 },
      { cat: "emotional_control", weight: 0.7 },
    ],
    source: "Role-typical emphasis",
  },
  {
    id: "fps-igl",
    genreId: "fps",
    nameEn: "IGL (In-Game Leader)",
    nameZh: "IGL 指挥位",
    descriptionEn:
      "Strategic shot-caller. Prioritises memory, task-switching, decision-making under pressure.",
    descriptionZh: "战略指挥。重记忆、任务切换、压力下决策。",
    keyDimensions: [
      { cat: "memory", weight: 1.0 },
      { cat: "strategy_logic", weight: 1.0 },
      { cat: "decision_speed", weight: 0.9 },
      { cat: "teamwork_tendency", weight: 0.7 },
    ],
    source: "Role-typical emphasis",
  },
  {
    id: "fps-support",
    genreId: "fps",
    nameEn: "Support / Lurker",
    nameZh: "辅助 / 潜伏",
    descriptionEn:
      "Utility and information specialist. Prioritises multitasking and spatial awareness.",
    descriptionZh: "道具与情报专家。重多任务与空间意识。",
    keyDimensions: [
      { cat: "multitasking", weight: 1.0 },
      { cat: "spatial_awareness", weight: 0.9 },
      { cat: "teamwork_tendency", weight: 0.8 },
    ],
    source: "Role-typical emphasis",
  },
  // === MOBA ===
  {
    id: "moba-adc",
    genreId: "moba",
    nameEn: "ADC / Carry",
    nameZh: "ADC / 大核",
    descriptionEn:
      "Late-game damage carry. Prioritises reaction speed + multitasking + positioning.",
    descriptionZh: "后期输出核心。重反应速度 + 多任务 + 站位。",
    keyDimensions: [
      { cat: "reaction_speed", weight: 1.0 },
      { cat: "multitasking", weight: 0.9 },
      { cat: "hand_eye_coord", weight: 0.9 },
      { cat: "pattern_recog", weight: 0.7 },
    ],
    source: "Role-typical emphasis",
  },
  {
    id: "moba-support",
    genreId: "moba",
    nameEn: "Support",
    nameZh: "辅助",
    descriptionEn:
      "Vision + protection + initiation. Prioritises map awareness + inhibitory control.",
    descriptionZh: "视野 + 保护 + 开团。重地图意识 + 抑制控制。",
    keyDimensions: [
      { cat: "spatial_awareness", weight: 1.0 },
      { cat: "strategy_logic", weight: 0.9 }, // response inhibition
      { cat: "teamwork_tendency", weight: 0.9 },
      { cat: "decision_speed", weight: 0.7 },
    ],
    source: "Role-typical emphasis",
  },
  {
    id: "moba-jungle",
    genreId: "moba",
    nameEn: "Jungle",
    nameZh: "打野",
    descriptionEn:
      "Pathing + pressure + objective control. Prioritises strategic thinking + multitasking.",
    descriptionZh: "野区路线 + 压力 + 资源控制。重战略 + 多任务。",
    keyDimensions: [
      { cat: "strategy_logic", weight: 1.0 },
      { cat: "multitasking", weight: 1.0 },
      { cat: "memory", weight: 0.9 },
      { cat: "risk_assessment", weight: 0.8 },
    ],
    source: "Role-typical emphasis",
  },
  {
    id: "moba-mid",
    genreId: "moba",
    nameEn: "Mid Lane",
    nameZh: "中单",
    descriptionEn:
      "Tempo + roam + mechanical ceiling. Prioritises pattern recognition + task switching.",
    descriptionZh: "节奏 + 游走 + 机械上限。重模式识别 + 任务切换。",
    keyDimensions: [
      { cat: "pattern_recog", weight: 1.0 },
      { cat: "strategy_logic", weight: 0.9 },
      { cat: "hand_eye_coord", weight: 0.8 },
      { cat: "decision_speed", weight: 0.8 },
    ],
    source: "Role-typical emphasis",
  },
  {
    id: "moba-top",
    genreId: "moba",
    nameEn: "Top Lane",
    nameZh: "上单",
    descriptionEn:
      "Isolated lane specialist. Prioritises emotional control + risk assessment.",
    descriptionZh: "孤立线路专家。重情绪（干扰抑制）+ 风险评估。",
    keyDimensions: [
      { cat: "emotional_control", weight: 1.0 },
      { cat: "risk_assessment", weight: 0.9 },
      { cat: "hand_eye_coord", weight: 0.8 },
    ],
    source: "Role-typical emphasis",
  },
  // === RTS ===
  {
    id: "rts-macro",
    genreId: "rts",
    nameEn: "Macro / Economy",
    nameZh: "运营 / 经济流",
    descriptionEn:
      "Long-game economy manager. Prioritises resource management + WM + strategic depth.",
    descriptionZh: "长期经济管理。重资源 + 记忆 + 战略深度。",
    keyDimensions: [
      { cat: "resource_mgmt", weight: 1.0 },
      { cat: "memory", weight: 1.0 },
      { cat: "strategy_logic", weight: 0.9 },
    ],
    source: "Role-typical emphasis",
  },
  {
    id: "rts-micro",
    genreId: "rts",
    nameEn: "Micro / APM",
    nameZh: "微操 / APM",
    descriptionEn:
      "Unit-control specialist. Prioritises hand-eye + multitasking + reaction.",
    descriptionZh: "单位操作专家。重手眼 + 多任务 + 反应。",
    keyDimensions: [
      { cat: "hand_eye_coord", weight: 1.0 },
      { cat: "multitasking", weight: 1.0 },
      { cat: "reaction_speed", weight: 0.9 },
    ],
    source: "Role-typical emphasis",
  },
];

export interface RoleFitResult {
  role: RoleProfile;
  fitScore: number;
  why: string[];
}

/**
 * Compute within-genre role fits for a user's talent profile.
 */
export function computeRoleFit(
  profile: TalentProfile,
  genreId?: GameGenreId
): RoleFitResult[] {
  const candidates = genreId
    ? ROLE_PROFILES.filter((r) => r.genreId === genreId)
    : ROLE_PROFILES;
  const results = candidates.map((role) => {
    let weightedSum = 0;
    let totalWeight = 0;
    const contributingDims: {
      cat: TalentCategory;
      score: number;
      weight: number;
    }[] = [];
    for (const { cat, weight } of role.keyDimensions) {
      const s = profile.scores[cat] ?? 50;
      weightedSum += s * weight;
      totalWeight += weight;
      contributingDims.push({ cat, score: s, weight });
    }
    const fitScore = totalWeight > 0 ? weightedSum / totalWeight : 50;
    const top = [...contributingDims]
      .sort((a, b) => b.score * b.weight - a.score * a.weight)
      .slice(0, 2);
    const why = top.map(
      (d) => `Strong ${d.cat.replace(/_/g, " ")} (${Math.round(d.score)}/100)`
    );
    return { role, fitScore: Math.round(fitScore), why };
  });
  return results.sort((a, b) => b.fitScore - a.fitScore);
}

export function getTopRoleFits(
  profile: TalentProfile,
  n: number = 3
): RoleFitResult[] {
  return computeRoleFit(profile).slice(0, n);
}
