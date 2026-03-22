/**
 * Deep archetype content for SEO landing pages.
 * Each archetype has 4 content sections: games, relationships, growth, characters
 * Stats section is dynamic (from DB) and handled separately.
 */

export const ARCHETYPE_SECTIONS = ["games", "relationships", "growth", "characters"] as const;
export type ArchetypeSection = (typeof ARCHETYPE_SECTIONS)[number];

// ==================== GAME RECOMMENDATIONS ====================

export interface GameRecommendation {
  name: string;
  nameZh: string;
  reason: string;
  reasonZh: string;
  genre: string;
  matchScore: number; // 1-5
}

export const ARCHETYPE_GAMES: Record<string, GameRecommendation[]> = {
  "lightning-assassin": [
    { name: "Valorant", nameZh: "无畏契约", genre: "FPS", matchScore: 5, reason: "Lightning-fast flick shots and split-second duels are your playground. Jett and Neon were designed for players like you.", reasonZh: "闪电般的甩枪和瞬间对决是你的主场。Jett和Neon就是为你设计的。" },
    { name: "osu!", nameZh: "osu!", genre: "Rhythm", matchScore: 5, reason: "Pure reaction speed + hand-eye coordination. The leaderboard is your proving ground.", reasonZh: "纯粹的反应速度+手眼协调。排行榜就是你的试炼场。" },
    { name: "Apex Legends", nameZh: "Apex英雄", genre: "FPS/BR", matchScore: 4, reason: "Fast TTK and aggressive movement mechanics reward your speed-first playstyle.", reasonZh: "快速的TTK和激进的移动机制奖励你的速度优先打法。" },
    { name: "Guilty Gear Strive", nameZh: "罪恶装备", genre: "Fighting", matchScore: 4, reason: "Confirm combos in 3 frames. Your reaction advantage is devastating in fighting games.", reasonZh: "3帧内确认连段。你的反应优势在格斗游戏里是毁灭性的。" },
    { name: "Trackmania", nameZh: "赛道狂飙", genre: "Racing", matchScore: 4, reason: "Millisecond-perfect inputs at 300km/h. Speed is the only language spoken here.", reasonZh: "300km/h下的毫秒级精确输入。这里只说'速度'这一种语言。" },
  ],
  berserker: [
    { name: "PUBG", nameZh: "绝地求生", genre: "BR", matchScore: 5, reason: "Hot-drop Pochinki, grab whatever gun you find, and fight everyone. Your chaos thrives here.", reasonZh: "热降P城，捡到什么用什么，见人就打。你的混沌在这里如鱼得水。" },
    { name: "Devil May Cry 5", nameZh: "鬼泣5", genre: "Action", matchScore: 5, reason: "Stylish action rewards aggressive, non-stop combos. The style meter IS your emotional state.", reasonZh: "华丽的动作奖励激进、不停歇的连招。SSS评级就是你的情绪状态。" },
    { name: "Doom Eternal", nameZh: "毁灭战士:永恒", genre: "FPS", matchScore: 5, reason: "No cover, no camping — just pure aggression. The game literally punishes you for playing safe.", reasonZh: "没有掩体，没有苟——纯粹的进攻。游戏惩罚你打得太保守。" },
    { name: "Fortnite", nameZh: "堡垒之夜", genre: "BR", matchScore: 4, reason: "Build-fight-edit at maximum speed. Your unpredictable aggression makes you terrifying.", reasonZh: "极速建造-战斗-编辑。你不可预测的进攻让对手恐惧。" },
    { name: "Hades II", nameZh: "哈迪斯2", genre: "Roguelike", matchScore: 4, reason: "Die, rage, try again. Roguelikes channel your berserker energy into productive loops.", reasonZh: "死亡、暴怒、再来。Roguelike把你的狂暴能量转化为正循环。" },
  ],
  sharpshooter: [
    { name: "Counter-Strike 2", nameZh: "反恐精英2", genre: "FPS", matchScore: 5, reason: "One-tap headshots with the AK-47. Your precision and composure under pressure define this game.", reasonZh: "AK-47一枪爆头。你的精准和压力下的冷静定义了这个游戏。" },
    { name: "Sniper Elite 5", nameZh: "狙击精英5", genre: "TPS", matchScore: 5, reason: "Bullet physics, wind calculation, and patience. Every shot is a masterpiece of precision.", reasonZh: "弹道物理、风速计算和耐心。每一枪都是精准的杰作。" },
    { name: "Assetto Corsa", nameZh: "神力科莎", genre: "Racing Sim", matchScore: 4, reason: "Simulation racing demands consistent precision lap after lap. No room for error.", reasonZh: "模拟赛车要求每圈都保持一致的精确度。容不得失误。" },
    { name: "Overwatch 2", nameZh: "守望先锋2", genre: "FPS", matchScore: 4, reason: "Widowmaker or Hanzo — high-skill ceiling heroes that reward your mechanical precision.", reasonZh: "黑百合或半藏——高技术上限英雄，奖励你的机械精准度。" },
    { name: "Beat Saber", nameZh: "节奏光剑", genre: "Rhythm/VR", matchScore: 4, reason: "Precise slashes in VR combine your hand-eye coordination with rhythmic timing.", reasonZh: "VR中的精确挥砍结合了你的手眼协调和节奏感。" },
  ],
  duelist: [
    { name: "Street Fighter 6", nameZh: "街头霸王6", genre: "Fighting", matchScore: 5, reason: "The ultimate 1v1 mind game. Read, react, and punish — you do all three at elite level.", reasonZh: "终极1v1心理博弈。解读、反应、惩罚——你三项全精。" },
    { name: "Tekken 8", nameZh: "铁拳8", genre: "Fighting", matchScore: 5, reason: "Frame data, punish windows, movement mastery. The deepest fighting game for the deepest duelist.", reasonZh: "帧数据、惩罚窗口、移动精通。最深度的格斗游戏给最深度的决斗者。" },
    { name: "League of Legends", nameZh: "英雄联盟", genre: "MOBA", matchScore: 4, reason: "Solo lane dominance. Your 1v1 prowess in top/mid lane makes you a constant threat.", reasonZh: "Solo线统治力。你在上路/中路的1v1能力让你成为持续威胁。" },
    { name: "Rocket League", nameZh: "火箭联盟", genre: "Sports", matchScore: 4, reason: "1v1 mode is pure skill expression — reads, mechanics, and composure in one package.", reasonZh: "1v1模式是纯粹的技术表达——解读、操作和冷静合一。" },
    { name: "For Honor", nameZh: "荣耀战魂", genre: "Fighting", matchScore: 4, reason: "Stance-based combat where reading your opponent is everything. Duel mode is your arena.", reasonZh: "架势战斗系统中读懂对手就是一切。决斗模式就是你的竞技场。" },
  ],
  oracle: [
    { name: "Civilization VI", nameZh: "文明6", genre: "4X Strategy", matchScore: 5, reason: "Plan 50 turns ahead, optimize every city, predict AI behavior. Your strategic mind's paradise.", reasonZh: "提前规划50回合，优化每座城市，预判AI行为。你的战略头脑的天堂。" },
    { name: "Magic: The Gathering Arena", nameZh: "万智牌", genre: "Card", matchScore: 5, reason: "Track cards, calculate probabilities, build combos. Your memory and pattern recognition dominate.", reasonZh: "追踪卡牌，计算概率，构建combo。你的记忆力和模式识别占主导。" },
    { name: "The Witness", nameZh: "见证者", genre: "Puzzle", matchScore: 5, reason: "700+ puzzles where pattern recognition is everything. You'll see solutions others can't.", reasonZh: "700+个谜题，模式识别就是一切。你能看到别人看不到的解法。" },
    { name: "Europa Universalis IV", nameZh: "欧陆风云4", genre: "Grand Strategy", matchScore: 4, reason: "Geopolitics, economics, and diplomacy across centuries. Information overload is your comfort zone.", reasonZh: "跨越数世纪的地缘政治、经济和外交。信息过载是你的舒适区。" },
    { name: "Chess.com", nameZh: "国际象棋", genre: "Strategy", matchScore: 4, reason: "Pure strategic depth with no randomness. Your ability to think ahead is the only weapon.", reasonZh: "纯粹的战略深度，没有随机性。你的前瞻能力是唯一的武器。" },
  ],
  fortress: [
    { name: "Factorio", nameZh: "异星工厂", genre: "Automation", matchScore: 5, reason: "Build the perfect factory with zero waste. Your resource management obsession finds its ultimate form.", reasonZh: "建造零浪费的完美工厂。你的资源管理执念找到了终极形态。" },
    { name: "Cities: Skylines II", nameZh: "城市:天际线2", genre: "City Builder", matchScore: 5, reason: "Budget management, traffic optimization, infrastructure planning — fortress thinking in city form.", reasonZh: "预算管理、交通优化、基础设施规划——城市形态的要塞思维。" },
    { name: "Stardew Valley", nameZh: "星露谷物语", genre: "Farm Sim", matchScore: 4, reason: "Min-max your farm, optimize crop rotations, and never waste a day. Patient prosperity.", reasonZh: "极限化你的农场，优化作物轮种，不浪费一天。耐心的繁荣。" },
    { name: "They Are Billions", nameZh: "亿万僵尸", genre: "RTS/Tower Defense", matchScore: 4, reason: "Build impenetrable defenses and survive endless waves. Your defensive mastery shines.", reasonZh: "建造坚不可摧的防线，抵御无尽的浪潮。你的防御大师能力闪耀。" },
    { name: "Satisfactory", nameZh: "幸福工厂", genre: "Automation", matchScore: 4, reason: "3D factory building where every conveyor belt must be perfect. Your patience is rewarded.", reasonZh: "3D工厂建造，每条传送带都必须完美。你的耐心会得到回报。" },
  ],
  "shadow-strategist": [
    { name: "StarCraft II", nameZh: "星际争霸2", genre: "RTS", matchScore: 5, reason: "Proxy rushes, hidden expansions, mind games. Your shadow tactics define competitive RTS.", reasonZh: "代理rush、隐藏扩张、心理博弈。你的暗影战术定义了竞技RTS。" },
    { name: "Dota 2", nameZh: "Dota 2", genre: "MOBA", matchScore: 5, reason: "Smoke ganks, Roshan baits, buyback mind games. The most strategically deep MOBA for your scheming mind.", reasonZh: "烟雾gank、肉山诱饵、买活心理战。最有战略深度的MOBA给你的诡计之脑。" },
    { name: "Slay the Spire", nameZh: "杀戮尖塔", genre: "Deck Builder", matchScore: 4, reason: "Calculate exact lethal, optimize deck synergies, and manipulate RNG. Precision scheming.", reasonZh: "精确计算致命伤害，优化卡组协同，操控随机性。精密的谋略。" },
    { name: "Hitman: World of Assassination", nameZh: "杀手:暗杀世界", genre: "Stealth", matchScore: 4, reason: "Plan the perfect assassination with dozens of approaches. Patience meets ingenuity.", reasonZh: "规划完美的暗杀，数十种路线。耐心与巧思的结合。" },
    { name: "Among Us", nameZh: "Among Us", genre: "Social Deduction", matchScore: 4, reason: "Manipulate discussions, create alibis, eliminate targets. Your strategic deception is masterful.", reasonZh: "操控讨论、制造不在场证明、消灭目标。你的战略欺骗登峰造极。" },
  ],
  gambler: [
    { name: "Poker (Texas Hold'em)", nameZh: "德州扑克", genre: "Card", matchScore: 5, reason: "Read opponents, calculate pot odds, and know when to go all-in. Your risk intuition is your edge.", reasonZh: "读对手、算底池赔率、知道何时全下。你的风险直觉是你的优势。" },
    { name: "Balatro", nameZh: "小丑牌", genre: "Roguelike/Card", matchScore: 5, reason: "Poker meets roguelike. Push your luck with joker combos for exponential scores.", reasonZh: "扑克遇上Roguelike。用小丑combo赌出指数级分数。" },
    { name: "XCOM 2", nameZh: "幽浮2", genre: "Tactical", matchScore: 4, reason: "95% hit chance misses. 30% hit chance crits. You thrive in this beautiful chaos of probability.", reasonZh: "95%命中率会miss，30%命中率会暴击。你在这美丽的概率混沌中如鱼得水。" },
    { name: "Inscryption", nameZh: "邪恶冥刻", genre: "Card/Horror", matchScore: 4, reason: "Dark card game where sacrificing cards is power. Your willingness to gamble everything is key.", reasonZh: "黑暗卡牌游戏，献祭就是力量。你愿意赌上一切的特质是关键。" },
    { name: "Darkest Dungeon II", nameZh: "暗黑地牢2", genre: "Roguelike", matchScore: 4, reason: "Push deeper into dungeons with stressed heroes or retreat? Your risk assessment decides.", reasonZh: "带着压力爆棚的英雄继续深入还是撤退？你的风险评估做出决定。" },
  ],
  "rhythm-walker": [
    { name: "Elden Ring", nameZh: "艾尔登法环", genre: "Action RPG", matchScore: 5, reason: "Boss patterns, dodge timing, attack windows — you feel the rhythm of combat like music.", reasonZh: "Boss模式、闪避时机、攻击窗口——你像感受音乐一样感受战斗的节奏。" },
    { name: "Crypt of the NecroDancer", nameZh: "节奏地牢", genre: "Rhythm/Roguelike", matchScore: 5, reason: "Move to the beat while fighting monsters. Literally your archetype in game form.", reasonZh: "跟着节拍移动同时战斗怪物。字面意义上的你的原型游戏。" },
    { name: "Sekiro", nameZh: "只狼", genre: "Action", matchScore: 5, reason: "Deflect timing is everything. Your rhythmic pattern recognition makes you a parry god.", reasonZh: "弹刀时机就是一切。你的节奏模式识别让你成为弹反之神。" },
    { name: "Hi-Fi Rush", nameZh: "Hi-Fi Rush", genre: "Action/Rhythm", matchScore: 4, reason: "Combat synced to music. Every punch, dodge, and combo flows with the beat.", reasonZh: "战斗与音乐同步。每一拳、每次闪避、每个连招都跟着节拍流动。" },
    { name: "Geometry Dash", nameZh: "几何冲刺", genre: "Rhythm/Platformer", matchScore: 4, reason: "Memorize patterns, feel the rhythm, execute perfectly. Pure flow state gameplay.", reasonZh: "记忆模式、感受节奏、完美执行。纯粹的心流状态游戏。" },
  ],
  commander: [
    { name: "Overwatch 2", nameZh: "守望先锋2", genre: "FPS", matchScore: 5, reason: "Shot-calling, ultimate combos, team rotations. You're the IGL every team needs.", reasonZh: "报点、大招配合、团队轮转。你是每个队伍需要的指挥。" },
    { name: "Final Fantasy XIV", nameZh: "最终幻想14", genre: "MMORPG", matchScore: 5, reason: "Raid leading 8-24 players through savage content. Your coordination ability is irreplaceable.", reasonZh: "带领8-24人通关高难度副本。你的协调能力不可替代。" },
    { name: "Total War: Warhammer III", nameZh: "全面战争:战锤3", genre: "Strategy", matchScore: 4, reason: "Command armies, manage kingdoms, and coordinate multi-front wars. Born to lead.", reasonZh: "指挥军队、管理王国、协调多线战争。天生的领袖。" },
    { name: "Helldivers 2", nameZh: "绝地潜兵2", genre: "Co-op Shooter", matchScore: 4, reason: "4-player co-op where coordination wins. You naturally become the squad leader.", reasonZh: "4人合作中协调取胜。你自然而然成为小队长。" },
    { name: "Monster Hunter: Wilds", nameZh: "怪物猎人:荒野", genre: "Action RPG", matchScore: 4, reason: "Multiplayer hunts reward team coordination. Your ability to read team dynamics shines.", reasonZh: "多人狩猎奖励团队协调。你解读团队动态的能力闪耀。" },
  ],
  weaver: [
    { name: "Teamfight Tactics", nameZh: "云顶之弈", genre: "Auto Chess", matchScore: 5, reason: "Synergize traits, pivot compositions, and adapt to the lobby. Your weaving mind excels.", reasonZh: "协同羁绊、转型阵容、适应对局。你的编织思维出类拔萃。" },
    { name: "It Takes Two", nameZh: "双人成行", genre: "Co-op Adventure", matchScore: 5, reason: "Every puzzle requires two players working in harmony. Teamwork is your superpower.", reasonZh: "每个谜题都需要两人默契配合。团队协作是你的超能力。" },
    { name: "Divinity: Original Sin 2", nameZh: "神界:原罪2", genre: "CRPG", matchScore: 4, reason: "Combo elemental effects with party members. Your systems-thinking creates devastating chains.", reasonZh: "与队友组合元素效果。你的系统思维创造毁灭性连锁。" },
    { name: "Deep Rock Galactic", nameZh: "深岩银河", genre: "Co-op FPS", matchScore: 4, reason: "Four classes, each essential. You see how all pieces fit together and coordinate naturally.", reasonZh: "四个职业，缺一不可。你看到所有部分如何契合并自然协调。" },
    { name: "Overcooked 2", nameZh: "胡闹厨房2", genre: "Co-op", matchScore: 4, reason: "Kitchen chaos that rewards communication and role assignment. Your organizational instinct shines.", reasonZh: "奖励沟通和分工的厨房混乱。你的组织本能闪耀。" },
  ],
  sentinel: [
    { name: "Rainbow Six Siege", nameZh: "彩虹六号:围攻", genre: "FPS", matchScore: 5, reason: "Anchor sites, hold angles, and punish attackers. Your patience and timing are lethal.", reasonZh: "锚点防守、卡角度、惩罚进攻者。你的耐心和时机是致命的。" },
    { name: "Dark Souls III", nameZh: "黑暗之魂3", genre: "Action RPG", matchScore: 5, reason: "Shield up, wait for openings, punish mistakes. Your fortress mentality meets counter-attacking precision.", reasonZh: "举盾、等待破绽、惩罚失误。你的要塞思维遇上反击精准度。" },
    { name: "Loop Hero", nameZh: "循环英雄", genre: "Strategy/Roguelike", matchScore: 4, reason: "Build your world tile by tile, balance risk and defense. Patient strategic optimization.", reasonZh: "一块一块构建你的世界，平衡风险和防御。耐心的战略优化。" },
    { name: "Plants vs. Zombies", nameZh: "植物大战僵尸", genre: "Tower Defense", matchScore: 4, reason: "Classic defensive strategy. Place units, manage resources, hold the line. Your specialty.", reasonZh: "经典防御策略。放置单位、管理资源、坚守防线。你的专长。" },
    { name: "Frostpunk 2", nameZh: "冰汽时代2", genre: "City Builder/Survival", matchScore: 4, reason: "Survive in a frozen world through careful resource management and defensive expansion.", reasonZh: "通过精心的资源管理和防御性扩张在冰封世界中生存。" },
  ],
  shapeshifter: [
    { name: "Apex Legends", nameZh: "Apex英雄", genre: "FPS/BR", matchScore: 5, reason: "Switch legends, adapt to ring zones, and play any role. Your versatility is your power.", reasonZh: "切换传奇、适应圆圈、扮演任何角色。你的多变性就是你的力量。" },
    { name: "Genshin Impact", nameZh: "原神", genre: "Action RPG", matchScore: 5, reason: "Build teams, switch elements, combine reactions. Your adaptability across characters is unmatched.", reasonZh: "组建队伍、切换元素、组合反应。你在角色间的适应力无人能及。" },
    { name: "Hades", nameZh: "哈迪斯", genre: "Roguelike", matchScore: 4, reason: "New weapons, new boons, new builds every run. Your adaptability makes you lethal with anything.", reasonZh: "每局新武器、新祝福、新流派。你的适应力让你用任何东西都致命。" },
    { name: "The Binding of Isaac", nameZh: "以撒的结合", genre: "Roguelike", matchScore: 4, reason: "Thousands of item combinations. You adapt to whatever RNG gives you and make it work.", reasonZh: "数千种道具组合。你适应RNG给你的一切并让它运作。" },
    { name: "Valorant", nameZh: "无畏契约", genre: "FPS", matchScore: 4, reason: "Fill any agent role — duelist, sentinel, controller. You read what the team needs and adapt.", reasonZh: "填补任何特工角色——决斗者、哨兵、控场。你读懂团队需求并适应。" },
  ],
  "lone-wolf": [
    { name: "Elden Ring", nameZh: "艾尔登法环", genre: "Action RPG", matchScore: 5, reason: "Solo the entire game, including optional bosses. No summons, no co-op — just you and the challenge.", reasonZh: "solo通关全游戏，包括隐藏Boss。不召唤、不合作——只有你和挑战。" },
    { name: "Escape from Tarkov", nameZh: "逃离塔科夫", genre: "FPS/Survival", matchScore: 5, reason: "Solo raids in the most hardcore FPS. Your self-reliance and skill make you a one-person army.", reasonZh: "最硬核FPS中的Solo突袭。你的自主和技术让你成为一人军队。" },
    { name: "Returnal", nameZh: "死亡回归", genre: "Roguelike/TPS", matchScore: 4, reason: "Solo loop of death and mastery. No teammates, no excuses — pure individual skill growth.", reasonZh: "死亡和精通的Solo循环。没有队友、没有借口——纯粹的个人技术成长。" },
    { name: "Hollow Knight", nameZh: "空洞骑士", genre: "Metroidvania", matchScore: 4, reason: "Explore a vast world alone, master tight combat, and conquer impossible bosses.", reasonZh: "独自探索广阔世界、精通紧凑战斗、征服不可能的Boss。" },
    { name: "Celeste", nameZh: "蔚蓝", genre: "Platformer", matchScore: 4, reason: "You vs. the mountain. Precision platforming that rewards persistence and individual mastery.", reasonZh: "你 vs 山。精确平台跳跃，奖励坚持和个人精通。" },
  ],
  collector: [
    { name: "Pokemon Scarlet/Violet", nameZh: "宝可梦:朱/紫", genre: "RPG", matchScore: 5, reason: "Gotta catch 'em all. Your completionist drive IS the entire game design.", reasonZh: "全部收集。你的完成主义驱动就是整个游戏设计。" },
    { name: "Monster Hunter: Wilds", nameZh: "怪物猎人:荒野", genre: "Action RPG", matchScore: 5, reason: "Craft every weapon, collect every armor set, hunt every monster. Hundreds of hours of collection.", reasonZh: "锻造每把武器、收集每套装备、狩猎每只怪物。数百小时的收集。" },
    { name: "Diablo IV", nameZh: "暗黑破坏神4", genre: "ARPG", matchScore: 4, reason: "Chase perfect rolls, rare drops, and build variations. The loot treadmill feeds your collector soul.", reasonZh: "追逐完美词条、稀有掉落和流派变化。刷装循环喂养你的收藏家灵魂。" },
    { name: "Animal Crossing", nameZh: "动物森友会", genre: "Life Sim", matchScore: 4, reason: "Bugs, fish, fossils, furniture, DIY recipes. Your museum will be complete before anyone else's.", reasonZh: "虫、鱼、化石、家具、DIY方程式。你的博物馆会比任何人都先完成。" },
    { name: "The Legend of Zelda: TotK", nameZh: "塞尔达:王国之泪", genre: "Adventure", matchScore: 4, reason: "900+ Korok seeds, all shrines, every side quest. Your completionist instinct won't let a single ? remain.", reasonZh: "900+呀哈哈、全神庙、每个支线。你的完成主义本能不会留下一个?号。" },
  ],
  "chaos-child": [
    { name: "Breath of the Wild / TotK", nameZh: "旷野之息/王国之泪", genre: "Adventure", matchScore: 5, reason: "Physics sandbox where you can solve puzzles in infinite ways. Your creative chaos finds paradise.", reasonZh: "物理沙盒中可以用无限方式解谜。你的创意混沌找到了天堂。" },
    { name: "Minecraft", nameZh: "我的世界", genre: "Sandbox", matchScore: 5, reason: "Build anything, break everything, experiment endlessly. No rules, pure creativity.", reasonZh: "建造任何东西、破坏一切、无尽实验。没有规则，纯粹创造。" },
    { name: "Besiege", nameZh: "围攻", genre: "Physics Sandbox", matchScore: 4, reason: "Build ridiculous war machines that shouldn't work but somehow do. Chaotic engineering at its finest.", reasonZh: "建造不该能用但偏偏能用的荒谬战争机器。混沌工程的巅峰。" },
    { name: "Garry's Mod", nameZh: "盖瑞的模组", genre: "Sandbox", matchScore: 4, reason: "No objectives, no rules — just tools and your imagination. Pure sandbox chaos.", reasonZh: "没有目标、没有规则——只有工具和你的想象力。纯粹的沙盒混沌。" },
    { name: "Untitled Goose Game", nameZh: "无名鹅戏", genre: "Puzzle/Comedy", matchScore: 4, reason: "Be a horrible goose and cause maximum chaos. Your chaotic energy in adorable form.", reasonZh: "做一只可恶的鹅，制造最大混乱。你的混沌能量的可爱形态。" },
  ],
};

// ==================== CHARACTER MAPPINGS ====================

export interface CharacterMatch {
  name: string;
  nameZh: string;
  game: string;
  reason: string;
  reasonZh: string;
}

export const ARCHETYPE_CHARACTERS: Record<string, CharacterMatch[]> = {
  "lightning-assassin": [
    { name: "Tracer", nameZh: "猎空", game: "Overwatch", reason: "Blink in, burst damage, recall out — speed is everything.", reasonZh: "闪现进入、爆发输出、回溯撤离——速度就是一切。" },
    { name: "Sonic", nameZh: "索尼克", game: "Sonic Series", reason: "The embodiment of speed. Go fast or go home.", reasonZh: "速度的化身。要快，不然回家。" },
    { name: "Jett", nameZh: "Jett", game: "Valorant", reason: "Dash, updraft, blade storm. Aggressive, fast, and deadly.", reasonZh: "冲刺、升流、刀风暴。激进、快速、致命。" },
    { name: "Genji", nameZh: "源氏", game: "Overwatch", reason: "Cyber ninja with unmatched agility. Swift strike resets reward aggressive plays.", reasonZh: "无与伦比敏捷的赛博忍者。迅影击重置奖励激进打法。" },
  ],
  berserker: [
    { name: "Kratos", nameZh: "奎托斯", game: "God of War", reason: "Rage mode is literally a game mechanic. Fury as a weapon.", reasonZh: "暴怒模式就是游戏机制。愤怒作为武器。" },
    { name: "Junkrat", nameZh: "狂鼠", game: "Overwatch", reason: "Explosions, chaos, and mayhem. Maximum destruction, minimum planning.", reasonZh: "爆炸、混乱和破坏。最大破坏力，最少计划。" },
    { name: "Klee", nameZh: "可莉", game: "Genshin Impact", reason: "Loves explosions, causes chaos wherever she goes. Adorable berserker energy.", reasonZh: "热爱爆炸，走到哪里就混乱到哪里。可爱的狂暴能量。" },
    { name: "Doomguy", nameZh: "毁灭战士", game: "Doom", reason: "Too angry to die. Literally fights demons with pure rage.", reasonZh: "太愤怒以至于无法死亡。用纯粹的愤怒与恶魔战斗。" },
  ],
  sharpshooter: [
    { name: "Widowmaker", nameZh: "黑百合", game: "Overwatch", reason: "One shot, one kill. Cold precision from a distance.", reasonZh: "一枪一命。远距离的冷酷精准。" },
    { name: "Agent 47", nameZh: "47号特工", game: "Hitman", reason: "Calculated, precise, and emotionally detached. Every action is deliberate.", reasonZh: "精打细算、精准无误、情感剥离。每个动作都是深思熟虑的。" },
    { name: "Hanzo", nameZh: "半藏", game: "Overwatch", reason: "Discipline, focus, and the devastating scatter arrow. Precision archery.", reasonZh: "纪律、专注和毁灭性的碎裂箭。精准箭术。" },
    { name: "Quiet", nameZh: "静静", game: "Metal Gear Solid V", reason: "Phantom sniper who never misses. Patience and precision personified.", reasonZh: "从不失手的幽灵狙击手。耐心和精准的化身。" },
  ],
  duelist: [
    { name: "Vergil", nameZh: "维吉尔", game: "Devil May Cry", reason: "I need more power. The ultimate 1v1 rival driven by perfection.", reasonZh: "我需要更多力量。追求完美的终极1v1对手。" },
    { name: "Yasuo", nameZh: "亚索", game: "League of Legends", reason: "High skill ceiling solo laner who thrives in 1v1 outplays.", reasonZh: "高技术上限的Solo线英雄，在1v1中绽放。" },
    { name: "Sekiro", nameZh: "只狼", game: "Sekiro", reason: "One shinobi against the world. Perfect deflects, perfect kills.", reasonZh: "一个忍者对抗世界。完美弹反、完美击杀。" },
    { name: "Ryu", nameZh: "隆", game: "Street Fighter", reason: "The eternal warrior. Always seeking the next challenge, the next rival.", reasonZh: "永恒的战士。永远在寻找下一个挑战、下一个对手。" },
  ],
  oracle: [
    { name: "Zhuge Liang", nameZh: "诸葛亮", game: "Dynasty Warriors / Three Kingdoms", reason: "The sleeping dragon who wins battles before they begin through pure intellect.", reasonZh: "卧龙先生，用纯粹的智慧在战斗开始前就取胜。" },
    { name: "Sova", nameZh: "Sova", game: "Valorant", reason: "Information is power. Recon bolt, drone, and ultimate reveal everything.", reasonZh: "信息就是力量。侦查箭、无人机和大招揭示一切。" },
    { name: "Mordin Solus", nameZh: "莫丁·索卢斯", game: "Mass Effect", reason: "Genius scientist who calculates every variable. Had to be him. Someone else might have gotten it wrong.", reasonZh: "计算每个变量的天才科学家。必须是他。换了别人可能会出错。" },
    { name: "Professor Layton", nameZh: "雷顿教授", game: "Professor Layton", reason: "Every puzzle has a solution. Your analytical mind never rests.", reasonZh: "每个谜题都有解答。你的分析思维从不停歇。" },
  ],
  fortress: [
    { name: "Reinhardt", nameZh: "莱因哈特", game: "Overwatch", reason: "Shield up, hold the line, protect the team. The immovable object.", reasonZh: "举盾、坚守防线、保护团队。不可移动之物。" },
    { name: "Minecraft Steve (Builder)", nameZh: "史蒂夫(建造者)", game: "Minecraft", reason: "Build walls, dig moats, create the perfect fortress. Defense through construction.", reasonZh: "建墙、挖护城河、创造完美堡垒。通过建造防御。" },
    { name: "Zhongli", nameZh: "钟离", game: "Genshin Impact", reason: "The strongest shield in the game. Geo Archon who makes the team unkillable.", reasonZh: "游戏中最强的护盾。让团队不死的岩神。" },
    { name: "The Mayor", nameZh: "市长", game: "SimCity", reason: "Build, optimize, protect. Your city thrives because you plan for every disaster.", reasonZh: "建造、优化、保护。你的城市繁荣因为你为每次灾难做了规划。" },
  ],
  "shadow-strategist": [
    { name: "Aizen", nameZh: "蓝染", game: "Bleach (Various)", reason: "Since when were you under the impression you weren't in my plan? Mastermind manipulation.", reasonZh: "你从什么时候开始以为你不在我的计划中？大师级操控。" },
    { name: "Omen", nameZh: "Omen", game: "Valorant", reason: "Teleport behind enemy lines, blind from shadows, control the map unseen.", reasonZh: "传送到敌后、从暗处致盲、隐身控制地图。" },
    { name: "Tyrion Lannister", nameZh: "提利昂", game: "Game of Thrones (Various)", reason: "Outthink everyone in the room. Your weapon is your mind, and you wield it well.", reasonZh: "在场所有人都被你智胜。你的武器是你的头脑，而你用得很好。" },
    { name: "The Spy", nameZh: "间谍", game: "Team Fortress 2", reason: "Backstab, disguise, sap. The shadow operator who wins through deception.", reasonZh: "背刺、伪装、破坏。通过欺骗取胜的暗影操作者。" },
  ],
  gambler: [
    { name: "Twisted Fate", nameZh: "崔斯特", game: "League of Legends", reason: "Pick a card — gold, red, or blue. Every play is a calculated risk.", reasonZh: "选一张牌——金、红、还是蓝。每次操作都是计算过的风险。" },
    { name: "Nathan Drake", nameZh: "内森·德雷克", game: "Uncharted", reason: "Leap first, think later. Somehow always lands on his feet through sheer luck.", reasonZh: "先跳再想。不知为何总能靠纯粹的运气安全落地。" },
    { name: "Kazuma Kiryu", nameZh: "桐生一马", game: "Yakuza/Like a Dragon", reason: "All-in on every fight. Heart of a gambler, fists of a legend.", reasonZh: "每场战斗都全力以赴。赌徒之心，传奇之拳。" },
    { name: "Han Solo", nameZh: "韩·索罗", game: "Star Wars (Various)", reason: "Never tell me the odds. The original space gambler.", reasonZh: "不要告诉我概率。最初的太空赌徒。" },
  ],
  "rhythm-walker": [
    { name: "Bayonetta", nameZh: "贝优妮塔", game: "Bayonetta", reason: "Combat as dance. Witch Time rewards perfect timing with slow-motion elegance.", reasonZh: "战斗即舞蹈。魔女时间用慢动作优雅奖励完美的时机。" },
    { name: "2B", nameZh: "2B", game: "NieR: Automata", reason: "Fluid combat that flows like a choreographed performance. Grace under pressure.", reasonZh: "像编排好的表演一样流畅的战斗。压力下的优雅。" },
    { name: "The Hunter", nameZh: "猎人", game: "Bloodborne", reason: "Aggressive, rhythmic combat where dodging IS attacking. The dance of death.", reasonZh: "激进的、有节奏的战斗，闪避就是进攻。死亡之舞。" },
    { name: "Parappa", nameZh: "PaRappa", game: "PaRappa the Rapper", reason: "I gotta believe! The original rhythm game hero.", reasonZh: "我必须相信！最初的音游英雄。" },
  ],
  commander: [
    { name: "Commander Shepard", nameZh: "薛帕德指挥官", game: "Mass Effect", reason: "Lead your crew, make impossible decisions, inspire loyalty. Born commander.", reasonZh: "带领你的团队、做出不可能的决策、激发忠诚。天生的指挥官。" },
    { name: "Ana", nameZh: "安娜", game: "Overwatch", reason: "Nano boost the right target, sleep the right threat. The shot-caller support.", reasonZh: "给正确的目标纳米强化、催眠正确的威胁。报点型辅助。" },
    { name: "Tactician (Fire Emblem)", nameZh: "战术师", game: "Fire Emblem", reason: "Command every unit, plan every move. Your team wins because of your coordination.", reasonZh: "指挥每个单位、规划每步行动。团队因你的协调而获胜。" },
    { name: "Captain Price", nameZh: "普莱斯队长", game: "Call of Duty", reason: "Calm under fire, decisive in chaos. The leader everyone trusts with their life.", reasonZh: "枪林弹雨下冷静、混乱中果断。每个人都信任的领袖。" },
  ],
  weaver: [
    { name: "Symmetra", nameZh: "秩序之光", game: "Overwatch", reason: "Create teleporters, turret networks, and barriers. Weave infrastructure for the team.", reasonZh: "创建传送门、炮台网络和屏障。为团队编织基础设施。" },
    { name: "The Factorio Engineer", nameZh: "异星工程师", game: "Factorio", reason: "Connect every system, optimize every flow. See how everything connects.", reasonZh: "连接每个系统、优化每条流程。看到一切如何关联。" },
    { name: "Sage", nameZh: "Sage", game: "Valorant", reason: "Heal, wall, resurrect. The glue that holds every team composition together.", reasonZh: "治疗、围墙、复活。将每个阵容凝聚在一起的粘合剂。" },
    { name: "Zelda", nameZh: "塞尔达", game: "Legend of Zelda", reason: "Wisdom, magic, and the ability to see connections across time and space.", reasonZh: "智慧、魔法，以及看到时空关联的能力。" },
  ],
  sentinel: [
    { name: "Cypher", nameZh: "Cypher", game: "Valorant", reason: "Tripwires, cameras, and neural theft. Nothing passes your defensive setup.", reasonZh: "绊线、摄像头和神经窃取。没有什么能通过你的防御布置。" },
    { name: "Bastion", nameZh: "堡垒", game: "Overwatch", reason: "Set up, hold position, and unleash devastating firepower. The ultimate defensive anchor.", reasonZh: "架设、坚守阵地、释放毁灭性火力。终极防御锚点。" },
    { name: "Bowser", nameZh: "酷霸王", game: "Super Smash Bros.", reason: "Heavy, powerful, and impossible to knock out. The immovable defense.", reasonZh: "重型、强大、不可能被击飞。不可移动的防御。" },
    { name: "Paladin (WoW)", nameZh: "圣骑士", game: "World of Warcraft", reason: "Divine shield, lay on hands, tankiest tank. The holy fortress.", reasonZh: "神圣之盾、圣疗术、最硬的坦克。神圣堡垒。" },
  ],
  shapeshifter: [
    { name: "Kirby", nameZh: "卡比", game: "Kirby", reason: "Copy any ability, adapt to any situation. The original shapeshifter.", reasonZh: "复制任何能力、适应任何情况。最初的变形者。" },
    { name: "Mystique", nameZh: "魔形女", game: "X-Men (Various)", reason: "Become anyone, adapt to anything. Your versatility is limitless.", reasonZh: "变成任何人、适应任何事。你的多变性无限。" },
    { name: "Viego", nameZh: "佛耶戈", game: "League of Legends", reason: "Possess enemy champions and use their abilities. Ultimate adaptability.", reasonZh: "附身敌方英雄并使用他们的技能。终极适应力。" },
    { name: "Link (TotK)", nameZh: "林克", game: "Tears of the Kingdom", reason: "Fuse anything to anything. Every situation has a creative solution.", reasonZh: "把任何东西融合到任何东西上。每个情况都有创意解法。" },
  ],
  "lone-wolf": [
    { name: "Solid Snake", nameZh: "固蛇", game: "Metal Gear Solid", reason: "One-man infiltration missions. Works alone, trusts no one, gets the job done.", reasonZh: "单人渗透任务。独自行动、不信任任何人、完成任务。" },
    { name: "The Tarnished (Solo)", nameZh: "褪色者(Solo)", game: "Elden Ring", reason: "No summons, no guides. Face every boss alone and overcome through sheer mastery.", reasonZh: "不召唤、不看攻略。独自面对每个Boss，通过纯粹的精通战胜。" },
    { name: "Reaper", nameZh: "死神", game: "Overwatch", reason: "Flank alone, get kills alone, shadow step out. The lone hunter.", reasonZh: "独自绕后、独自击杀、暗影步撤离。孤独的猎手。" },
    { name: "Jin Sakai", nameZh: "境井仁", game: "Ghost of Tsushima", reason: "The Ghost. One samurai against an army, using stealth and skill.", reasonZh: "战鬼。一个武士对抗一支军队，用隐身和技术。" },
  ],
  collector: [
    { name: "Pokemon Trainer", nameZh: "宝可梦训练师", game: "Pokemon", reason: "Gotta catch 'em all. The original collector archetype.", reasonZh: "全部收集。最初的收藏家原型。" },
    { name: "Tom Nook", nameZh: "狸克", game: "Animal Crossing", reason: "Build your island, catalog everything, complete the museum. Organized collecting.", reasonZh: "建造你的岛、编目一切、完成博物馆。有组织的收集。" },
    { name: "The Curator", nameZh: "馆长", game: "Dark Pictures Anthology", reason: "Collect every clue, find every secret, unlock every ending. Completionist energy.", reasonZh: "收集每条线索、找到每个秘密、解锁每个结局。完成主义能量。" },
    { name: "Geralt (Completionist)", nameZh: "杰洛特(完成主义)", game: "The Witcher 3", reason: "Clear every ? from the map, collect every card for Gwent. Leave no stone unturned.", reasonZh: "清除地图上每个?号、收集昆特牌。不留任何死角。" },
  ],
  "chaos-child": [
    { name: "Sans", nameZh: "Sans", game: "Undertale", reason: "Breaks the fourth wall, subverts expectations, doesn't play by the rules.", reasonZh: "打破第四面墙、颠覆期望、不按规则玩。" },
    { name: "Crazy Dave", nameZh: "疯狂戴夫", game: "Plants vs. Zombies", reason: "Wabby wabbo! Pure chaotic energy in human form.", reasonZh: "Wabby wabbo！人形的纯粹混沌能量。" },
    { name: "Joker", nameZh: "小丑", game: "Batman (Various)", reason: "Why so serious? Chaos isn't a pit — it's a ladder.", reasonZh: "为什么这么严肃？混沌不是深坑——是阶梯。" },
    { name: "Yoshi", nameZh: "耀西", game: "Super Mario", reason: "Eat everything, throw eggs at everything, flutter-jump through chaos.", reasonZh: "吃掉一切、用蛋砸一切、在混沌中飘飘跳。" },
  ],
};

// ==================== GROWTH TIPS ====================

export interface GrowthTip {
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  games: string[]; // game names for training this weakness
}

/**
 * Generate growth tips from archetype data.
 * These are computed at render time from the archetype definition.
 */
export function getGrowthContent(archetypeId: string): {
  trainingGames: { name: string; nameZh: string; why: string; whyZh: string }[];
} {
  const trainingMap: Record<string, { name: string; nameZh: string; why: string; whyZh: string }[]> = {
    strategy_logic: [
      { name: "Chess.com", nameZh: "国际象棋", why: "Pure strategy with no randomness. Forces you to think before acting.", whyZh: "纯策略无随机性。强迫你在行动前思考。" },
      { name: "Into the Breach", nameZh: "陷阵之志", why: "Turn-based puzzle where every move has consequences. Trains planning.", whyZh: "每一步都有后果的回合制解谜。训练规划能力。" },
    ],
    emotional_control: [
      { name: "Getting Over It", nameZh: "和班尼特福迪一起攻克难关", why: "Designed to frustrate you. Mastering this = mastering tilt.", whyZh: "专门设计来让你抓狂。征服它=征服心态崩溃。" },
      { name: "Dark Souls", nameZh: "黑暗之魂", why: "Die 100 times to the same boss without rage-quitting. Emotional training.", whyZh: "同一个Boss死100次不退出。情绪训练。" },
    ],
    reaction_speed: [
      { name: "Aim Lab", nameZh: "Aim Lab", why: "Free aim trainer. Daily practice improves reaction time measurably.", whyZh: "免费瞄准训练器。每日练习可以显著提升反应时间。" },
      { name: "osu!", nameZh: "osu!", why: "Rhythm + speed. Start easy, push difficulty gradually.", whyZh: "节奏+速度。从简单开始，逐步提升难度。" },
    ],
    pattern_recog: [
      { name: "Baba Is You", nameZh: "Baba Is You", why: "Rules themselves are puzzles. Trains lateral thinking and pattern breaking.", whyZh: "规则本身就是谜题。训练横向思维和打破模式。" },
      { name: "Return of the Obra Dinn", nameZh: "奥伯拉丁的回归", why: "Deductive reasoning from visual clues. Trains pattern recognition deeply.", whyZh: "从视觉线索进行推理。深度训练模式识别。" },
    ],
    teamwork_tendency: [
      { name: "It Takes Two", nameZh: "双人成行", why: "Literally impossible to play alone. Forces you to cooperate and communicate.", whyZh: "字面上无法单人游玩。强迫你合作和沟通。" },
      { name: "Overcooked 2", nameZh: "胡闹厨房2", why: "Kitchen chaos that fails without teamwork. Teaches coordination under pressure.", whyZh: "没有团队合作就失败的厨房混乱。教授压力下的协调。" },
    ],
    decision_speed: [
      { name: "FTL: Faster Than Light", nameZh: "FTL:超越光速", why: "Real-time pausing won't save you from tough decisions. Trains decisive thinking.", whyZh: "实时暂停救不了你的艰难决策。训练果断思维。" },
      { name: "Slay the Spire", nameZh: "杀戮尖塔", why: "Every card choice is a decision under uncertainty. Builds decision muscle.", whyZh: "每张牌的选择都是不确定下的决策。锻炼决策肌肉。" },
    ],
    hand_eye_coord: [
      { name: "Aim Lab", nameZh: "Aim Lab", why: "Track targets, flick to corners, and build mouse control precision.", whyZh: "追踪目标、甩枪到角落、建立鼠标控制精度。" },
      { name: "Celeste", nameZh: "蔚蓝", why: "Precision platforming that demands pixel-perfect control.", whyZh: "需要像素级精确控制的精确平台跳跃。" },
    ],
    memory: [
      { name: "Outer Wilds", nameZh: "星际拓荒", why: "No quest log — you must remember clues from previous loops. Pure memory gameplay.", whyZh: "没有任务日志——你必须记住之前循环的线索。纯记忆玩法。" },
      { name: "Simon (Classic)", nameZh: "西蒙(经典)", why: "Memorize increasingly long sequences. Direct memory training.", whyZh: "记忆越来越长的序列。直接的记忆训练。" },
    ],
    spatial_awareness: [
      { name: "Portal 2", nameZh: "传送门2", why: "Think in 3D portals. Rewires your spatial reasoning.", whyZh: "用3D传送门思考。重塑你的空间推理。" },
      { name: "Tetris Effect", nameZh: "俄罗斯方块效应", why: "Rotate, fit, and clear. The classic spatial awareness trainer, elevated.", whyZh: "旋转、拼合、消除。经典空间感知训练器的升级版。" },
    ],
    rhythm_sense: [
      { name: "Beat Saber", nameZh: "节奏光剑", why: "Physical rhythm training in VR. Your body learns the beat.", whyZh: "VR中的物理节奏训练。你的身体学习节拍。" },
      { name: "Crypt of the NecroDancer", nameZh: "节奏地牢", why: "Move to the beat while making tactical decisions. Rhythm meets strategy.", whyZh: "跟着节拍移动同时做战术决策。节奏遇上策略。" },
    ],
    multitasking: [
      { name: "StarCraft II", nameZh: "星际争霸2", why: "Manage base, army, and scouting simultaneously. The ultimate multitasking test.", whyZh: "同时管理基地、军队和侦查。终极多任务测试。" },
      { name: "Overcooked 2", nameZh: "胡闹厨房2", why: "Cook, serve, clean, and communicate — all at once under time pressure.", whyZh: "烹饪、上菜、清洁、沟通——全部在时间压力下同时进行。" },
    ],
    risk_assessment: [
      { name: "Poker", nameZh: "扑克", why: "Every bet is a risk calculation. Trains probabilistic thinking.", whyZh: "每次下注都是风险计算。训练概率思维。" },
      { name: "Darkest Dungeon", nameZh: "暗黑地牢", why: "Push deeper or retreat? Every decision has real consequences.", whyZh: "继续深入还是撤退？每个决策都有真实后果。" },
    ],
    resource_mgmt: [
      { name: "Factorio", nameZh: "异星工厂", why: "Optimize production chains with limited resources. The resource management masterclass.", whyZh: "用有限资源优化生产链。资源管理大师课。" },
      { name: "Frostpunk", nameZh: "冰汽时代", why: "Survival demands ruthless resource prioritization. Every coal matters.", whyZh: "生存要求无情的资源优先级排序。每块煤都重要。" },
    ],
  };

  return {
    trainingGames: trainingMap[archetypeId] || trainingMap.strategy_logic,
  };
}
