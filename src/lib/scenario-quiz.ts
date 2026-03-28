import type { TalentCategory } from "@/types/talent";
import { TALENT_CATEGORIES } from "@/types/talent";
import { scoreToArchetype } from "@/lib/archetype";

// ==================== TYPES ====================

export interface ScenarioChoice {
  id: string; // "a", "b", "c", "d"
  zh: string;
  en: string;
  /** Talent dimension weights — each choice affects multiple dimensions (-2 to +2) */
  weights: Partial<Record<TalentCategory, number>>;
}

export interface ScenarioQuestion {
  id: number;
  zh: string;
  en: string;
  choices: ScenarioChoice[];
}

// ==================== 7 SCENARIO QUESTIONS ====================

export const SCENARIO_QUESTIONS: ScenarioQuestion[] = [
  // Q1: Team Crisis — tests: teamwork_tendency, decision_speed, emotional_control
  {
    id: 1,
    zh: "队友刚打出一波灾难级操作，你的队伍正在崩盘。你会...",
    en: "Your teammate just made a terrible play and your team is losing. You...",
    choices: [
      {
        id: "a",
        zh: "稳住大家——我们还有机会，专注下一波团战",
        en: "Rally everyone — we've got this, focus on next fight",
        weights: { teamwork_tendency: 2, emotional_control: 1 },
      },
      {
        id: "b",
        zh: "自己单干吧——靠他们不如靠自己",
        en: "Go solo and try to carry — can't trust them",
        weights: { decision_speed: 2, teamwork_tendency: -1 },
      },
      {
        id: "c",
        zh: "冷静分析刚才哪里出了问题，调整战术",
        en: "Analyze what went wrong and adjust the plan",
        weights: { strategy_logic: 2, emotional_control: 1 },
      },
      {
        id: "d",
        zh: "打字说'没事haha'，内心已经在咆哮",
        en: "Type 'it's fine lol' while internally screaming",
        weights: { emotional_control: -1, teamwork_tendency: 1 },
      },
    ],
  },

  // Q2: Loot Discovery — tests: risk_assessment, resource_mgmt, memory
  {
    id: 2,
    zh: "你在一个危险区域发现了传说级装备，离安全区只有2分钟。你会...",
    en: "You find a legendary item but it's in a dangerous zone with 2 minutes left. You...",
    choices: [
      {
        id: "a",
        zh: "全力冲——传说装备值得一死",
        en: "Full send — legendary loot is worth dying for",
        weights: { risk_assessment: -2, decision_speed: 1 },
      },
      {
        id: "b",
        zh: "先算算风险和收益，再做决定",
        en: "Calculate the risk vs reward, then decide",
        weights: { strategy_logic: 1, risk_assessment: 2 },
      },
      {
        id: "c",
        zh: "记住位置，准备好了再回来拿",
        en: "Memorize the location and come back better prepared",
        weights: { memory: 2, resource_mgmt: 1 },
      },
      {
        id: "d",
        zh: "抢了就跑，立刻找出口",
        en: "Grab it and immediately look for the exit",
        weights: { hand_eye_coord: 1, spatial_awareness: 1 },
      },
    ],
  },

  // Q3: New Game — tests: pattern_recog, strategy_logic, multitasking
  {
    id: 3,
    zh: "开了一个从没玩过的新游戏，你的第一反应是...",
    en: "You start a game you've never played before. First thing you do?",
    choices: [
      {
        id: "a",
        zh: "跳过新手教程，直接上手——边玩边摸索",
        en: "Skip tutorial, jump in — I'll figure it out",
        weights: { decision_speed: 1, pattern_recog: 1 },
      },
      {
        id: "b",
        zh: "先看30分钟攻略再动手",
        en: "Watch a 30-minute guide before touching the game",
        weights: { strategy_logic: 2, memory: 1 },
      },
      {
        id: "c",
        zh: "做完教程，然后把所有设置和键位都调一遍",
        en: "Tutorial + tinker with all the settings and keybinds",
        weights: { multitasking: 1, spatial_awareness: 1 },
      },
      {
        id: "d",
        zh: "叫朋友带我一起玩，边打边教",
        en: "Ask a friend to play with me and explain as we go",
        weights: { teamwork_tendency: 2, rhythm_sense: 1 },
      },
    ],
  },

  // Q4: Boss Fight — tests: hand_eye_coord, reaction_speed, spatial_awareness
  {
    id: 4,
    zh: "你遇到了一个有复杂攻击模式的Boss。你的打法是...",
    en: "You're fighting a boss with a complex attack pattern. Your approach?",
    choices: [
      {
        id: "a",
        zh: "全靠本能闪避——反应力不会说谎",
        en: "Dodge everything on instinct — reflexes don't lie",
        weights: { reaction_speed: 2, hand_eye_coord: 1 },
      },
      {
        id: "b",
        zh: "先死几次摸清规律，然后完美通关",
        en: "Die a few times to learn the pattern, then execute perfectly",
        weights: { pattern_recog: 2, memory: 1 },
      },
      {
        id: "c",
        zh: "拉远距离，找安全位置输出",
        en: "Stay at range and find safe positions",
        weights: { spatial_awareness: 2, resource_mgmt: 1 },
      },
      {
        id: "d",
        zh: "去练级，回来无脑碾压它",
        en: "Overlevel and brute force it",
        weights: { resource_mgmt: 2, decision_speed: 1 },
      },
    ],
  },

  // Q5: Competition — tests: emotional_control, rhythm_sense, decision_speed
  {
    id: 5,
    zh: "你在锦标赛中0:2落后。你的反应是...",
    en: "You're in a tournament match and you're down 0-2. You...",
    choices: [
      {
        id: "a",
        zh: "保持节奏——打自己的，别管比分",
        en: "Stay zen — play YOUR game, ignore the score",
        weights: { emotional_control: 2, rhythm_sense: 1 },
      },
      {
        id: "b",
        zh: "全面压上——反正没什么可失去的",
        en: "Go hyper-aggressive — nothing to lose",
        weights: { risk_assessment: -1, decision_speed: 2 },
      },
      {
        id: "c",
        zh: "利用间隙研究对手打法，针对性反制",
        en: "Study their playstyle between rounds and counter it",
        weights: { pattern_recog: 1, strategy_logic: 2 },
      },
      {
        id: "d",
        zh: "叫暂停，重新调整心态",
        en: "Call a timeout and reset mentally",
        weights: { emotional_control: 1, multitasking: 1 },
      },
    ],
  },

  // Q6: Open World — tests: spatial_awareness, memory, resource_mgmt
  {
    id: 6,
    zh: "你进入了一个巨大的开放世界游戏。你怎么探索？",
    en: "You discover a massive open world game. How do you explore?",
    choices: [
      {
        id: "a",
        zh: "直奔地图上每一个问号标记",
        en: "Beeline to every question mark on the map",
        weights: { spatial_awareness: 2, decision_speed: 1 },
      },
      {
        id: "b",
        zh: "无视地图，哪里好看走哪里",
        en: "Ignore the map, just wander where it looks cool",
        weights: { rhythm_sense: 2, risk_assessment: -1 },
      },
      {
        id: "c",
        zh: "一个区域一个区域系统地清，100%完成度",
        en: "Systematically clear each region, 100% completion",
        weights: { resource_mgmt: 2, memory: 1 },
      },
      {
        id: "d",
        zh: "跟着主线走，顺路的支线做一做",
        en: "Follow the main story, explore only what's on the way",
        weights: { strategy_logic: 1, decision_speed: 1 },
      },
    ],
  },

  // Q7: Multiplayer Role — tests: teamwork_tendency, multitasking, hand_eye_coord
  {
    id: 7,
    zh: "在团队游戏中，你最自然地选择什么角色？",
    en: "In a team game, which role do you naturally gravitate to?",
    choices: [
      {
        id: "a",
        zh: "输出/Carry——我要人头和高光时刻",
        en: "DPS / Carry — I want the kills and the glory",
        weights: { hand_eye_coord: 2, reaction_speed: 1 },
      },
      {
        id: "b",
        zh: "辅助/奶妈——保住队友就是胜利",
        en: "Support / Healer — keeping the team alive is satisfying",
        weights: { teamwork_tendency: 2, multitasking: 1 },
      },
      {
        id: "c",
        zh: "坦克/前排——我扛伤害你们输出",
        en: "Tank / Frontline — I'll take the hits for the team",
        weights: { emotional_control: 1, spatial_awareness: 1 },
      },
      {
        id: "d",
        zh: "指挥/队长——总得有人来做决策",
        en: "Shotcaller / Captain — someone needs to lead",
        weights: { strategy_logic: 1, teamwork_tendency: 1, multitasking: 1 },
      },
    ],
  },
];

// ==================== SCORING ====================

/**
 * Convert scenario quiz answers to an archetype.
 * @param answers Array of 7 choice IDs (e.g. ["a", "c", "b", "a", "d", "c", "b"])
 * @returns The determined archetype
 */
export function scenarioToArchetype(answers: string[]) {
  // 1. Sum raw weights from all selected choices
  const rawWeights: Partial<Record<TalentCategory, number>> = {};

  answers.forEach((choiceId, qIndex) => {
    const question = SCENARIO_QUESTIONS[qIndex];
    if (!question) return;
    const choice = question.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    for (const [talent, weight] of Object.entries(choice.weights)) {
      const key = talent as TalentCategory;
      rawWeights[key] = (rawWeights[key] ?? 0) + weight;
    }
  });

  // 2. Normalize to 0-100 range
  // Each dimension can receive roughly -4 to +6 total weight across all questions.
  // We map this to 0-100 with 0 raw → 50 (neutral), using a sigmoid-like clamped linear.
  const talentScores: Partial<Record<TalentCategory, number>> = {};

  for (const talent of TALENT_CATEGORIES) {
    const raw = rawWeights[talent] ?? 0;
    // Linear mapping: raw weight of 0 → 50, each point → +12.5 points
    // Clamped to [10, 90] to avoid extreme scores from just 7 questions
    const mapped = 50 + raw * 12.5;
    talentScores[talent] = Math.max(10, Math.min(90, Math.round(mapped)));
  }

  // 3. Use existing archetype determination
  const archetype = scoreToArchetype(talentScores);

  return { archetype, talentScores };
}
