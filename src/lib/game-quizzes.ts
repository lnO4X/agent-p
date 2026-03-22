/**
 * Game-specific quiz configurations.
 * Maps game IDs → quiz metadata + character mappings from archetypes.
 *
 * Each game quiz maps the 16 gamer archetypes to in-game characters,
 * enabling "Which [Game] character are you?" viral quiz loops.
 */

export interface GameCharacter {
  id: string;
  name: string;
  nameEn: string;
  title: string;
  titleEn: string;
  /** CSS color for accent/dot */
  color: string;
  /** Which gamer archetype maps to this character */
  archetypeId: string;
  /** Short description of why this archetype maps to this character */
  matchReason: string;
  matchReasonEn: string;
}

export interface GameQuiz {
  id: string;
  gameName: string;
  gameNameEn: string;
  icon: string;
  tagline: string;
  taglineEn: string;
  description: string;
  descriptionEn: string;
  /** CSS gradient colors [from, to] */
  gradient: [string, string];
  characters: GameCharacter[];
}

// ==================== GAME QUIZ DATA ====================

const GAME_QUIZZES: Record<string, GameQuiz> = {
  valorant: {
    id: "valorant",
    gameName: "无畏契约",
    gameNameEn: "Valorant",
    icon: "🎯",
    tagline: "在拆弹与击杀之间，你属于哪个特工？",
    taglineEn: "Between defusing and fragging — which Agent are you?",
    description: "基于你的玩家原型，找到最适合你的无畏契约特工角色。",
    descriptionEn: "Find the Valorant Agent that matches your gamer archetype.",
    gradient: ["#ff4655", "#fd4556"],
    characters: [
      { id: "jett", name: "杰特", nameEn: "Jett", title: "疾风之刃", titleEn: "Wind Assassin", color: "#00bfff", archetypeId: "lightning-assassin", matchReason: "极致反应速度 + 闪电突进，天生的入场者。", matchReasonEn: "Lightning reflexes + dash aggression — a natural entry fragger." },
      { id: "phoenix", name: "菲尼克斯", nameEn: "Phoenix", title: "烈焰不死鸟", titleEn: "Flame Reborn", color: "#ff6f00", archetypeId: "berserker", matchReason: "冲就完事了，闪光自己开，倒了再站起来。", matchReasonEn: "Flash in, rush in, die, resurrect — pure aggression." },
      { id: "sova", name: "索瓦", nameEn: "Sova", title: "猎鹰之眼", titleEn: "Hunter's Eye", color: "#2196f3", archetypeId: "oracle", matchReason: "信息收集大师，箭矢侦察掌控全局。", matchReasonEn: "Intel master — recon arrows give the team full map awareness." },
      { id: "brimstone", name: "布雷斯通", nameEn: "Brimstone", title: "战场指挥官", titleEn: "Field Commander", color: "#ff9800", archetypeId: "commander", matchReason: "烟雾覆盖 + 战术指挥，天生的团队领袖。", matchReasonEn: "Smokes + callouts — the team's strategic backbone." },
      { id: "cypher", name: "赛弗", nameEn: "Cypher", title: "暗影之网", titleEn: "Shadow Network", color: "#9e9e9e", archetypeId: "fortress", matchReason: "绊线 + 摄像头构建完美防线，耐心等待猎物。", matchReasonEn: "Tripwires + cameras build impenetrable defenses." },
      { id: "sage", name: "贤者", nameEn: "Sage", title: "生命守护者", titleEn: "Life Guardian", color: "#4caf50", archetypeId: "healer", matchReason: "治疗 + 复活，永远把队友放在第一位。", matchReasonEn: "Heal + resurrect — always puts teammates first." },
    ],
  },
  lol: {
    id: "lol",
    gameName: "英雄联盟",
    gameNameEn: "League of Legends",
    icon: "⚔️",
    tagline: "召唤师峡谷的风格，是你的缩影。",
    taglineEn: "Your Rift playstyle reflects who you really are.",
    description: "16种玩家原型对应16位英雄联盟冠军——你是谁？",
    descriptionEn: "16 gamer archetypes mapped to League champions — who are you?",
    gradient: ["#c89b3c", "#0a1428"],
    characters: [
      { id: "yasuo", name: "亚索", nameEn: "Yasuo", title: "疾风剑豪", titleEn: "The Unforgiven", color: "#2196f3", archetypeId: "lightning-assassin", matchReason: "风墙 + 突进，操作上限极高的反应型英雄。", matchReasonEn: "Wind Wall + dashes — a mechanics-ceiling champion for reflexes." },
      { id: "draven", name: "德莱文", nameEn: "Draven", title: "荣耀行刑官", titleEn: "The Glorious Executioner", color: "#ff5722", archetypeId: "berserker", matchReason: "全场最莽ADC，高风险高回报，接斧子就是信仰。", matchReasonEn: "The most aggressive ADC — high risk, high reward, axe-catching faith." },
      { id: "twisted-fate", name: "崔斯特", nameEn: "Twisted Fate", title: "卡牌大师", titleEn: "The Card Master", color: "#ffc107", archetypeId: "oracle", matchReason: "全图支援 + 信息掌控，读懂局势比操作更重要。", matchReasonEn: "Global presence + map awareness — reading the game matters more than mechanics." },
      { id: "jarvan", name: "嘉文四世", nameEn: "Jarvan IV", title: "德玛西亚皇子", titleEn: "The Exemplar of Demacia", color: "#ff9800", archetypeId: "commander", matchReason: "冲阵指挥 + 团控开团，天生团战发起者。", matchReasonEn: "Engage + lockdown — the natural teamfight initiator and shotcaller." },
      { id: "thresh", name: "锤石", nameEn: "Thresh", title: "魂锁典狱长", titleEn: "The Chain Warden", color: "#4caf50", archetypeId: "fortress", matchReason: "灯笼守护 + 钩子威慑，控制区域的防守大师。", matchReasonEn: "Lantern saves + hook zoning — the ultimate defensive playmaker." },
      { id: "soraka", name: "索拉卡", nameEn: "Soraka", title: "众星之子", titleEn: "The Starchild", color: "#ab47bc", archetypeId: "healer", matchReason: "全队治疗 + 全球大招，牺牲自己守护他人。", matchReasonEn: "Team heals + global ult — sacrifices self to protect others." },
    ],
  },
  genshin: {
    id: "genshin",
    gameName: "原神",
    gameNameEn: "Genshin Impact",
    icon: "🌟",
    tagline: "提瓦特大陆上，你最像哪位旅伴？",
    taglineEn: "Across Teyvat — which companion matches your soul?",
    description: "开放世界的探索风格暴露了你的玩家DNA。",
    descriptionEn: "Your open-world exploration style reveals your gamer DNA.",
    gradient: ["#6366f1", "#a78bfa"],
    characters: [
      { id: "keqing", name: "刻晴", nameEn: "Keqing", title: "璃月奉行", titleEn: "Yuheng of the Liyue Qixing", color: "#7c3aed", archetypeId: "lightning-assassin", matchReason: "雷电突进 + 极速切人，操作流的极致体现。", matchReasonEn: "Electro dashes + quick-swap — the epitome of mechanical playstyle." },
      { id: "hu-tao", name: "胡桃", nameEn: "Hu Tao", title: "往生堂堂主", titleEn: "Director of the Wangsheng Funeral Parlor", color: "#ef4444", archetypeId: "berserker", matchReason: "血量越低伤害越高，刀尖舔血的极致风险玩法。", matchReasonEn: "Lower HP = higher damage — the ultimate risk-reward playstyle." },
      { id: "zhongli", name: "钟离", nameEn: "Zhongli", title: "岩王帝君", titleEn: "Vago Mundo", color: "#f59e0b", archetypeId: "oracle", matchReason: "洞察一切的千年智者，盾牌 + 控场的全局视野。", matchReasonEn: "Millennia of wisdom — shields + crowd control with a grand perspective." },
      { id: "jean", name: "琴", nameEn: "Jean", title: "代理团长", titleEn: "Acting Grand Master", color: "#3b82f6", archetypeId: "commander", matchReason: "团队核心 + 治疗 + 输出，永远在照顾所有人。", matchReasonEn: "Team anchor — heals, DPS, crowd control. Always taking care of everyone." },
      { id: "noelle", name: "诺艾尔", nameEn: "Noelle", title: "未授勋之花", titleEn: "Maid of Favonius", color: "#6b7280", archetypeId: "fortress", matchReason: "岩系护盾 + 自回血，坚不可摧的防御系角色。", matchReasonEn: "Geo shields + self-heal — the unbreakable defensive character." },
      { id: "barbara", name: "芭芭拉", nameEn: "Barbara", title: "闪耀偶像", titleEn: "Shining Idol", color: "#06b6d4", archetypeId: "healer", matchReason: "全队治疗 + 水元素，团队的生命线。", matchReasonEn: "Team healer + Hydro — the party's lifeline." },
    ],
  },
};

// ==================== ACCESSORS ====================

export function getGameQuiz(gameId: string): GameQuiz | undefined {
  return GAME_QUIZZES[gameId];
}

export function getAllGameQuizIds(): string[] {
  return Object.keys(GAME_QUIZZES);
}

export function getAllGameQuizzes(): GameQuiz[] {
  return Object.values(GAME_QUIZZES);
}

/**
 * Find the game character that matches a given archetype.
 * Returns the first character whose archetypeId matches.
 */
export function getCharacterForArchetype(
  gameId: string,
  archetypeId: string
): GameCharacter | undefined {
  const quiz = GAME_QUIZZES[gameId];
  if (!quiz) return undefined;
  return quiz.characters.find((c) => c.archetypeId === archetypeId);
}
