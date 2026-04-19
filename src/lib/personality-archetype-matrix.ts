import { PERSONALITY_TYPES, type PersonalityType } from "./personality-types";
import { ARCHETYPES, type Archetype } from "./archetype";

export interface PersonalityArchetypeCombination {
  /** Unique gaming behavior description for this exact combination */
  insight: string;
  insightEn: string;
  /** Specific strength this combination has */
  superpower: string;
  superpowerEn: string;
  /** Specific blindspot */
  blindspot: string;
  blindspotEn: string;
  /** Social compatibility score (0-100) — how well this combo meshes with random teammates */
  socialScore: number;
}

// ==================== DIMENSION LABELS ====================

interface DimensionLabel {
  zh: string;
  en: string;
}

const EI_LABELS: Record<"E" | "I", DimensionLabel> = {
  E: { zh: "外向型", en: "extroverted" },
  I: { zh: "内向型", en: "introverted" },
};

// ==================== TALENT CATEGORY LABELS ====================

const TALENT_LABELS: Record<string, { zh: string; en: string }> = {
  reaction_speed: { zh: "反应速度", en: "reaction speed" },
  hand_eye_coord: { zh: "手眼协调", en: "hand-eye coordination" },
  spatial_awareness: { zh: "空间感知", en: "spatial awareness" },
  memory: { zh: "记忆力", en: "memory" },
  strategy_logic: { zh: "反应抑制", en: "response inhibition" },
  rhythm_sense: { zh: "节奏感", en: "rhythm sense" },
  pattern_recog: { zh: "模式识别", en: "pattern recognition" },
  multitasking: { zh: "多线程操作", en: "multitasking" },
  decision_speed: { zh: "决策速度", en: "decision speed" },
  emotional_control: { zh: "干扰抑制", en: "interference suppression" },
  teamwork_tendency: { zh: "视角转换", en: "perspective taking" },
  risk_assessment: { zh: "风险评估", en: "risk assessment" },
  resource_mgmt: { zh: "视觉注意广度", en: "visual attention breadth" },
};

// ==================== HELPER FUNCTIONS ====================

function isExtraverted(p: PersonalityType): boolean {
  return p.dimensions.ei >= 0.5;
}
function isIntuitive(p: PersonalityType): boolean {
  return p.dimensions.sn >= 0.5;
}
function isThinking(p: PersonalityType): boolean {
  return p.dimensions.tf < 0.5;
}
function isJudging(p: PersonalityType): boolean {
  return p.dimensions.jp < 0.5;
}

// ==================== INSIGHT GENERATION ====================

function generateInsight(p: PersonalityType, a: Archetype): { zh: string; en: string } {
  const E = isExtraverted(p);
  const N = isIntuitive(p);
  const T = isThinking(p);
  const J = isJudging(p);
  const strong = TALENT_LABELS[a.strongTalent] || { zh: "核心天赋", en: "core talent" };
  const weak = TALENT_LABELS[a.weakTalent] || { zh: "短板", en: "weakness" };

  // Build unique insight from dimension × archetype intersection
  let zh = "";
  let en = "";

  if (N && T) {
    // NT: Analytical + strategic
    zh = `你用${EI_LABELS[E ? "E" : "I"].zh}的分析思维驾驭${a.name}的${strong.zh}。`;
    en = `You apply ${EI_LABELS[E ? "E" : "I"].en} analytical thinking to harness the ${a.nameEn}'s ${strong.en}.`;
    if (J) {
      zh += `每一步都经过精密计算，你把${strong.zh}变成了一门精确科学。`;
      en += ` Every move is precisely calculated — you turn ${strong.en} into an exact science.`;
    } else {
      zh += `但你拒绝墨守成规，总能找到连老手都没想到的创新打法。`;
      en += ` But you refuse to follow the playbook, always finding creative approaches that even veterans haven't considered.`;
    }
  } else if (N && !T) {
    // NF: Intuitive + empathetic
    zh = `作为${p.name}，你把${a.name}的天赋赋予了灵魂。你的${strong.zh}不只是技术，而是一种直觉——`;
    en = `As the ${p.nameEn}, you breathe soul into the ${a.nameEn}'s talent. Your ${strong.en} isn't just skill — it's pure intuition — `;
    if (E) {
      zh += `你能感受到队友的情绪波动，在关键时刻用实力和气场稳定全场。`;
      en += `you sense your teammates' emotional shifts and stabilize the whole team with presence and performance at critical moments.`;
    } else {
      zh += `你在沉默中洞察一切，对手的意图在你眼里如同翻开的书页。`;
      en += `in silence you perceive everything — opponents' intentions read like an open book.`;
    }
  } else if (!N && T) {
    // ST: Practical + logical
    zh = `你是${a.name}中最务实的类型。${strong.zh}在你手中不是华丽的表演，而是精确的工具——`;
    en = `You're the most pragmatic kind of ${a.nameEn}. ${strong.en} in your hands isn't flashy performance — it's a precision tool — `;
    if (J) {
      zh += `按照验证过的方法论稳定输出，你是团队最稳定的基石。`;
      en += `delivering consistent output through proven methodology. You're the team's most reliable foundation.`;
    } else {
      zh += `随时根据局势调整策略，你的应变能力让对手永远摸不透你。`;
      en += `adapting strategy on the fly based on the situation. Your adaptability keeps opponents guessing.`;
    }
  } else {
    // SF: Practical + empathetic
    zh = `你把${a.name}的力量融入了与人的连接中。你的${strong.zh}不只服务于自己——`;
    en = `You channel the ${a.nameEn}'s power through human connection. Your ${strong.en} doesn't just serve yourself — `;
    if (E) {
      zh += `你是队伍的核心节拍器，带动每个人的状态，让整支队伍进入心流。`;
      en += `you're the team's metronome, setting the pace that pulls everyone into a flow state.`;
    } else {
      zh += `你默默守护着团队的薄弱环节，用细腻的观察弥补${weak.zh}的不足。`;
      en += `you quietly protect the team's weak points, using careful observation to compensate for gaps in ${weak.en}.`;
    }
  }

  return { zh, en };
}

// ==================== SUPERPOWER GENERATION ====================

function generateSuperpower(p: PersonalityType, a: Archetype): { zh: string; en: string } {
  const E = isExtraverted(p);
  const N = isIntuitive(p);
  const T = isThinking(p);
  const J = isJudging(p);
  const strong = TALENT_LABELS[a.strongTalent] || { zh: "核心天赋", en: "core talent" };

  // Each combination of dominant personality dimension + archetype strength creates a unique superpower
  if (T && J) {
    return {
      zh: `系统化的${strong.zh}——你能把${a.name}的优势变成可复制的方法论${E ? "，并高效传授给队友" : ""}`,
      en: `Systematized ${strong.en} — you turn the ${a.nameEn}'s edge into a repeatable methodology${E ? " and efficiently teach it to teammates" : ""}`,
    };
  }
  if (T && !J) {
    return {
      zh: `即兴的逻辑推演——在${a.name}的${strong.zh}基础上，你能瞬间分析出最优解${E ? "并大胆执行" : "，哪怕没人理解你的思路"}`,
      en: `Improvised logical deduction — building on the ${a.nameEn}'s ${strong.en}, you instantly analyze the optimal play${E ? " and boldly execute it" : ", even when nobody understands your reasoning"}`,
    };
  }
  if (!T && J) {
    return {
      zh: `有温度的领导力——你在发挥${a.name}${strong.zh}优势的同时，${E ? "用共情能力凝聚团队的战斗意志" : "用细腻的洞察力预判队友的需求"}`,
      en: `Warm leadership — while leveraging the ${a.nameEn}'s ${strong.en}, you ${E ? "unite the team's fighting spirit through empathy" : "anticipate teammates' needs through perceptive observation"}`,
    };
  }
  // F + P
  return {
    zh: `直觉驱动的创造力——${a.name}的${strong.zh}在你手中${N ? "变成了艺术般的即兴表演" : "变成了充满人情味的温暖守护"}${E ? "，感染身边每一个人" : ""}`,
    en: `Intuition-driven creativity — the ${a.nameEn}'s ${strong.en} becomes ${N ? "an art-like improvisational performance" : "a warm, human-centered guardianship"} in your hands${E ? ", inspiring everyone around you" : ""}`,
  };
}

// ==================== BLINDSPOT GENERATION ====================

function generateBlindspot(p: PersonalityType, a: Archetype): { zh: string; en: string } {
  const E = isExtraverted(p);
  const N = isIntuitive(p);
  const T = isThinking(p);
  const weak = TALENT_LABELS[a.weakTalent] || { zh: "短板", en: "weakness" };

  if (T && N) {
    return {
      zh: `过度理论化——你在追求最优解时容易忽视${weak.zh}，而且${E ? "可能在指挥队友时太过强硬" : "容易陷入分析瘫痪，错过行动时机"}`,
      en: `Over-theorizing — chasing the optimal play, you neglect ${weak.en}, and ${E ? "may come across as too forceful when directing teammates" : "risk falling into analysis paralysis, missing the window to act"}`,
    };
  }
  if (!T && N) {
    return {
      zh: `理想主义的陷阱——你对游戏的美好愿景可能让你忽视${weak.zh}的硬伤，${E ? "过度乐观地评估队伍的实力" : "在挫折面前比别人更容易心态崩溃"}`,
      en: `The idealism trap — your vision of the perfect play may blind you to your ${weak.en} deficit, ${E ? "leading you to overestimate the team's capabilities" : "making you more vulnerable to tilt than others when things go wrong"}`,
    };
  }
  if (T && !N) {
    return {
      zh: `经验主义的局限——你只相信验证过的方法，但${weak.zh}恰恰需要超越经验的突破，${E ? "而且你可能低估新人的潜力" : "而且你不善于在规则突变时即时应变"}`,
      en: `The empiricism trap — you only trust proven methods, but ${weak.en} demands breakthroughs beyond experience, ${E ? "and you may underestimate newcomers' potential" : "and you struggle to adapt on the fly when rules suddenly change"}`,
    };
  }
  // F + S
  return {
    zh: `舒适区依赖——你在熟悉的环境中表现出色，但${weak.zh}暴露了你的极限，${E ? "过度关注团队和谐可能牺牲竞技效率" : "面对陌生局面时信心容易动摇"}`,
    en: `Comfort zone dependency — you excel in familiar environments, but ${weak.en} exposes your ceiling, ${E ? "and prioritizing team harmony may sacrifice competitive efficiency" : "and your confidence wavers when facing unfamiliar situations"}`,
    };
}

// ==================== SOCIAL SCORE ====================

function calculateSocialScore(p: PersonalityType, a: Archetype): number {
  let score = 50; // baseline

  // Extraversion boosts social compatibility
  score += (p.dimensions.ei - 0.5) * 20; // E adds up to +10, I subtracts up to -10

  // Feeling types get along better in random teams
  if (p.dimensions.tf >= 0.5) score += 8;

  // Judging types are more predictable/reliable teammates
  if (p.dimensions.jp < 0.5) score += 5;

  // Teamwork-oriented archetypes boost social
  if (a.strongTalent === "teamwork_tendency") score += 15;
  if (a.weakTalent === "teamwork_tendency") score -= 10;

  // Emotional control helps social interactions
  if (a.weakTalent === "emotional_control") score -= 8;
  if (a.strongTalent === "emotional_control") score += 5;

  // Clamp 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ==================== PUBLIC API ====================

/**
 * Get the combination analysis for a personality type + archetype pair.
 * Uses algorithmic generation based on cognitive functions + archetype traits
 * rather than 256 hand-written entries.
 *
 * @returns null if either code is invalid
 */
export function getCombination(
  personalityCode: string,
  archetypeId: string
): PersonalityArchetypeCombination | null {
  const personality = PERSONALITY_TYPES[personalityCode.toUpperCase()];
  const archetype = ARCHETYPES[archetypeId];

  if (!personality || !archetype) return null;

  const insight = generateInsight(personality, archetype);
  const superpower = generateSuperpower(personality, archetype);
  const blindspot = generateBlindspot(personality, archetype);
  const socialScore = calculateSocialScore(personality, archetype);

  return {
    insight: insight.zh,
    insightEn: insight.en,
    superpower: superpower.zh,
    superpowerEn: superpower.en,
    blindspot: blindspot.zh,
    blindspotEn: blindspot.en,
    socialScore,
  };
}

/**
 * Get all valid archetype IDs for use in combination lookups.
 */
export function getArchetypeIds(): string[] {
  return Object.keys(ARCHETYPES);
}
