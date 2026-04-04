/**
 * Blog post data — static content for SEO.
 * Each post targets specific long-tail keywords for organic traffic.
 */

export interface BlogPost {
  slug: string;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  date: string;
  readTimeMin: number;
  keywords: string[];
  /** Markdown-ish content sections */
  sectionsEn: Array<{ heading: string; body: string }>;
  sectionsZh: Array<{ heading: string; body: string }>;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-test-esports-talent",
    titleEn: "How to Test Your Esports Talent: A Scientific Approach",
    titleZh: "如何科学测试你的电竞天赋",
    descriptionEn: "Learn the 3 core skills that separate pro gamers from casuals — reaction speed, pattern recognition, and risk decision-making — and how to measure them.",
    descriptionZh: "了解区分职业选手和普通玩家的 3 项核心技能——反应速度、模式识别和风险决策——以及如何测量它们。",
    date: "2026-04-04",
    readTimeMin: 5,
    keywords: ["esports talent test", "gaming skill measurement", "reaction speed test", "pro gamer skills"],
    sectionsEn: [
      {
        heading: "Why Most Gamers Overestimate Their Talent",
        body: "Studies show that 98% of competitive gamers believe they have what it takes to go pro. The reality? Less than 1% ever reach professional level. This gap between perception and reality is the Dunning-Kruger effect in action — without objective measurement, it's nearly impossible to know where you actually stand.\n\nThe problem isn't ambition. It's the lack of a standardized way to measure gaming talent. Unlike traditional sports where coaches can spot physical talent early, esports talent is invisible until tested under controlled conditions.",
      },
      {
        heading: "The 3 Core Skills Pro Players Share",
        body: "After analyzing data from professional esports players across games like League of Legends, Valorant, and CS2, three core cognitive skills consistently separate pros from amateurs:\n\n**1. Reaction Speed** — Pro players average 180-220ms reaction times, while casual gamers average 250-300ms. This 50-100ms difference is massive in competitive gaming where every millisecond counts.\n\n**2. Pattern Recognition** — The ability to spot visual differences, track multiple moving objects, and identify patterns under time pressure. Pro players score 30-40% higher than average on pattern recognition tests.\n\n**3. Risk Decision-Making** — Knowing when to push, when to retreat, when to invest resources. This involves real-time probability assessment under pressure — a skill that separates strategic thinkers from impulsive players.",
      },
      {
        heading: "How GameTan Measures These Skills",
        body: "GameTan uses 3 mini-games, each under 60 seconds, designed to isolate and measure one core skill:\n\n- **Reaction Speed Test**: 10 rounds measuring your response time to visual stimuli. Your average is compared against pro player benchmarks (pro average: 82/100).\n- **Pattern Recognition Test**: 15 rounds of increasingly difficult visual difference detection. Tests your ability to spot anomalies under time pressure.\n- **Risk Decision Test**: 10 rounds of a balloon-pump game that measures your risk tolerance and decision-making under uncertainty.\n\nScores are normalized using a sigmoid function to create a 0-100 scale, then compared against a database of pro player benchmarks.",
      },
      {
        heading: "What Your Score Actually Means",
        body: "Your talent tier is determined by your average across all three dimensions:\n\n- **Pro Elite (92+)**: Top 0.5% — you have exceptional raw talent\n- **Pro Level (78+)**: Top 5% — talent comparable to professional players\n- **Pro Potential (68+)**: Top 15% — significant talent that could be developed\n- **Above Average (55+)**: Top 35% — better than most, but far from pro\n- **Developing (<55)**: Where 65% of players fall — and that's completely normal\n\nRemember: talent is just one piece of the puzzle. Pro players also train 8-12 hours daily for 3-5 years.",
      },
      {
        heading: "Take the Test",
        body: "Ready to find out where you stand? The GameTan esports talent test takes 3 minutes and is completely free. No registration required.\n\nYour results include your talent tier, a comparison against pro players in each dimension, and your estimated rank among 10,000 players.",
      },
    ],
    sectionsZh: [
      {
        heading: "为什么大多数玩家高估了自己的天赋",
        body: "研究表明，98% 的竞技游戏玩家认为自己有成为职业选手的实力。现实呢？不到 1% 的人能达到职业水平。感知和现实之间的差距就是达克效应——没有客观测量，几乎不可能知道自己真正处于什么水平。\n\n问题不在于野心，而在于缺乏标准化的方式来衡量游戏天赋。与传统体育教练可以早期发现身体天赋不同，电竞天赋在受控条件下测试之前是不可见的。",
      },
      {
        heading: "职业选手共有的 3 项核心技能",
        body: "在分析了英雄联盟、Valorant、CS2 等游戏的职业选手数据后，三项核心认知技能始终将职业选手与业余玩家区分开来：\n\n**1. 反应速度** — 职业选手平均反应时间为 180-220 毫秒，而休闲玩家平均 250-300 毫秒。这 50-100 毫秒的差距在竞技游戏中是巨大的。\n\n**2. 模式识别** — 发现视觉差异、追踪多个移动对象、在时间压力下识别模式的能力。职业选手在模式识别测试中比普通人高出 30-40%。\n\n**3. 风险决策** — 知道何时进攻、何时撤退、何时投入资源。这涉及压力下的实时概率评估——将战略思考者与冲动玩家区分开来的技能。",
      },
      {
        heading: "GameTan 如何测量这些技能",
        body: "GameTan 使用 3 个小游戏，每个不到 60 秒，旨在隔离和测量一项核心技能：\n\n- **反应速度测试**：10 轮测量你对视觉刺激的响应时间。你的平均值与职业选手基准数据进行比较（职业平均：82/100）。\n- **模式识别测试**：15 轮逐渐增加难度的视觉差异检测。测试你在时间压力下发现异常的能力。\n- **风险决策测试**：10 轮气球打气游戏，测量你的风险承受能力和不确定性下的决策能力。\n\n分数使用 sigmoid 函数归一化为 0-100 分制，然后与职业选手基准数据库进行比较。",
      },
      {
        heading: "你的分数意味着什么",
        body: "你的天赋等级由三个维度的平均值决定：\n\n- **职业精英 (92+)**：前 0.5% — 你有卓越的原始天赋\n- **职业水平 (78+)**：前 5% — 天赋可与职业选手相比\n- **职业潜力 (68+)**：前 15% — 可以培养的显著天赋\n- **高于平均 (55+)**：前 35% — 比大多数人强，但离职业还远\n- **成长中 (<55)**：65% 的玩家在这里 — 这完全正常\n\n记住：天赋只是拼图的一部分。职业选手还需要每天训练 8-12 小时，持续 3-5 年。",
      },
      {
        heading: "来测试吧",
        body: "准备好看看自己处于什么水平了吗？GameTan 电竞天赋测试只需 3 分钟，完全免费，无需注册。\n\n你的结果包括天赋等级、每个维度与职业选手的对比、以及你在 10,000 名玩家中的估计排名。",
      },
    ],
  },
  {
    slug: "16-gamer-archetypes-explained",
    titleEn: "16 Gamer Archetypes Explained: Which One Are You?",
    titleZh: "16 种玩家原型详解：你是哪一种？",
    descriptionEn: "Discover the 16 gamer archetypes based on real skill measurement — from Lightning Assassin to Architect. Find your gaming identity.",
    descriptionZh: "了解基于真实技能测量的 16 种玩家原型——从闪电刺客到建筑师。找到你的游戏身份。",
    date: "2026-04-04",
    readTimeMin: 7,
    keywords: ["gamer archetype", "gaming personality", "gamer types", "what type of gamer am I"],
    sectionsEn: [
      {
        heading: "Beyond Gaming Personality Quizzes",
        body: "Most \"gamer type\" quizzes are just personality tests dressed up with gaming themes. They ask you questions like \"Do you prefer strategy or action?\" and map your answers to generic categories. But what you say you prefer and what you actually excel at are very different things.\n\nGameTan's 16 archetypes are different. They're based on measured performance across three cognitive dimensions — reaction speed, pattern recognition, and risk decision-making. Your archetype reflects what you actually do, not what you think you do.",
      },
      {
        heading: "How Archetypes Are Determined",
        body: "Each of the three measured dimensions can be High (H) or Low (L) relative to the population average, plus a score level (S/A/B/C/D). The combination of high/low across three dimensions creates natural clusters that map to 16 distinct archetypes.\n\nFor example:\n- **Lightning Assassin** ⚡ — High reaction, high pattern recognition, moderate risk. The fastest hands in the game.\n- **Oracle** 🔮 — Moderate reaction, high pattern recognition, high risk analysis. Sees what others miss.\n- **Berserker** 🔥 — High reaction, moderate pattern, high risk-taking. All aggression, maximum pressure.\n- **Architect** 🏗️ — Moderate reaction, high pattern, low risk. The strategic mastermind who builds perfect plans.",
      },
      {
        heading: "The 4 Archetype Families",
        body: "The 16 archetypes cluster into 4 families based on dominant traits:\n\n**Speed Family** (reaction-dominant): Lightning Assassin, Ghost, Duelist, Speedster — excel in twitch-reflex games like FPS and fighting games.\n\n**Vision Family** (pattern-dominant): Oracle, Phantom, Tactician, Sentinel — excel in games requiring map awareness, pattern tracking, and information processing.\n\n**Courage Family** (risk-dominant): Berserker, Maverick, Daredevil, Gambler — thrive in high-pressure situations, aggressive plays, and calculated risks.\n\n**Balance Family** (no dominant trait): Architect, Sage, Guardian, Wanderer — versatile players who adapt to any situation.",
      },
      {
        heading: "What Your Archetype Means for Game Choice",
        body: "Your archetype isn't just a label — it's a guide to which games will feel most natural:\n\n- Speed archetypes → FPS (Valorant, CS2), Fighting games (Street Fighter, Tekken)\n- Vision archetypes → Strategy (StarCraft), MOBAs (LoL, Dota 2), Puzzle games\n- Courage archetypes → Battle Royale (Apex, PUBG), Roguelikes, Poker\n- Balance archetypes → RPGs, Simulation, Sandbox games\n\nPlaying games that match your archetype means faster improvement and more natural enjoyment.",
      },
      {
        heading: "Find Your Archetype",
        body: "Take the 3-minute talent test on GameTan to discover your archetype. You'll get your talent tier, pro player comparison, and which of the 16 archetypes matches your actual measured skills — not just what you think you're good at.",
      },
    ],
    sectionsZh: [
      {
        heading: "超越游戏性格测试",
        body: "大多数\"玩家类型\"测试只是穿着游戏外衣的性格测试。它们问你\"你喜欢策略还是动作？\"这样的问题，然后把答案映射到通用分类。但你说你喜欢什么和你实际擅长什么是完全不同的事。\n\nGameTan 的 16 种原型不一样。它们基于三个认知维度的实测表现——反应速度、模式识别和风险决策。你的原型反映的是你实际做了什么，而不是你觉得自己会做什么。",
      },
      {
        heading: "原型如何确定",
        body: "三个测量维度中的每一个都可以相对于人群平均值为高 (H) 或低 (L)，加上分数等级 (S/A/B/C/D)。三个维度的高低组合创建了自然映射到 16 种不同原型的聚类。\n\n例如：\n- **闪电刺客** ⚡ — 高反应、高模式识别、中等风险。游戏中最快的手。\n- **先知** 🔮 — 中等反应、高模式识别、高风险分析。看到别人看不到的。\n- **狂战士** 🔥 — 高反应、中等模式、高冒险。全攻击，最大压力。\n- **建筑师** 🏗️ — 中等反应、高模式、低风险。制定完美计划的战略大师。",
      },
      {
        heading: "4 大原型家族",
        body: "16 种原型根据主导特征分为 4 个家族：\n\n**速度家族**（反应主导）：闪电刺客、幽灵、决斗者、极速者——在 FPS 和格斗游戏等需要快速反应的游戏中表现出色。\n\n**视野家族**（模式主导）：先知、幻影、战术家、哨兵——在需要地图意识、模式追踪和信息处理的游戏中表现出色。\n\n**勇气家族**（风险主导）：狂战士、特立独行者、冒险家、赌徒——在高压情境、激进打法和精算风险中茁壮成长。\n\n**平衡家族**（无主导特征）：建筑师、圣者、守护者、流浪者——适应任何情况的全能玩家。",
      },
      {
        heading: "你的原型对游戏选择意味着什么",
        body: "你的原型不只是一个标签——它是指导你选择最自然的游戏的向导：\n\n- 速度原型 → FPS（Valorant、CS2）、格斗游戏（街霸、铁拳）\n- 视野原型 → 策略（星际争霸）、MOBA（英雄联盟、Dota 2）、益智游戏\n- 勇气原型 → 吃鸡（Apex、PUBG）、Roguelike、扑克\n- 平衡原型 → RPG、模拟、沙盒游戏\n\n玩与你原型匹配的游戏意味着更快的进步和更自然的享受。",
      },
      {
        heading: "找到你的原型",
        body: "在 GameTan 上进行 3 分钟天赋测试，发现你的原型。你将获得天赋等级、与职业选手的对比，以及 16 种原型中哪一种与你实际测量的技能匹配——而不仅仅是你自认为擅长的。",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
