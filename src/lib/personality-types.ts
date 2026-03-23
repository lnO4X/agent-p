/**
 * 16 Jungian personality types — the universal "what type are you?" system.
 * Legal: Uses public-domain Jungian theory. Never references any trademarked name.
 * Brand name: "Player Personality Profile" / "玩家性格分析"
 */

export interface PersonalityType {
  code: string; // "INTJ", "ENFP", etc.
  name: string; // Chinese name
  nameEn: string; // English name
  emoji: string; // Representative emoji
  /** Brief gaming-context description */
  gaming: string;
  gamingEn: string;
  /** Cognitive functions stack [dominant, auxiliary, tertiary, inferior] */
  functions: string[];
  /** Dimension scores: E/I, S/N, T/F, J/P as 0-1 (0=first letter, 1=second letter) */
  dimensions: { ei: number; sn: number; tf: number; jp: number };
}

export const PERSONALITY_TYPES: Record<string, PersonalityType> = {
  INTJ: {
    code: "INTJ",
    name: "策略大师",
    nameEn: "The Strategist",
    emoji: "♟️",
    gaming:
      "你是游戏中的军师，每一步都是精心计算的结果。别人在玩游戏，你在解方程——从装备搭配到时间管理，一切都有最优解。",
    gamingEn:
      "You're the mastermind behind every play. While others game by instinct, you solve equations — from gear optimization to resource timing, everything has an optimal solution.",
    functions: ["Ni", "Te", "Fi", "Se"],
    dimensions: { ei: 0.2, sn: 0.8, tf: 0.2, jp: 0.2 },
  },
  INTP: {
    code: "INTP",
    name: "理论家",
    nameEn: "The Theorist",
    emoji: "🔬",
    gaming:
      "你比任何人都更了解游戏的底层机制。伤害公式、帧数据、隐藏参数——你不只是玩游戏，你在逆向工程它。",
    gamingEn:
      "You understand game mechanics deeper than anyone. Damage formulas, frame data, hidden parameters — you don't just play the game, you reverse-engineer it.",
    functions: ["Ti", "Ne", "Si", "Fe"],
    dimensions: { ei: 0.2, sn: 0.8, tf: 0.2, jp: 0.8 },
  },
  ENTJ: {
    code: "ENTJ",
    name: "指挥官",
    nameEn: "The Commander",
    emoji: "👑",
    gaming:
      "你天生就是团队的指挥核心。你不只是打得好，你能让整个团队打得更好——战术部署、资源分配、节奏把控，都在你的掌控之中。",
    gamingEn:
      "You're a natural shotcaller. You don't just play well — you make the entire team play better. Tactical deployment, resource allocation, tempo control — all under your command.",
    functions: ["Te", "Ni", "Se", "Fi"],
    dimensions: { ei: 0.8, sn: 0.8, tf: 0.2, jp: 0.2 },
  },
  ENTP: {
    code: "ENTP",
    name: "发明家",
    nameEn: "The Innovator",
    emoji: "💡",
    gaming:
      "你是非常规战术的发明者。当所有人都在走同一条路时，你偏要找出没人想到的骚操作，而且还真能赢。",
    gamingEn:
      "You invent unconventional strategies. When everyone follows the meta, you find the weird off-meta strat that nobody expects — and somehow it works.",
    functions: ["Ne", "Ti", "Fe", "Si"],
    dimensions: { ei: 0.8, sn: 0.8, tf: 0.2, jp: 0.8 },
  },
  INFJ: {
    code: "INFJ",
    name: "先知",
    nameEn: "The Visionary",
    emoji: "🔮",
    gaming:
      "你拥有读懂对手的直觉。你不需要看数据就知道对手下一步要做什么——这种近乎预言般的洞察力让你在对抗中总是先人一步。",
    gamingEn:
      "You have an uncanny intuition for reading opponents. You know what they'll do next without checking data — this prophetic insight keeps you one step ahead in every duel.",
    functions: ["Ni", "Fe", "Ti", "Se"],
    dimensions: { ei: 0.2, sn: 0.8, tf: 0.8, jp: 0.2 },
  },
  INFP: {
    code: "INFP",
    name: "理想家",
    nameEn: "The Idealist",
    emoji: "🌙",
    gaming:
      "你玩游戏是为了体验另一个世界。剧情、角色、氛围——你是为了沉浸感而来的。一段好的叙事能让你热泪盈眶，一个丰富的世界让你流连忘返。",
    gamingEn:
      "You game to experience other worlds. Story, characters, atmosphere — you're here for the immersion. A great narrative moves you to tears, and a rich open world keeps you exploring for hours.",
    functions: ["Fi", "Ne", "Si", "Te"],
    dimensions: { ei: 0.2, sn: 0.8, tf: 0.8, jp: 0.8 },
  },
  ENFJ: {
    code: "ENFJ",
    name: "导师",
    nameEn: "The Mentor",
    emoji: "🌟",
    gaming:
      "你是队伍中的精神领袖。你不仅打得好，还能把队友的潜力激发出来。你天生擅长鼓励、教学，整个团队因为你的存在而变得更强。",
    gamingEn:
      "You're the team's spiritual leader. You play well, but more importantly, you bring out the best in your teammates. Encouragement and teaching come naturally — the whole team levels up with you around.",
    functions: ["Fe", "Ni", "Se", "Ti"],
    dimensions: { ei: 0.8, sn: 0.8, tf: 0.8, jp: 0.2 },
  },
  ENFP: {
    code: "ENFP",
    name: "冒险家",
    nameEn: "The Explorer",
    emoji: "🦋",
    gaming:
      "你是游戏世界里最自由的灵魂。每个新版本、每个新英雄、每种新玩法都让你兴奋不已。你玩的游戏比谁都多，但也比谁都更快换坑。",
    gamingEn:
      "You're the freest spirit in gaming. Every new patch, new hero, and new mechanic excites you. You've tried more games than anyone — but you also move on faster than anyone.",
    functions: ["Ne", "Fi", "Te", "Si"],
    dimensions: { ei: 0.8, sn: 0.8, tf: 0.8, jp: 0.8 },
  },
  ISTJ: {
    code: "ISTJ",
    name: "执行者",
    nameEn: "The Executor",
    emoji: "🏛️",
    gaming:
      "你是游戏中最可靠的存在。攻略研究透彻，操作精准到位，策略一旦验证有效就坚定执行。队友把后背交给你，绝对放心。",
    gamingEn:
      "You're the most reliable player in any game. Thoroughly researched guides, precise execution, unwavering commitment to proven strategies. Teammates trust you with their lives — rightfully so.",
    functions: ["Si", "Te", "Fi", "Ne"],
    dimensions: { ei: 0.2, sn: 0.2, tf: 0.2, jp: 0.2 },
  },
  ISFJ: {
    code: "ISFJ",
    name: "守护者",
    nameEn: "The Guardian",
    emoji: "🛡️",
    gaming:
      "你是天生的辅助和坦克玩家。保护队友、治疗输出、扛住伤害——你永远把团队放在自己前面，你的存在让整个队伍多了一道保险。",
    gamingEn:
      "You're a natural support and tank player. Protecting allies, healing carries, soaking damage — you always put the team first. Your presence is the safety net that holds the team together.",
    functions: ["Si", "Fe", "Ti", "Ne"],
    dimensions: { ei: 0.2, sn: 0.2, tf: 0.8, jp: 0.2 },
  },
  ESTJ: {
    code: "ESTJ",
    name: "管理者",
    nameEn: "The Director",
    emoji: "📋",
    gaming:
      "你玩游戏就像管理项目——目标明确、计划清晰、执行到位。你是公会的最佳会长、团队的最佳队长，效率就是你的第一信条。",
    gamingEn:
      "You play games like managing a project — clear objectives, solid plans, flawless execution. You're the ideal guild leader and team captain. Efficiency is your number one creed.",
    functions: ["Te", "Si", "Ne", "Fi"],
    dimensions: { ei: 0.8, sn: 0.2, tf: 0.2, jp: 0.2 },
  },
  ESFJ: {
    code: "ESFJ",
    name: "协调者",
    nameEn: "The Coordinator",
    emoji: "🤝",
    gaming:
      "你是团队的粘合剂。当队友争吵时你调解，当士气低落时你鼓励。你确保每个人都玩得开心，有你在的队伍氛围永远是最好的。",
    gamingEn:
      "You're the team's social glue. You mediate when teammates argue and encourage when morale drops. You make sure everyone has fun — any team with you has the best vibe.",
    functions: ["Fe", "Si", "Ne", "Ti"],
    dimensions: { ei: 0.8, sn: 0.2, tf: 0.8, jp: 0.2 },
  },
  ISTP: {
    code: "ISTP",
    name: "技师",
    nameEn: "The Technician",
    emoji: "🔧",
    gaming:
      "你是沉默的操作之神。不说话，不解释，直接用操作碾压。你的机械水平让人叹为观止——每一个走位、每一次操作都精确到毫秒。",
    gamingEn:
      "You're the silent mechanical god. No talk, no explanations — just pure skill that crushes. Your mechanical prowess is breathtaking — every movement and action precise to the millisecond.",
    functions: ["Ti", "Se", "Ni", "Fe"],
    dimensions: { ei: 0.2, sn: 0.2, tf: 0.2, jp: 0.8 },
  },
  ISFP: {
    code: "ISFP",
    name: "艺术家",
    nameEn: "The Artist",
    emoji: "🎨",
    gaming:
      "你在游戏里追求美和表达。捏脸系统、家园建造、时装搭配——你把游戏变成了画布。你的玩法不是为了赢，是为了创造独一无二的艺术。",
    gamingEn:
      "You pursue beauty and expression in games. Character creators, housing systems, outfit design — you turn games into canvases. You don't play to win, you play to create unique art.",
    functions: ["Fi", "Se", "Ni", "Te"],
    dimensions: { ei: 0.2, sn: 0.2, tf: 0.8, jp: 0.8 },
  },
  ESTP: {
    code: "ESTP",
    name: "行动派",
    nameEn: "The Daredevil",
    emoji: "🎲",
    gaming:
      "你为肾上腺素而活。高风险高回报的操作是你的最爱——极限反杀、1v5翻盘、最后一秒绝杀。你不怕死，因为精彩比胜利更重要。",
    gamingEn:
      "You live for adrenaline. High-risk, high-reward plays are your signature — clutch kills, 1v5 comebacks, last-second victories. You don't fear death, because a highlight is worth more than a win.",
    functions: ["Se", "Ti", "Fe", "Ni"],
    dimensions: { ei: 0.8, sn: 0.2, tf: 0.2, jp: 0.8 },
  },
  ESFP: {
    code: "ESFP",
    name: "表演者",
    nameEn: "The Performer",
    emoji: "🎭",
    gaming:
      "你是游戏世界的明星。每一次击杀都是表演，每一场胜利都是直播素材。你的操作不只为赢，更要赢得漂亮，让观众尖叫。",
    gamingEn:
      "You're the star of the gaming world. Every kill is a performance, every victory is stream content. You don't just win — you win with style, making the audience scream.",
    functions: ["Se", "Fi", "Te", "Ni"],
    dimensions: { ei: 0.8, sn: 0.2, tf: 0.8, jp: 0.8 },
  },
};

/** Valid personality type codes */
export const PERSONALITY_CODES = Object.keys(PERSONALITY_TYPES) as string[];

/** Get all personality types as an array */
export function getAllPersonalityTypes(): PersonalityType[] {
  return Object.values(PERSONALITY_TYPES);
}

/** Get personality type by code */
export function getPersonalityType(code: string): PersonalityType | undefined {
  return PERSONALITY_TYPES[code.toUpperCase()];
}

/** Validate whether a string is a valid personality type code */
export function isValidPersonalityCode(code: string): boolean {
  return code.toUpperCase() in PERSONALITY_TYPES;
}
