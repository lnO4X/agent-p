import type { TalentCategory } from "@/types/talent";

// ==================== ARCHETYPE TYPE ====================

export interface Archetype {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  tagline: string;
  taglineEn: string;
  description: string;
  descriptionEn: string;
  weakness: string;
  weaknessEn: string;
  nemesisId: string;
  allyId: string;
  weakTalent: TalentCategory;
  strongTalent: TalentCategory;
  /** Evolution target archetype ID (what you become if you fix your weakness) */
  evolutionId: string;
  evolutionHint: string;
  evolutionHintEn: string;
  /** CSS gradient colors [from, to] */
  gradient: [string, string];
  /** Recommended game genres */
  genres: string[];
}

// ==================== 16 ARCHETYPES ====================

export const ARCHETYPES: Record<string, Archetype> = {
  "lightning-assassin": {
    id: "lightning-assassin",
    name: "闪电刺客",
    nameEn: "Lightning Assassin",
    icon: "⚡",
    tagline: "战场上只有两种状态：快，和更快。",
    taglineEn: "Only two speeds on the battlefield: fast, and faster.",
    description:
      "你的反应速度是你最锋利的武器。当别人还在思考时，你已经完成了三次操作。你天生适合需要极致手速和瞬间判断的游戏——FPS里的闪狙、格斗游戏里的确认连段、音游里的全连。你的弱点？你太快了，快到没有时间思考。当对手用策略而非速度击败你时，你会感到前所未有的挫败。",
    descriptionEn:
      "Your reaction speed is your sharpest weapon. While others are still thinking, you've already made three moves. You thrive in games demanding peak reflexes — FPS flick shots, fighting game combos, rhythm game perfect clears. Your weakness? You're so fast you forget to think. When an opponent beats you with strategy instead of speed, the frustration is real.",
    weakness: "你的大脑跑得比思维快。长线策略是你的盲区。",
    weaknessEn: "Your hands move faster than your mind. Long-term strategy is your blind spot.",
    nemesisId: "oracle",
    allyId: "commander",
    weakTalent: "strategy_logic",
    strongTalent: "reaction_speed",
    evolutionId: "duelist",
    evolutionHint: "提升策略逻辑到B级，你将进化为冷血决斗者——速度与智慧兼具。",
    evolutionHintEn: "Raise Strategy to B rank to evolve into the Duelist — speed meets intellect.",
    gradient: ["#3b82f6", "#06b6d4"],
    genres: ["fps", "rhythm", "racing"],
  },

  berserker: {
    id: "berserker",
    name: "狂暴战士",
    nameEn: "Berserker",
    icon: "🔥",
    tagline: "混乱不是缺点，是战术。",
    taglineEn: "Chaos isn't a flaw — it's a strategy.",
    description:
      "你是战场上最不可预测的存在。高速反应加上冒险本能，你的打法没有章法，但偏偏有效。你在大逃杀里落地就冲，在FPS里永远在突脸，在格斗游戏里疯狂按键居然能赢。你的情绪控制是最大弱点——连败时你会越打越急，直到彻底崩盘。",
    descriptionEn:
      "You're the most unpredictable force on the battlefield. Lightning reflexes paired with risk-taking instincts — your playstyle has no playbook, yet somehow it works. You hot-drop in battle royales, rush every fight in FPS, and button-mash your way to wins. Your Achilles heel? Tilt. Losing streaks make you play worse, spiraling into full meltdown.",
    weakness: "连败三局后你会开始砸键盘。情绪是你最大的敌人。",
    weaknessEn: "Three losses in a row and you start smashing your keyboard. Emotions are your worst enemy.",
    nemesisId: "fortress",
    allyId: "rhythm-walker",
    weakTalent: "emotional_control",
    strongTalent: "reaction_speed",
    evolutionId: "lightning-assassin",
    evolutionHint: "学会控制情绪到B级，你将进化为闪电刺客——保留速度，去掉失控。",
    evolutionHintEn: "Raise Emotional Control to B rank to evolve into Lightning Assassin — keep the speed, lose the chaos.",
    gradient: ["#ef4444", "#f97316"],
    genres: ["fps", "battle_royale", "racing"],
  },

  sharpshooter: {
    id: "sharpshooter",
    name: "精确射手",
    nameEn: "Sharpshooter",
    icon: "🎯",
    tagline: "一发入魂，从不浪费子弹。",
    taglineEn: "One shot, one kill. Never waste a bullet.",
    description:
      "你拥有罕见的组合：极快的反应速度和极高的情绪稳定性。你不是那个冲锋在前的人，而是那个在关键时刻一枪定胜负的人。你的手眼协调让你在精准度游戏里无人能敌。你的弱点是创造力——当游戏需要非常规思路时，你会感到不适。",
    descriptionEn:
      "You possess a rare combination: blazing reflexes with rock-solid composure. You're not the one charging in — you're the one who lands the decisive shot when it matters. Your hand-eye coordination makes you unbeatable in precision games. Your weakness is creativity — when a game demands unconventional thinking, you feel out of your element.",
    weakness: "你太依赖精准度。当游戏规则突然改变，你需要时间适应。",
    weaknessEn: "You rely too much on precision. When rules change suddenly, you need time to adapt.",
    nemesisId: "chaos-child",
    allyId: "oracle",
    weakTalent: "pattern_recog",
    strongTalent: "hand_eye_coord",
    evolutionId: "duelist",
    evolutionHint: "提升模式识别到B级，你将进化为冷血决斗者——精准之上再加洞察。",
    evolutionHintEn: "Raise Pattern Recognition to B rank to evolve into the Duelist — add insight to your precision.",
    gradient: ["#8b5cf6", "#6366f1"],
    genres: ["fps", "racing", "rhythm"],
  },

  duelist: {
    id: "duelist",
    name: "冷血决斗者",
    nameEn: "Duelist",
    icon: "⚔️",
    tagline: "我读懂了你的每一个意图，然后比你更快地执行。",
    taglineEn: "I read every move you make — then execute faster.",
    description:
      "操作型玩家的完美进化体。你既有闪电般的反应速度，又有冷静的策略头脑。在1v1对决中，你几乎是无敌的——你能读懂对手的意图，然后用更快的操作碾压他们。格斗游戏、竞速1v1、MOBA单杀，都是你的主场。你的弱点是团队合作——你太强了，以至于不习惯依赖别人。",
    descriptionEn:
      "The perfect evolution of the reflexive player. You have lightning reactions AND a strategic mind. In 1v1 duels, you're nearly unbeatable — reading opponents' intentions while executing faster than they can react. Fighting games, racing 1v1s, MOBA solo kills — all your domain. Your weakness is teamwork — you're so self-sufficient that relying on others feels unnatural.",
    weakness: "你是完美的独行者，但在需要团队协作的场景里，你不知道如何信任队友。",
    weaknessEn: "You're a perfect loner. In team scenarios, trusting teammates feels impossible.",
    nemesisId: "commander",
    allyId: "lone-wolf",
    weakTalent: "teamwork_tendency",
    strongTalent: "reaction_speed",
    evolutionId: "lone-wolf",
    evolutionHint: "这已经是操作型的终极形态。接纳团队协作，你将解锁独狼——不是不能合作，而是选择何时独行。",
    evolutionHintEn: "This is peak reflexive form. Embrace teamwork to unlock Lone Wolf — choosing when to go solo, not being forced to.",
    gradient: ["#ec4899", "#be185d"],
    genres: ["fps", "racing", "moba"],
  },

  oracle: {
    id: "oracle",
    name: "预言师",
    nameEn: "Oracle",
    icon: "🧠",
    tagline: "我不需要快。我只需要对。",
    taglineEn: "I don't need to be fast. I just need to be right.",
    description:
      "你的大脑是最强的武器。超强的记忆力、敏锐的模式识别、缜密的策略思维——你是那种能在10步之前就预判出对手行动的人。卡牌游戏里你记得每一张出过的牌，策略游戏里你的经济永远领先，解谜游戏里你能看到别人看不到的规律。你的弱点是速度——当游戏要求快速反应时，你的大脑处理完毕，手已经来不及了。",
    descriptionEn:
      "Your brain is your ultimate weapon. Exceptional memory, sharp pattern recognition, meticulous strategic thinking — you predict opponents' moves 10 steps ahead. In card games you track every card played, in strategy games your economy is always ahead, in puzzles you see patterns others miss. Your weakness is speed — by the time your brain finishes processing, your hands are too late.",
    weakness: "你想得太多，动得太慢。需要瞬间反应的场景是你的噩梦。",
    weaknessEn: "You think too much, act too slow. Split-second reactions are your nightmare.",
    nemesisId: "lightning-assassin",
    allyId: "fortress",
    weakTalent: "reaction_speed",
    strongTalent: "strategy_logic",
    evolutionId: "shadow-strategist",
    evolutionHint: "提升决策速度到B级，你将进化为暗影策士——思维的速度也能成为武器。",
    evolutionHintEn: "Raise Decision Speed to B rank to evolve into Shadow Strategist — make thinking itself a weapon.",
    gradient: ["#06b6d4", "#0891b2"],
    genres: ["card", "puzzle", "strategy"],
  },

  fortress: {
    id: "fortress",
    name: "不动要塞",
    nameEn: "Fortress",
    icon: "🏰",
    tagline: "你可以进攻一万次。我只需要防住每一次。",
    taglineEn: "Attack a thousand times. I only need to block every single one.",
    description:
      "你是耐心的化身。超强的资源管理能力配合冷静的情绪控制，你在任何消耗战中都立于不败之地。模拟经营游戏里你的收益曲线完美，策略游戏里你龟缩发育让对手绝望，塔防游戏里你的防线密不透风。你的弱点是进攻——你太稳了，稳到错失了无数主动出击的机会。",
    descriptionEn:
      "You are patience personified. Superior resource management paired with unshakeable composure — you win every war of attrition. In simulation games your profit curves are textbook, in strategy games you turtle until opponents despair, in tower defense your walls never crack. Your weakness is offense — you're so stable that you miss countless opportunities to strike first.",
    weakness: "你永远在等待'完美时机'，但完美时机往往不存在。",
    weaknessEn: "You wait forever for the 'perfect moment' — but the perfect moment rarely comes.",
    nemesisId: "berserker",
    allyId: "oracle",
    weakTalent: "decision_speed",
    strongTalent: "resource_mgmt",
    evolutionId: "sentinel",
    evolutionHint: "提升决策速度到B级，你将进化为钢铁守望者——既能防守，也知道何时反击。",
    evolutionHintEn: "Raise Decision Speed to B rank to evolve into Sentinel — defend AND know when to counter-attack.",
    gradient: ["#78716c", "#57534e"],
    genres: ["simulation", "strategy", "card"],
  },

  "shadow-strategist": {
    id: "shadow-strategist",
    name: "暗影策士",
    nameEn: "Shadow Strategist",
    icon: "💀",
    tagline: "最危险的人，是你看不见的那个。",
    taglineEn: "The most dangerous player is the one you never see coming.",
    description:
      "你是暗处的操控者。高超的策略头脑加上快速的决策能力，你不在乎正面交锋——你更喜欢在对手意识到之前就赢下比赛。RTS里你的暗兵骚扰让对手崩溃，解谜游戏里你总能找到捷径，策略游戏里你的每一步都是陷阱。你的弱点是团队——你的计划太精密了，不允许队友的'即兴发挥'。",
    descriptionEn:
      "You're the puppeteer in the shadows. Superior strategic mind plus rapid decision-making — you don't care about head-on fights. You prefer winning before opponents realize the game has started. In RTS your harassment breaks enemies, in puzzles you always find shortcuts, in strategy games every move is a trap. Your weakness is teamwork — your plans are too intricate for teammates' 'improvisation'.",
    weakness: "你的计划太精密，任何意外都会让你烦躁。你讨厌'队友'这个变量。",
    weaknessEn: "Your plans are too precise. Any surprise irritates you. 'Teammates' are an unwelcome variable.",
    nemesisId: "chaos-child",
    allyId: "collector",
    weakTalent: "teamwork_tendency",
    strongTalent: "strategy_logic",
    evolutionId: "oracle",
    evolutionHint: "提升团队协作到B级，你将进化为预言师——用更开放的视角看到更大的棋局。",
    evolutionHintEn: "Raise Teamwork to B rank to evolve into Oracle — see the bigger picture with an open mind.",
    gradient: ["#1e1b4b", "#4c1d95"],
    genres: ["strategy", "puzzle", "card"],
  },

  gambler: {
    id: "gambler",
    name: "混沌赌徒",
    nameEn: "Gambler",
    icon: "🎲",
    tagline: "搏一把，万一赢了呢？",
    taglineEn: "Roll the dice. What if I win?",
    description:
      "你的人生信条是'高风险高回报'。快速的决策加上天生的冒险本能，你在需要赌一把的时刻总能做出大胆的选择——而且经常是对的。大逃杀里你永远在追空投，Roguelike里你选最危险的路线，卡牌游戏里你全押。你的弱点是稳定性——你要么大赢，要么惨败，没有中间地带。",
    descriptionEn:
      "Your life motto: high risk, high reward. Quick decisions plus natural risk-taking instincts — when the moment demands a bold choice, you always go all-in. And you're right more often than you should be. In battle royales you chase every airdrop, in roguelikes you pick the most dangerous path, in card games you go all-in. Your weakness is consistency — you either win big or crash hard, no middle ground.",
    weakness: "你不知道'见好就收'四个字怎么写。一次大赢就让你忘记十次惨败。",
    weaknessEn: "You don't know when to stop. One big win erases the memory of ten disasters.",
    nemesisId: "sentinel",
    allyId: "berserker",
    weakTalent: "emotional_control",
    strongTalent: "risk_assessment",
    evolutionId: "shadow-strategist",
    evolutionHint: "提升情绪控制到B级，你将进化为暗影策士——保留冒险直觉，加上冷静执行。",
    evolutionHintEn: "Raise Emotional Control to B rank to evolve into Shadow Strategist — keep the instincts, add cold execution.",
    gradient: ["#d97706", "#b45309"],
    genres: ["battle_royale", "card", "strategy"],
  },

  "rhythm-walker": {
    id: "rhythm-walker",
    name: "韵律行者",
    nameEn: "Rhythm Walker",
    icon: "🎵",
    tagline: "每个动作都有节拍，每个节拍都恰到好处。",
    taglineEn: "Every move has a beat. Every beat is perfect.",
    description:
      "你拥有独特的天赋：你能感受到游戏的'节奏'。不只是音乐游戏——你在所有游戏中都能找到一种韵律。FPS里你的射击节奏稳如节拍器，平台跳跃里你的跳跃时机完美无缺，MOBA里你的技能衔接行云流水。你的弱点是需要时间进入'心流'——被打断后很难立刻找回节奏。",
    descriptionEn:
      "You have a unique gift: you feel the 'rhythm' of any game. Not just music games — you find a beat in everything. In FPS your shooting rhythm is metronome-steady, in platformers your jump timing is flawless, in MOBAs your skill combos flow like water. Your weakness is needing time to enter 'flow state' — once interrupted, finding the rhythm again takes time.",
    weakness: "你需要'热身'才能进入状态。被打断节奏后你会手忙脚乱。",
    weaknessEn: "You need to warm up to find your groove. Interruptions throw you off completely.",
    nemesisId: "gambler",
    allyId: "sharpshooter",
    weakTalent: "multitasking",
    strongTalent: "rhythm_sense",
    evolutionId: "weaver",
    evolutionHint: "提升多任务处理到B级，你将进化为编织者——同时维持多条节奏线。",
    evolutionHintEn: "Raise Multitasking to B rank to evolve into Weaver — maintain multiple rhythm lines simultaneously.",
    gradient: ["#ec4899", "#db2777"],
    genres: ["rhythm", "racing", "moba"],
  },

  commander: {
    id: "commander",
    name: "指挥官",
    nameEn: "Commander",
    icon: "👑",
    tagline: "最强的武器不是个人技术，是让五个人变成一支军队。",
    taglineEn: "The greatest weapon isn't individual skill — it's turning five players into an army.",
    description:
      "你是天生的领袖。你最强的能力不是个人操作，而是让团队发挥出最大战力。你能看到全局，分配资源，在混乱中做出正确决策。MOBA里你是最佳辅助/指挥，MMO里你是公会核心，策略游戏里你的多线操作无人能敌。你的弱点是单独行动——当没有团队可以指挥时，你的优势全部消失。",
    descriptionEn:
      "You're a born leader. Your greatest strength isn't individual skill — it's maximizing team performance. You see the big picture, allocate resources, and make the right calls in chaos. In MOBAs you're the perfect support/shotcaller, in MMOs you're the guild backbone, in strategy games your multi-front management is unmatched. Your weakness is solo play — without a team to lead, your advantages evaporate.",
    weakness: "一个人的时候你会迷失方向。你需要团队来定义自己的价值。",
    weaknessEn: "Alone, you lose your purpose. You need a team to define your value.",
    nemesisId: "duelist",
    allyId: "lightning-assassin",
    weakTalent: "hand_eye_coord",
    strongTalent: "teamwork_tendency",
    evolutionId: "weaver",
    evolutionHint: "提升手眼协调到B级，你将进化为编织者——指挥全局的同时也能亲自操刀。",
    evolutionHintEn: "Raise Hand-Eye Coordination to B rank to evolve into Weaver — command AND execute.",
    gradient: ["#eab308", "#ca8a04"],
    genres: ["moba", "strategy", "simulation"],
  },

  weaver: {
    id: "weaver",
    name: "编织者",
    nameEn: "Weaver",
    icon: "🔮",
    tagline: "左手操控战场，右手编织胜局。",
    taglineEn: "One hand controls the battlefield; the other weaves victory.",
    description:
      "你是人形多线程处理器。同时追踪多个信息源、管理多个任务、在多条战线同时作战——对你来说不是挑战，而是日常。RTS里你同时运营三个基地，MOBA里你边打团边看小地图追踪全局，模拟经营里你同时管理十条生产线。你的弱点是专注力——你什么都在做，但有时候没有一件做到极致。",
    descriptionEn:
      "You're a human multi-threaded processor. Tracking multiple information streams, managing parallel tasks, fighting on multiple fronts — for you, this isn't challenging, it's normal. In RTS you run three bases simultaneously, in MOBAs you teamfight while tracking the minimap, in simulation games you manage ten production lines at once. Your weakness is focus — you do everything, but sometimes nothing to perfection.",
    weakness: "你什么都在做，但有时候每件事都只做了80%。差的那20%要命。",
    weaknessEn: "You do everything at 80%. That missing 20% can be lethal.",
    nemesisId: "lone-wolf",
    allyId: "commander",
    weakTalent: "emotional_control",
    strongTalent: "multitasking",
    evolutionId: "commander",
    evolutionHint: "提升情绪控制到B级，你将进化为指挥官——多线程+冷静=最强大脑。",
    evolutionHintEn: "Raise Emotional Control to B rank to evolve into Commander — multithreading + composure = ultimate brain.",
    gradient: ["#a855f7", "#7c3aed"],
    genres: ["strategy", "simulation", "moba"],
  },

  sentinel: {
    id: "sentinel",
    name: "钢铁守望者",
    nameEn: "Sentinel",
    icon: "🛡️",
    tagline: "我不是最强的，但你别想从我身边过。",
    taglineEn: "I'm not the strongest — but you're not getting past me.",
    description:
      "你是团队的基石。超强的空间感知让你总能找到最佳防守位置，稳定的情绪控制让你在逆境中屹立不倒，出色的资源管理让你永远不会断粮。塔防游戏里你的防线无懈可击，FPS里你是最可靠的anchor选手，生存游戏里你的据点固若金汤。你的弱点是主动进攻——你习惯了反应，不擅长主动创造机会。",
    descriptionEn:
      "You're the team's foundation. Superior spatial awareness finds optimal defensive positions, stable emotional control keeps you standing in adversity, excellent resource management ensures you never run dry. In tower defense your lines are impenetrable, in FPS you're the most reliable anchor, in survival games your base is a fortress. Your weakness is aggression — you react well but struggle to create opportunities.",
    weakness: "你总在等对手犯错，但优秀的对手不会犯错。",
    weaknessEn: "You wait for opponents to make mistakes — but great opponents don't.",
    nemesisId: "gambler",
    allyId: "fortress",
    weakTalent: "risk_assessment",
    strongTalent: "spatial_awareness",
    evolutionId: "fortress",
    evolutionHint: "提升风险评估到B级，你将进化为不动要塞——防守大师的最终形态。",
    evolutionHintEn: "Raise Risk Assessment to B rank to evolve into Fortress — the ultimate defensive master.",
    gradient: ["#64748b", "#475569"],
    genres: ["simulation", "strategy", "puzzle"],
  },

  shapeshifter: {
    id: "shapeshifter",
    name: "变形者",
    nameEn: "Shapeshifter",
    icon: "🎭",
    tagline: "我没有风格，因为所有风格都是我的。",
    taglineEn: "I have no style — because every style is mine.",
    description:
      "你是最罕见的类型。你的各项天赋高度均衡，没有明显的短板，也没有极端的长板。你能适应任何游戏类型，学习任何角色，切换任何策略。这是你最大的优势——也是你最大的陷阱。因为你什么都能做，你可能一直在'还行'的水平上游走，而从未真正在某个领域达到顶峰。",
    descriptionEn:
      "You're the rarest type. Your talents are remarkably balanced — no glaring weaknesses, no extreme strengths. You adapt to any game genre, learn any role, switch any strategy. This is your greatest strength — and your greatest trap. Because you can do everything, you might stay 'pretty good' at everything without ever reaching the peak in anything.",
    weakness: "万金油的诅咒：什么都能做，但什么都不是最强的。",
    weaknessEn: "The jack-of-all-trades curse: good at everything, best at nothing.",
    nemesisId: "collector",
    allyId: "gambler",
    weakTalent: "memory",
    strongTalent: "multitasking",
    evolutionId: "lone-wolf",
    evolutionHint: "找到你最想强化的天赋并提升到A级——变形者没有固定进化路径，你选择成为谁。",
    evolutionHintEn: "Find the talent you want to master and raise it to A rank — Shapeshifters choose their own evolution.",
    gradient: ["#6366f1", "#8b5cf6"],
    genres: ["rpg", "moba", "battle_royale"],
  },

  "lone-wolf": {
    id: "lone-wolf",
    name: "独狼",
    nameEn: "Lone Wolf",
    icon: "🐺",
    tagline: "我不是不合群，我只是不需要群。",
    taglineEn: "I'm not antisocial. I just don't need the pack.",
    description:
      "你是自成一体的作战单位。高速反应、精准操作、敏锐策略——你在几乎所有个人维度上都表现优秀。你不需要队友的帮助，也不想要。单机RPG里你是完美的主角，大逃杀里你是最可怕的solo选手，Roguelike里你独自征服一切。你的弱点很明确：当游戏强制要求团队合作时，你会成为最让队友头疼的存在。",
    descriptionEn:
      "You're a self-contained combat unit. Fast reactions, precise execution, sharp strategy — you excel in nearly every individual dimension. You don't need teammates' help, and you don't want it. In solo RPGs you're the perfect protagonist, in battle royales you're the most terrifying solo player, in roguelikes you conquer alone. Your weakness is clear: when games force teamwork, you become every teammate's worst nightmare.",
    weakness: "你是最强的个体，但五个你组成的队伍会输给五个指挥官。",
    weaknessEn: "You're the strongest individual — but a team of five of you loses to five Commanders.",
    nemesisId: "commander",
    allyId: "duelist",
    weakTalent: "teamwork_tendency",
    strongTalent: "decision_speed",
    evolutionId: "duelist",
    evolutionHint: "独狼已是终极个人形态。唯一的进化是学会信任——但那已经超出天赋的范畴。",
    evolutionHintEn: "Lone Wolf is the ultimate individual form. The only evolution is learning to trust — but that transcends talent.",
    gradient: ["#374151", "#1f2937"],
    genres: ["rpg", "battle_royale", "puzzle"],
  },

  collector: {
    id: "collector",
    name: "收藏家",
    nameEn: "Collector",
    icon: "💎",
    tagline: "不是强迫症，是对完美的追求。",
    taglineEn: "It's not OCD — it's the pursuit of perfection.",
    description:
      "你的大脑是一个精密的数据库。超强的记忆力配合敏锐的模式识别和细致的资源管理，你注意到别人忽略的每一个细节。RPG里你收集每一个成就，策略游戏里你的资源利用率接近100%，解谜游戏里你能记住每一条线索。你的弱点是速度——你太追求完美了，以至于在需要快速决策时犹豫不决。",
    descriptionEn:
      "Your brain is a precision database. Superior memory paired with sharp pattern recognition and meticulous resource management — you notice every detail others miss. In RPGs you collect every achievement, in strategy games your resource efficiency approaches 100%, in puzzles you remember every clue. Your weakness is speed — your pursuit of perfection makes you hesitate when quick decisions are needed.",
    weakness: "完美主义是你的恩赐也是你的枷锁。你宁可慢也不愿错。",
    weaknessEn: "Perfectionism is both your gift and your chains. You'd rather be slow than wrong.",
    nemesisId: "shapeshifter",
    allyId: "shadow-strategist",
    weakTalent: "decision_speed",
    strongTalent: "memory",
    evolutionId: "oracle",
    evolutionHint: "提升决策速度到B级，你将进化为预言师——数据+直觉=预知未来。",
    evolutionHintEn: "Raise Decision Speed to B rank to evolve into Oracle — data + intuition = seeing the future.",
    gradient: ["#14b8a6", "#0d9488"],
    genres: ["rpg", "simulation", "puzzle"],
  },

  "chaos-child": {
    id: "chaos-child",
    name: "混沌之子",
    nameEn: "Chaos Child",
    icon: "🌪️",
    tagline: "规则是用来打破的，秩序是用来颠覆的。",
    taglineEn: "Rules are made to be broken. Order is made to be overthrown.",
    description:
      "你是最不可预测的玩家类型。你的多任务能力让你同时搅动多条战线，高风险倾向让你做出匪夷所思的决策——但奇迹般地，有时候这些混乱的决策比任何精密策略都有效。Roguelike里你专选最离谱的build，大逃杀里你的行动轨迹让对手完全无法预判。你的弱点是情绪波动——兴奋和沮丧的落差巨大。",
    descriptionEn:
      "You're the most unpredictable player type. Your multitasking lets you stir chaos on multiple fronts, and your high-risk tendencies produce decisions that defy all logic — yet miraculously, sometimes these chaotic choices outperform any calculated strategy. In roguelikes you pick the most absurd builds, in battle royales your movement patterns are completely unreadable. Your weakness is emotional swings — the gap between excitement and despair is enormous.",
    weakness: "你的情绪像过山车，高点极高，低点极低。稳定发挥不存在的。",
    weaknessEn: "Your emotions are a roller coaster. Sky-high highs, rock-bottom lows. Consistency doesn't exist.",
    nemesisId: "sharpshooter",
    allyId: "berserker",
    weakTalent: "emotional_control",
    strongTalent: "risk_assessment",
    evolutionId: "gambler",
    evolutionHint: "提升情绪控制到B级，你将进化为混沌赌徒——保留混沌，学会收手。",
    evolutionHintEn: "Raise Emotional Control to B rank to evolve into Gambler — keep the chaos, learn when to stop.",
    gradient: ["#f59e0b", "#ea580c"],
    genres: ["battle_royale", "rpg", "card"],
  },
};

// ==================== QUICK TEST CONFIG ====================

/** The 3 game IDs used for quick archetype test */
export const QUICK_TEST_GAMES = [
  "reaction-speed", // Reflexive axis
  "pattern",        // Strategic axis
  "risk",           // Risk/Decision axis
] as const;

// ==================== SCORING ALGORITHM ====================

/**
 * Determine archetype from 3 quick-test scores.
 * Uses two axes: Reflexive-vs-Strategic and Bold-vs-Steady.
 */
export function quickScoresToArchetype(
  reactionScore: number,
  patternScore: number,
  riskScore: number
): Archetype {
  // Axis 1: Reflexive vs Strategic
  const reflexive = reactionScore;
  const strategic = patternScore;

  // Axis 2: Bold vs Steady (risk score interpretation)
  // High risk score = good at risk management = calculated/steady
  // Medium = adaptive, Low = impulsive/bold
  const bold = 100 - riskScore; // invert: high boldness = low risk management score

  const isReflexive = reflexive > strategic;
  const isStrategic = !isReflexive;
  const isBold = bold > 55;
  const isSteady = bold < 45;
  const avg = (reflexive + strategic + riskScore) / 3;

  // Check for balanced (shapeshifter)
  const spread = Math.max(reactionScore, patternScore, riskScore) -
                 Math.min(reactionScore, patternScore, riskScore);
  if (spread < 12) {
    return ARCHETYPES["shapeshifter"];
  }

  // Quadrant mapping
  if (isReflexive && isBold) {
    // Fast + Bold → Berserker or Lightning Assassin
    return reflexive >= 65
      ? ARCHETYPES["lightning-assassin"]
      : ARCHETYPES["berserker"];
  }

  if (isReflexive && isSteady) {
    // Fast + Steady → Sharpshooter or Duelist
    return strategic >= 45
      ? ARCHETYPES["duelist"]
      : ARCHETYPES["sharpshooter"];
  }

  if (isStrategic && isBold) {
    // Smart + Bold → Shadow Strategist or Gambler
    return strategic >= 65
      ? ARCHETYPES["shadow-strategist"]
      : ARCHETYPES["gambler"];
  }

  if (isStrategic && isSteady) {
    // Smart + Steady → Oracle or Fortress
    return strategic >= 65
      ? ARCHETYPES["oracle"]
      : ARCHETYPES["fortress"];
  }

  // Adaptive (neither bold nor steady)
  if (isReflexive) {
    return avg >= 60
      ? ARCHETYPES["rhythm-walker"]
      : ARCHETYPES["chaos-child"];
  } else {
    return avg >= 60
      ? ARCHETYPES["collector"]
      : ARCHETYPES["sentinel"];
  }
}

/**
 * Determine archetype from full 13-dimension talent profile.
 * More accurate than quick test — considers all dimensions.
 */
export function scoreToArchetype(
  scores: Partial<Record<TalentCategory, number>>
): Archetype {
  const get = (k: TalentCategory) => scores[k] ?? 50;

  // Compute factor scores
  const reflexive =
    get("reaction_speed") * 0.4 +
    get("hand_eye_coord") * 0.3 +
    get("rhythm_sense") * 0.3;

  const strategic =
    get("strategy_logic") * 0.35 +
    get("memory") * 0.25 +
    get("pattern_recog") * 0.25 +
    get("spatial_awareness") * 0.15;

  const aggressive =
    get("decision_speed") * 0.4 +
    get("risk_assessment") * 0.3 +
    (100 - get("emotional_control")) * 0.3;

  const defensive =
    get("emotional_control") * 0.35 +
    get("resource_mgmt") * 0.35 +
    get("spatial_awareness") * 0.3;

  const social = get("teamwork_tendency");
  const multi = get("multitasking");

  // Check for specialists first (extreme scores in specific dimensions)

  // Rhythm Walker: rhythm_sense >= 75 and highest individual talent
  if (get("rhythm_sense") >= 75) {
    const allScores = Object.values(scores).filter((v): v is number => v != null);
    const maxScore = Math.max(...allScores);
    if (get("rhythm_sense") >= maxScore - 5) {
      return ARCHETYPES["rhythm-walker"];
    }
  }

  // Commander: teamwork >= 70 and above average overall
  if (social >= 70 && (reflexive + strategic) / 2 >= 50) {
    return ARCHETYPES["commander"];
  }

  // Weaver: multitasking >= 70
  if (multi >= 70 && get("spatial_awareness") >= 55) {
    return ARCHETYPES["weaver"];
  }

  // Collector: memory >= 70 and resource_mgmt >= 60
  if (get("memory") >= 70 && get("resource_mgmt") >= 60) {
    return ARCHETYPES["collector"];
  }

  // Lone Wolf: high reflexive + strategic, low teamwork
  if (reflexive >= 60 && strategic >= 55 && social < 40) {
    return ARCHETYPES["lone-wolf"];
  }

  // Shapeshifter: all scores within narrow band
  const allVals = Object.values(scores).filter((v): v is number => v != null);
  if (allVals.length >= 10) {
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    if (max - min < 20) {
      return ARCHETYPES["shapeshifter"];
    }
  }

  // Quadrant-based assignment
  const isReflexive = reflexive > strategic;
  const isAggressive = aggressive > defensive;

  if (isReflexive && isAggressive) {
    if (get("emotional_control") < 40) return ARCHETYPES["berserker"];
    if (reflexive >= 70) return ARCHETYPES["lightning-assassin"];
    return ARCHETYPES["chaos-child"];
  }

  if (isReflexive && !isAggressive) {
    if (strategic >= 55) return ARCHETYPES["duelist"];
    return ARCHETYPES["sharpshooter"];
  }

  if (!isReflexive && isAggressive) {
    if (strategic >= 65) return ARCHETYPES["shadow-strategist"];
    return ARCHETYPES["gambler"];
  }

  // Strategic + Defensive
  if (get("resource_mgmt") >= 65) return ARCHETYPES["fortress"];
  if (get("spatial_awareness") >= 60) return ARCHETYPES["sentinel"];
  return ARCHETYPES["oracle"];
}

/** Get all archetypes as an array */
export function getAllArchetypes(): Archetype[] {
  return Object.values(ARCHETYPES);
}

/** Get archetype by ID */
export function getArchetype(id: string): Archetype | undefined {
  return ARCHETYPES[id];
}
