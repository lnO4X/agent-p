import type { TalentCategory } from "@/types/talent";

export interface Question {
  id: number;
  zh: string;
  en: string;
  talent: TalentCategory;
  /** true = agreeing means higher score; false = agreeing means lower score */
  positive: boolean;
}

/**
 * 39 questions (3 per talent dimension).
 * Each rated 1-5 (Strongly Disagree → Strongly Agree).
 * Positive questions: agree = high score. Negative: agree = low score (inverted).
 */
export const QUESTIONS: Question[] = [
  // ─── Reaction Speed (3) ───
  { id: 1, zh: "在游戏中，我总是第一个发现敌人并开枪", en: "In games, I'm always the first to spot and shoot enemies", talent: "reaction_speed", positive: true },
  { id: 2, zh: "我打游戏时经常因为反应慢而被击杀", en: "I often get killed in games because I react too slowly", talent: "reaction_speed", positive: false },
  { id: 3, zh: "在需要快速反应的游戏中，我能保持稳定的高水平发挥", en: "I perform consistently well in games requiring fast reactions", talent: "reaction_speed", positive: true },

  // ─── Hand-Eye Coordination (3) ───
  { id: 4, zh: "我能精准地控制游戏角色到我想要的位置", en: "I can precisely control my character to the exact position I want", talent: "hand_eye_coord", positive: true },
  { id: 5, zh: "瞄准射击对我来说很轻松", en: "Aiming and shooting comes naturally to me", talent: "hand_eye_coord", positive: true },
  { id: 6, zh: "我在需要精确操作的游戏中常常手忙脚乱", en: "I often fumble in games requiring precise controls", talent: "hand_eye_coord", positive: false },

  // ─── Spatial Awareness (3) ───
  { id: 7, zh: "我很擅长在复杂的游戏地图中快速找到方向", en: "I'm great at quickly navigating complex game maps", talent: "spatial_awareness", positive: true },
  { id: 8, zh: "我能准确判断游戏中敌人和物体的距离", en: "I can accurately judge distances to enemies and objects in games", talent: "spatial_awareness", positive: true },
  { id: 9, zh: "我经常在游戏里迷路", en: "I often get lost in games", talent: "spatial_awareness", positive: false },

  // ─── Memory (3) ───
  { id: 10, zh: "我能记住大量游戏道具、技能、角色的数据", en: "I can memorize large amounts of game data — items, skills, characters", talent: "memory", positive: true },
  { id: 11, zh: "打了很多局后，我能记住每张地图的细节", en: "After many matches, I remember every detail of each map", talent: "memory", positive: true },
  { id: 12, zh: "我常常忘记游戏里的关键信息", en: "I often forget key information during gameplay", talent: "memory", positive: false },

  // ─── Strategy & Logic (3) ───
  { id: 13, zh: "我喜欢在游戏中提前规划几步行动", en: "I enjoy planning several moves ahead in games", talent: "strategy_logic", positive: true },
  { id: 14, zh: "面对复杂局面，我能迅速分析出最优策略", en: "When facing complex situations, I quickly analyze the best strategy", talent: "strategy_logic", positive: true },
  { id: 15, zh: "我更喜欢凭感觉打游戏，而不是深思熟虑", en: "I prefer playing by instinct rather than careful thinking", talent: "strategy_logic", positive: false },

  // ─── Rhythm Sense (3) ───
  { id: 16, zh: "我在音乐游戏或节奏相关的游戏中表现出色", en: "I excel at music/rhythm games", talent: "rhythm_sense", positive: true },
  { id: 17, zh: "我能找到游戏中的'节奏感'，让操作更流畅", en: "I can feel the 'rhythm' of a game and make my actions more fluid", talent: "rhythm_sense", positive: true },
  { id: 18, zh: "我对音乐和节奏不太敏感", en: "I'm not very sensitive to music and rhythm", talent: "rhythm_sense", positive: false },

  // ─── Pattern Recognition (3) ───
  { id: 19, zh: "我很快就能发现游戏中的规律和模式", en: "I quickly spot patterns and rules in games", talent: "pattern_recog", positive: true },
  { id: 20, zh: "我能从对手的行为中预测他们下一步的动作", en: "I can predict opponents' next moves from their behavior patterns", talent: "pattern_recog", positive: true },
  { id: 21, zh: "在解谜游戏中我常常需要很久才能找到线索", en: "In puzzle games, it takes me a long time to find clues", talent: "pattern_recog", positive: false },

  // ─── Multitasking (3) ───
  { id: 22, zh: "我能同时关注游戏中的多个目标和事件", en: "I can track multiple objectives and events simultaneously in games", talent: "multitasking", positive: true },
  { id: 23, zh: "边打团边看小地图对我来说很自然", en: "Fighting while watching the minimap comes naturally to me", talent: "multitasking", positive: true },
  { id: 24, zh: "当游戏中同时发生太多事情，我会手忙脚乱", en: "When too many things happen at once in a game, I get overwhelmed", talent: "multitasking", positive: false },

  // ─── Decision Speed (3) ───
  { id: 25, zh: "在游戏关键时刻，我能快速做出决定", en: "At critical moments in games, I can make decisions quickly", talent: "decision_speed", positive: true },
  { id: 26, zh: "我不会因为犹豫而错过最佳行动时机", en: "I don't miss the best moment to act because of hesitation", talent: "decision_speed", positive: true },
  { id: 27, zh: "面对选择时，我总是需要很长时间来权衡", en: "When facing choices, I always need a long time to weigh options", talent: "decision_speed", positive: false },

  // ─── Emotional Control (3) ───
  { id: 28, zh: "连续输几局后我仍能保持冷静", en: "I stay calm even after losing several games in a row", talent: "emotional_control", positive: true },
  { id: 29, zh: "愤怒或挫败不会影响我的游戏表现", en: "Anger or frustration doesn't affect my game performance", talent: "emotional_control", positive: true },
  { id: 30, zh: "我经常因为情绪波动导致发挥失常", en: "My performance often suffers due to emotional swings", talent: "emotional_control", positive: false },

  // ─── Teamwork (3) ───
  { id: 31, zh: "我享受和队友配合取得胜利的感觉", en: "I enjoy the feeling of winning through team coordination", talent: "teamwork_tendency", positive: true },
  { id: 32, zh: "我能有效地和队友沟通战术", en: "I can effectively communicate tactics with teammates", talent: "teamwork_tendency", positive: true },
  { id: 33, zh: "我更喜欢单人游戏，不太愿意和队友配合", en: "I prefer solo games and don't enjoy coordinating with teammates", talent: "teamwork_tendency", positive: false },

  // ─── Risk Assessment (3) ───
  { id: 34, zh: "我能准确判断什么时候该冒险、什么时候该保守", en: "I can accurately judge when to take risks and when to play safe", talent: "risk_assessment", positive: true },
  { id: 35, zh: "我的冒险决策通常能得到好的回报", en: "My risky decisions usually pay off", talent: "risk_assessment", positive: true },
  { id: 36, zh: "我经常在不该冒险的时候冲动行事", en: "I often act impulsively when I shouldn't take risks", talent: "risk_assessment", positive: false },

  // ─── Resource Management (3) ───
  { id: 37, zh: "我在游戏中很会管理金币、装备等资源", en: "I'm great at managing resources like gold, equipment, etc. in games", talent: "resource_mgmt", positive: true },
  { id: 38, zh: "我的资源利用效率通常比对手高", en: "My resource efficiency is usually higher than my opponents'", talent: "resource_mgmt", positive: true },
  { id: 39, zh: "我常常浪费游戏资源或者忘记收集重要道具", en: "I often waste game resources or forget to collect important items", talent: "resource_mgmt", positive: false },
];

/**
 * Convert questionnaire answers to 13 talent scores (0-100).
 * Answers are 1-5 (Strongly Disagree to Strongly Agree).
 */
export function answersToScores(
  answers: Record<number, number>
): Partial<Record<TalentCategory, number>> {
  const talentSums: Record<string, { total: number; count: number }> = {};

  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    if (answer == null) continue;

    // Normalize answer (1-5) to 0-100
    let score: number;
    if (q.positive) {
      score = ((answer - 1) / 4) * 100; // 1→0, 5→100
    } else {
      score = ((5 - answer) / 4) * 100; // 1→100, 5→0 (inverted)
    }

    if (!talentSums[q.talent]) {
      talentSums[q.talent] = { total: 0, count: 0 };
    }
    talentSums[q.talent].total += score;
    talentSums[q.talent].count += 1;
  }

  const result: Partial<Record<TalentCategory, number>> = {};
  for (const [talent, { total, count }] of Object.entries(talentSums)) {
    if (count > 0) {
      result[talent as TalentCategory] = Math.round(total / count);
    }
  }

  return result;
}

/** Shuffle questions in a deterministic-feeling but varied order */
export function getShuffledQuestions(): Question[] {
  // Group by talent, take from each group round-robin for variety
  const byTalent = new Map<TalentCategory, Question[]>();
  for (const q of QUESTIONS) {
    const list = byTalent.get(q.talent) || [];
    list.push(q);
    byTalent.set(q.talent, list);
  }

  const result: Question[] = [];
  const talents = [...byTalent.keys()];
  for (let round = 0; round < 3; round++) {
    for (const talent of talents) {
      const list = byTalent.get(talent)!;
      if (round < list.length) {
        result.push(list[round]);
      }
    }
  }
  return result;
}
