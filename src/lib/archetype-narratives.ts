/**
 * Deep archetype narratives — the "this is me" content that creates identity.
 * Each archetype gets 4 sections of rich, relatable gaming-specific content.
 * Bilingual (zh + en). Written natively in both languages, not translated.
 *
 * Keys match ARCHETYPES in archetype.ts (16 total).
 */

export interface ArchetypeNarrative {
  /** Your gaming instinct — what you do automatically */
  instinct: string;
  instinctEn: string;
  /** Your typical behaviors — specific, relatable gaming scenarios */
  behaviors: string;
  behaviorsEn: string;
  /** How teammates see you — the outside perspective */
  teamView: string;
  teamViewEn: string;
  /** Your weakness scenario + evolution path (specific, actionable) */
  growthPath: string;
  growthPathEn: string;
}

export const ARCHETYPE_NARRATIVES: Record<string, ArchetypeNarrative> = {
  // ─────────────────────────── 1. LIGHTNING ASSASSIN ───────────────────────────
  "lightning-assassin": {
    instinct:
      "队友还在商量战术的时候，你已经冲出去了。不是因为你不听指挥——而是你的身体比大脑先做出了反应。在FPS里，你听到脚步声的瞬间就已经预瞄完毕；在音游里，你的手指比节拍快半拍；在赛车游戏里，弯道入口你永远是最晚刹车的那个人。你的世界比别人快0.3秒，这0.3秒就是你统治游戏的理由。",
    instinctEn:
      "Your teammates are still discussing tactics when you've already pushed. Not because you don't listen — your body reacts before your brain catches up. In FPS games, you've pre-aimed the moment you hear footsteps. In rhythm games, your fingers are half a beat ahead of the music. In racing, you're always the last to brake into a corner. Your world runs 0.3 seconds faster than everyone else's, and that 0.3 seconds is why you dominate.",
    behaviors:
      "你在Valorant里永远选Jett，不是因为你喜欢角色设计——是因为你需要一个跟得上你反应速度的技能组。你打大逃杀从来不捡八倍镜，因为你知道自己所有的击杀都发生在20米以内。你打音游从来只玩Expert/Master难度，Easy对你来说不是'简单'，是'无聊到手指不知道放哪'。你会在排位赛loading界面就开始按键热身，因为你的手指需要进入状态的时间比游戏加载还短。",
    behaviorsEn:
      "You always pick Jett in Valorant — not for the character design, but because you need an ability kit that keeps up with your reflexes. In battle royales, you never pick up an 8x scope because all your kills happen within 20 meters. In rhythm games, you only play Expert/Master — Easy isn't 'easy,' it's 'so boring your fingers don't know what to do.' You start tapping keys during the loading screen because your warm-up takes less time than the game takes to load.",
    teamView:
      "队友眼里的你：又爱又恨。你是那个1v3翻盘让全队疯狂尖叫的人，也是那个明明说好'等信号再冲'结果自己先冲了的人。你carry起来无敌，但你每次阵亡都让指挥官心肌梗塞。你的高光集锦比任何人都精彩，但你的死亡回放也比任何人都让人窒息——'他怎么又一个人冲了？'是队友最常对你说的话。不过没关系，下一局你1v5翻了之后他们都闭嘴了。",
    teamViewEn:
      "How teammates see you: a love-hate relationship. You're the one who clutches a 1v3 and makes the whole team scream — and also the one who agreed to 'wait for the call' but pushed first anyway. When you carry, you're unstoppable. But every death gives your shotcaller a heart attack. Your highlight reels are the best on the team, but your death replays are the most painful to watch. 'Why did they push alone AGAIN?' is what they say most about you. But it's fine — after you ace the next round, they shut up.",
    growthPath:
      "场景：你在卡牌游戏里连输三局。对手不是比你快——是比你'想得远'。你每回合都打出最高伤害的牌，但他们一直在铺一个你看不懂的combo。第四局你终于意识到：他们三个回合前就在为这一刻做准备。你的速度没问题，但你的视野只有这一秒。进化路径：每次出牌前，强迫自己看一眼对手的弃牌堆。不需要想三步——先从'想一步'开始。把你的0.3秒速度优势用在'多看一眼'上，而不是'快出一张'上。",
    growthPathEn:
      "The scene: you've lost three straight card games. Your opponent isn't faster — they 'see further.' Every turn you play the highest damage card, but they've been building a combo you can't even read. By game four, it hits you: they started setting this up three turns ago. Your speed is fine, but your vision only covers this exact second. Growth path: before playing a card, force yourself to glance at the opponent's discard pile. You don't need to think three moves ahead — start with one. Use your 0.3-second speed advantage to 'look once more,' not to 'play one card faster.'",
  },

  // ─────────────────────────── 2. BERSERKER ───────────────────────────
  berserker: {
    instinct:
      "你一进游戏就像按下了肾上腺素开关。心跳加速，手指发抖，全身进入战斗模式——你不是在'玩游戏'，你是在'搞事情'。FPS里你是那个永远在推的人，不管地图上标了多少个敌人；大逃杀落地就是抢枪刚正面，从来不存在'苟一下先发育'这种选项。你的能量像核弹，要么全放，要么不玩。",
    instinctEn:
      "The moment you load into a game, it's like someone flipped your adrenaline switch. Heart pounding, fingers twitching, whole body in fight mode — you're not 'playing a game,' you're 'causing problems.' In FPS you're the permanent aggressor, no matter how many enemy icons are on the map. In battle royales, you hot-drop and fight for the first gun — 'playing it safe' isn't an option that exists in your vocabulary. Your energy is a nuclear bomb: full send or don't play at all.",
    behaviors:
      "你在CS里买了五个手雷冲B的事情，你以为只有你知道——但其实所有队友都记住了。你打吃鸡从来没活到第二个圈过，但你的场均击杀比决赛圈玩家还高。你格斗游戏打赢了会嘲讽，打输了会立刻按重来——你不是想赢，你是想'爽'。你的Steam库里全是'极度好评'的动作游戏，你在每一个游戏里都用最莽的打法通关，然后在评论区写：'简单。'",
    behaviorsEn:
      "That time you bought five grenades and rushed B? You thought nobody noticed — but your whole team remembers. In battle royales, you've never survived to the second circle, yet your average kills are higher than most endgame players. In fighting games, you taunt after winning and mash rematch after losing — you're not chasing victory, you're chasing the rush. Your Steam library is all 'Overwhelmingly Positive' action games, and you've beaten every single one with the most reckless build possible, then left a review saying: 'Easy.'",
    teamView:
      "你的队友对你有一种很矛盾的情感。赢的时候，你是'绝对核心、超级carry、没你我们肯定输'；输的时候，你是'又上头了、又送了、能不能稳一点'。他们知道你不是不会打——你的操作在巅峰的时候能碾压任何人。问题是你的巅峰和低谷之间只隔了一次击杀。杀了人你是战神，被杀了你就变成一台失控的愤怒机器，疯狂冲锋直到彻底崩溃。",
    teamViewEn:
      "Your teammates have complicated feelings about you. When you're winning: 'absolute carry, the core, we'd lose without them.' When you're losing: 'they're tilted again, feeding again, can they just chill for ONE round?' They know you're skilled — at your peak, you outplay anyone in the lobby. The problem is your peak and your meltdown are separated by exactly one death. Get a kill and you're a god. Get killed and you become an out-of-control rage machine, chain-pushing until total collapse.",
    growthPath:
      "场景：你在排位赛里2-0领先。然后被翻了一局。没什么大不了——但你的手开始出汗，你打字的力度变大了。第二局被翻的时候你摔了鼠标。第三局你连话都不说了，就是冲，冲，冲，然后3-2输了。复盘的时候你看录像：领先的两局你的操作无可挑剔，翻盘的三局你的操作跟换了个人一样。不是技术问题，是你自己成了自己最大的敌人。进化路径：设一个物理触发器——被击杀后把手从键盘上拿开三秒。不是'冷静一下'，是物理上让你的手不能做出冲动操作。三秒之后再摸键盘。这三秒够了。",
    growthPathEn:
      "The scene: you're up 2-0 in ranked. Then you lose one. No big deal — but your palms start sweating, your keystrokes get heavier. After losing the second, you slam your mouse. In the third game you stop talking entirely — just push, push, push — and lose 3-2. Watching the replay, the two wins show flawless mechanics. The three losses look like a different player. It's not a skill problem — you became your own worst enemy. Growth path: set a physical trigger. After getting killed, lift your hands off the keyboard for three seconds. Not 'calm down' — physically prevent your hands from making impulse plays. Touch the keyboard after three seconds. That's enough time.",
  },

  // ─────────────────────────── 3. SHARPSHOOTER ───────────────────────────
  sharpshooter: {
    instinct:
      "你的crosshair永远在头部高度。不是因为你在瞄准——是因为它一直在那里，像呼吸一样自然。你不需要flick shot，因为你的准星从来不会出现在错误的位置。别人练枪法靠训练场打靶一千次，你靠的是一种本能：你的手和你的眼睛之间有一条看不见的直线，它从来不会断。在精准度决定一切的游戏里，你就是那个让对手说'他开了'的人。",
    instinctEn:
      "Your crosshair is always at head level. Not because you're aiming — because it lives there, as natural as breathing. You don't need flick shots because your cursor never lands in the wrong place. Others train their aim by hitting targets a thousand times. You rely on instinct: an invisible line between your hand and your eyes that never breaks. In games where precision is everything, you're the one who makes opponents scream 'they're cheating.'",
    behaviors:
      "你在FPS里一局用六发子弹拿了五个人头。你在OSU里手指的轨迹比别人看起来平滑得多——因为你不需要修正。你在赛车游戏里走的线路完美到AI教程都没法教得更好。你会花二十分钟调鼠标DPI和灵敏度，因为你知道0.01的差异你的手能感觉得到。你的技巧不是爆发性的——它是精密的、持续的、稳定得让人害怕的。你大概率不怎么喧哗，因为精准的人往往都很安静。",
    behaviorsEn:
      "You once got five headshots with six bullets in a single FPS round. In osu!, your cursor path looks smoother than everyone else's — because you never need to correct. In racing games, your racing line is so perfect even the AI tutorial couldn't demonstrate it better. You'll spend twenty minutes adjusting mouse DPI and sensitivity because you can feel a 0.01 difference in your hand. Your skill isn't explosive — it's surgical, consistent, and terrifyingly stable. You're probably quiet in voice chat too, because precise people tend to be quiet people.",
    teamView:
      "队友对你的印象是'可靠到无聊'。他们知道给你架枪位你一定能守住，给你第一发狙你一定能打中。你不是那种会让人热血沸腾的队友——你太稳了，稳到没有惊喜。但当比赛进入加时、所有人都手抖的时候，你是唯一一个还跟平时一样稳的人。他们不会为你尖叫，但他们知道：如果只能选一个人来打那一枪定胜负的shot，选你。永远选你。",
    teamViewEn:
      "Teammates describe you as 'so reliable it's boring.' They know if they give you an angle, you'll hold it. If they give you the AWP, you'll hit the shot. You're not the teammate who gets people hyped — you're too consistent for surprises. But when the game goes to overtime and everyone's hands are shaking, you're the only one still performing like it's a warm-up round. They won't scream for you, but they know: if there's one person to take the match-deciding shot, it's you. Always you.",
    growthPath:
      "场景：你在一个需要'创意打法'的关卡/回合里卡住了。对手已经研究透了你的套路——你每次都在同一个角度架枪，同一个时机出手。你的精准度没变，但他们不再出现在你瞄的地方了。你开始焦虑：'我明明没打偏，为什么就是打不到人？'因为你太可预测了。你的精准是一条直线，但游戏需要的是一条曲线。进化路径：每三个回合强制换一个架枪位。不需要那个位置更好——只需要它'不一样'。你的精准度不会因为换了位置而下降，但对手的预判会因此失效。精确+不可预测=冷血决斗者。",
    growthPathEn:
      "The scene: you're stuck in a round that demands 'creative play.' The opponent has figured out your pattern — same angle every time, same timing every peek. Your aim hasn't changed, but they've stopped appearing where you're aiming. Anxiety creeps in: 'I'm not missing — so why can't I hit anyone?' Because you're too predictable. Your precision is a straight line, but the game needs a curve. Growth path: every three rounds, force yourself to switch to a different angle. It doesn't need to be better — it just needs to be 'different.' Your accuracy won't drop from changing positions, but the opponent's predictions will break. Precision plus unpredictability equals the Duelist.",
  },

  // ─────────────────────────── 4. DUELIST ───────────────────────────
  duelist: {
    instinct:
      "你在对手出招之前就已经知道他要干什么了。不是因为你猜——是因为你'读'到了。对手的鼠标移动方向、角色动画的起手帧、甚至他们停顿的节奏……你的大脑在毫秒级别处理这些信息，然后你的手在他们出招的同时给出完美回应。你是那种打格斗游戏能稳定反应确认的人，打FPS能预判peek timing的人，打竞速能在对手变道前就卡位的人。",
    instinctEn:
      "You know what your opponent is going to do before they do it. Not because you guess — because you 'read' them. The direction of their mouse movement, the startup frames of their character animation, even the rhythm of their hesitation — your brain processes all of this at millisecond speed, and your hands deliver the perfect counter the instant they commit. You're the type who hit-confirms in fighting games, who pre-peeks in FPS based on timing patterns, who blocks a lane change in racing before the opponent even starts turning.",
    behaviors:
      "你在1v1游戏里有一个别人没有的习惯：你会'测试'对手。前几回合你故意做一些看起来随机的动作，但其实你在建立对手的行为模型——他被压的时候喜欢反打还是后退？他连续赢了之后会变激进还是保持节奏？当你搞清楚了，比赛就结束了。你在格斗游戏里能说出每个角色的帧数据，你在FPS里知道每把枪的伤害衰减曲线。你不是在玩游戏——你是在解一道方程。",
    behaviorsEn:
      "In 1v1 games, you have a habit others don't: you 'test' your opponents. The first few rounds, you make seemingly random plays — but you're actually building a behavioral model. Do they counterattack or retreat when pressured? After consecutive wins, do they get aggressive or maintain tempo? Once you've mapped them out, the match is over. In fighting games, you can recite frame data for every character. In FPS, you know the damage falloff curve of every weapon. You're not playing a game — you're solving an equation.",
    teamView:
      "队友对你有一种微妙的距离感。他们知道你很强——可能是队里最强的——但你总让人感觉有点'冷'。你很少在语音里说闲话，你的报点精准但简短，你的配合永远是'到位的'但不是'热情的'。当有人犯错了你不会骂，但你也不会安慰——你只是默默地把那个信息更新到你的'队友行为模型'里。他们有时候觉得跟你打比赛不像在一起战斗，更像在被你'使用'。但没人抱怨，因为你赢了。",
    teamViewEn:
      "Teammates feel a subtle distance with you. They know you're good — probably the best on the team — but something about you feels 'cold.' You rarely small-talk in voice chat. Your callouts are precise but brief. Your coordination is always 'correct' but never 'warm.' When someone makes a mistake, you don't rage, but you don't comfort them either — you just silently update your mental 'teammate behavior model.' Sometimes playing with you feels less like fighting together and more like being 'used.' But nobody complains, because you win.",
    growthPath:
      "场景：你在MOBA里打了一局完美的单人表演。你个人数据碾压对面，每一次单杀都是教科书。但你的队伍输了——因为你单杀的时候，队友在另一边4v5被团灭了。你不理解：'我都赢了对位，为什么还输？'因为游戏不是五场1v1。你的完美执行没有错，但你的胜利条件只考虑了你自己。进化路径：每次你打算solo kill的时候，先看一眼小地图。如果队友正在打团战，去参团——即使你觉得'solo kill更赚'。你不需要变成指挥官，但你需要学会把你的方程式从'我赢'扩展到'我们赢'。",
    growthPathEn:
      "The scene: you played a perfect solo performance in a MOBA. Your individual stats crushed the enemy laner, every solo kill was textbook. But your team lost — because while you were solo-killing, your teammates got wiped in a 4v5 teamfight on the other side of the map. You don't understand: 'I won my lane, why did we lose?' Because the game isn't five 1v1s. Your flawless execution isn't wrong, but your win condition only accounts for yourself. Growth path: every time you're about to go for a solo kill, glance at the minimap first. If your team is fighting, go join — even if you think 'the solo kill is worth more.' You don't need to become a Commander, but you need to expand your equation from 'I win' to 'we win.'",
  },

  // ─────────────────────────── 5. ORACLE ───────────────────────────
  oracle: {
    instinct:
      "你下棋的时候不看这一步，你看的是第七步。你不关心'现在发生了什么'，你关心的是'接下来会发生什么'。在卡牌游戏里，你能记住已经出过的每一张牌，然后精确计算对手手里还剩什么。在策略游戏里，你第一个回合的布局就已经决定了第三十个回合的胜负。别人在打游戏，你在写剧本——而且你的剧本很少出错。",
    instinctEn:
      "When you play chess, you don't look at this move — you look at move seven. You don't care about 'what's happening now,' you care about 'what happens next.' In card games, you've memorized every card that's been played, then precisely calculate what's left in the opponent's hand. In strategy games, your turn-one layout already determines the outcome at turn thirty. Others are playing a game. You're writing a script — and your scripts rarely miss.",
    behaviors:
      "你在打昆特牌的时候有一个Excel表格记录最优出牌顺序。你在下象棋的时候会在脑子里跑三条不同的变化线。你在策略游戏里开局永远是固定的'最优解'build order，因为你已经在论坛上研究了两百个小时。你是那种会在游戏上线第一天就读完所有攻略的人——不是因为你怕输，是因为你享受'理解系统'的过程。你的乐趣不在于赢，在于'想明白了'的那一刻。",
    behaviorsEn:
      "You have an Excel spreadsheet tracking optimal card sequences for Gwent. When playing chess, you run three different variation lines in your head simultaneously. In strategy games, your opening is always the same 'optimal' build order, because you've spent two hundred hours researching on forums. You're the person who reads every guide on day one of a game's launch — not because you're afraid of losing, but because you enjoy the process of 'understanding the system.' Your joy isn't in winning — it's in the moment everything clicks.",
    teamView:
      "队友对你的评价就一个字：神。但是是那种让人有点害怕的神。你在语音里说'他们下一步会从右边绕后'，然后十秒后对手真的从右边出来了——这已经不是'经验丰富'了，这是'不太正常'。他们喜欢你在队里，因为有你在就像开了全图挂。但他们有时候也觉得跟你打游戏少了点'乐趣'——因为你把所有事情都变成了'正确答案'，而游戏本来应该有意外的。",
    teamViewEn:
      "Teammates describe you in one word: genius. But the kind that's slightly terrifying. You say 'they'll flank right in about ten seconds' on voice chat, and then exactly ten seconds later the enemy appears from the right — that's not 'experienced,' that's 'something else entirely.' They love having you on the team because it feels like playing with a wallhack. But sometimes they feel like games with you are missing something — because you turn everything into 'the correct answer,' and games are supposed to have surprises.",
    growthPath:
      "场景：你在一个FPS游戏里。你完美预判了对手的位置、时机、甚至武器选择。你的crosshair在完美的位置等着他出来。他出来了——然后你死了。不是因为你判断错了。是因为他出来的速度比你扣扳机的速度快0.2秒。你坐在那里，盯着死亡回放，第一次感到一种深深的无力：你的大脑是对的，但你的手跟不上。进化路径：每天花十分钟打aim trainer。不需要追求排行榜——你只需要把反应时间从450ms降到380ms。你的大脑已经是S级了，你只需要给它配一双不会掉链子的手。提升决策速度，你会进化成暗影策士——用思维的速度碾压对手。",
    growthPathEn:
      "The scene: you're in an FPS. You perfectly predicted the enemy's position, timing, even weapon choice. Your crosshair waits at the perfect spot for them to appear. They appear — and you die. Not because your prediction was wrong. Because they peeked 0.2 seconds faster than you could pull the trigger. You sit there, staring at the death replay, feeling a deep helplessness for the first time: your brain was right, but your hands couldn't keep up. Growth path: spend ten minutes daily on an aim trainer. You don't need to chase leaderboards — you just need to bring your reaction time from 450ms down to 380ms. Your brain is already S-tier; you just need to give it hands that won't let it down. Improve decision speed, and you evolve into the Shadow Strategist — crushing opponents at the speed of thought.",
  },

  // ─────────────────────────── 6. FORTRESS ───────────────────────────
  fortress: {
    instinct:
      "你进游戏做的第一件事不是进攻，是'看地图'。资源在哪？高地在哪？防守点在哪？你的大脑自动开始计算最优防线。你不急着打第一枪，因为你知道：先稳住，再说。在模拟经营里你的第一优先级永远是正现金流，在策略游戏里你的城墙比别人的军队还难打，在卡牌游戏里你用一堆看起来很弱的卡组成了一道让对手绝望的防线。你不需要赢——你只需要不输，然后等对手自己犯错。",
    instinctEn:
      "The first thing you do in any game isn't attack — it's 'read the map.' Where are the resources? Where's the high ground? Where are the chokepoints? Your brain automatically starts calculating the optimal defensive line. You're never in a hurry to fire the first shot, because you know: stabilize first, everything else later. In simulation games your first priority is always positive cash flow. In strategy games your walls are harder to crack than the enemy army. In card games you build a seemingly weak deck that forms an impenetrable defensive wall. You don't need to win — you just need to not lose, then wait for the opponent to make a mistake.",
    behaviors:
      "你在《城市：天际线》里修了三条独立的水管系统做灾备冗余——没有人这么做，但你做了。你在文明系列里永远是最后一个开战的人，因为你在等你的经济碾压到让对手绝望。你在卡牌游戏里喜欢用'控制卡组'，那种一张一张消耗对手资源的打法让你有一种深层的满足感。你的存档里有一百个小时的经营类游戏，你的城市/公司/农场从来没有破产过。从来没有。",
    behaviorsEn:
      "You built three independent water pipe systems for disaster redundancy in Cities: Skylines — nobody does that, but you did. In Civilization, you're always the last to declare war because you're waiting until your economy is so overwhelming the opponent can't fight back. In card games, you love control decks — the slow, grinding process of depleting the opponent's resources gives you a deep satisfaction. You have a hundred hours in management sims, and your city/company/farm has never gone bankrupt. Never.",
    teamView:
      "队友对你的态度是'放心'。把你放在需要守的位置，然后忘记那个方向——因为你一定能守住。你不是MVP，你不是carry，但你是那个让所有人能安心去打进攻的原因。他们有时候会吐槽你'太保守了'：明明可以反攻了你还在加固防线，明明可以推塔了你还在存经济。但等到大后期，当所有人资源枯竭而你的补给线还在源源不断地运转时，他们终于明白了你在干什么。",
    teamViewEn:
      "Teammates feel 'safe' around you. Put you on the position that needs holding, then forget about that direction — because it will hold. You're not the MVP, you're not the carry, but you're the reason everyone else can confidently play offense. They sometimes complain you're 'too conservative': the counterattack window is open but you're still fortifying, the base is undefended but you're still banking resources. But in the late game, when everyone else runs dry and your supply lines are still running, they finally understand what you were doing all along.",
    growthPath:
      "场景：你在策略游戏里打了一局完美的防守。你的城墙从没被破过，你的经济曲线完美。但你输了——因为对手在你防守的时候抢了地图上所有的资源点，你虽然固若金汤但已经被包围了，等你准备好反击的时候发现自己连出门的路都没了。你一直在等的'完美时机'永远没来，因为'完美时机'是你主动创造的，不是等来的。进化路径：给自己设一个'攻击闹钟'。每十分钟必须做一次主动行动——不需要大的，一次小规模骚扰就行。你会发现，主动出击不需要放弃你的防线，它只是在你的防线上加了一根'天线'。",
    growthPathEn:
      "The scene: you played a perfect defensive game in strategy. Your walls were never breached, your economy curve was textbook. But you lost — because while you were defending, the opponent grabbed every resource point on the map. You were impenetrable but surrounded. By the time you were 'ready' to counterattack, you had no path out. The 'perfect moment' you were waiting for never came, because perfect moments are created, not waited for. Growth path: set yourself an 'attack alarm.' Every ten minutes, you must make one proactive move — doesn't need to be big, a small harass raid is enough. You'll discover that attacking doesn't require abandoning your defense. It just adds an 'antenna' to your fortress.",
  },

  // ─────────────────────────── 7. SHADOW STRATEGIST ───────────────────────────
  "shadow-strategist": {
    instinct:
      "你不喜欢正面交锋。不是因为你打不过——而是因为正面交锋太'蠢'了。为什么要拼操作？你更愿意在对手察觉之前就赢下比赛。你是那种在RTS里第三分钟就偷袭对手矿区的人，在狼人杀里第一轮就猜出谁是狼的人，在策略游戏里用外交手段让两个对手互相开战的人。你的武器不是技术，是信息不对称。你看到了对手看不到的东西，然后利用这个差距。",
    instinctEn:
      "You don't like head-on fights. Not because you can't win them — because they're 'stupid.' Why contest mechanics when you can win before the opponent even realizes the game has started? You're the one who raids the enemy mine at minute three in an RTS, who identifies the werewolf on round one in social deduction, who uses diplomacy to make two opponents declare war on each other in grand strategy. Your weapon isn't mechanics — it's information asymmetry. You see what they can't, and you exploit the gap.",
    behaviors:
      "你在打Dota的时候不选mid carry——你选那些'烦死人'的辅助英雄，然后把对手的节奏搅得一团糟。你玩文明的时候用间谍网络比用军队多。你在解谜游戏里不走正路，你专门找那些设计师可能'没封住'的捷径。你的快乐来源不是'赢了'，而是'对手到死都不知道怎么输的'。你的聊天记录里一定有过这句话：'计划通。'",
    behaviorsEn:
      "In Dota, you don't pick the mid carry — you pick that 'incredibly annoying' support hero and destroy the enemy team's tempo. In Civilization, you use your spy network more than your army. In puzzle games, you never take the intended path — you hunt for shortcuts the designers 'forgot to block.' Your joy doesn't come from 'winning' — it comes from 'the opponent not knowing how they lost.' Somewhere in your chat history, you've definitely typed: 'All according to plan.'",
    teamView:
      "队友对你有一种'看不透'的感觉。你说'放心，我有计划'，但你从来不告诉他们计划是什么。然后事情真的按你说的方向发展了——他们既佩服又不安。你不太愿意解释你的思路，因为解释的时间够你执行两遍了。你在团队里的问题是：如果你的计划需要队友配合，而队友做了一个你'没预料到'的动作，你的整个方案会瞬间崩溃——不是因为方案不好，是因为你的方案里没有'意外'这个变量。",
    teamViewEn:
      "Teammates can never quite 'read' you. You say 'trust me, I have a plan,' but you never tell them what it is. Then things play out exactly as you predicted — and they're impressed but uneasy. You don't like explaining your thinking because explaining takes longer than executing. Your problem in teams is this: when your plan requires teammate cooperation and a teammate does something 'unexpected,' your entire scheme collapses instantly — not because the scheme is bad, but because your scheme doesn't account for the variable called 'surprise.'",
    growthPath:
      "场景：你在一局团队策略游戏里设计了一个完美的三线包夹计划。每个人去哪、什么时候动、攻击顺序——你在脑子里跑了三遍确认无误。然后你的队友A走错了路，队友B提前开火了。你的完美计划在30秒内变成一团乱麻。你很愤怒：不是因为你们输了，而是因为你的'作品'被毁了。你第一次意识到：你不是在'和队友合作'，你是在'用队友当棋子'。进化路径：下一次做计划的时候，把计划分享给队友——不是命令，是讨论。让他们提意见。是的，他们的意见可能很蠢——但一个'有容错空间的好计划'比一个'不允许任何意外的完美计划'更有用。留10%的即兴空间。",
    growthPathEn:
      "The scene: you designed a perfect three-prong pincer in a team strategy game. Who goes where, when to move, attack sequence — you ran it three times in your head to confirm. Then teammate A took the wrong path and teammate B opened fire early. Your perfect plan turned into chaos in 30 seconds. You're furious — not because you lost, but because your 'masterpiece' was destroyed. For the first time you realize: you weren't 'cooperating with teammates,' you were 'using teammates as chess pieces.' Growth path: next time you make a plan, share it with your team — not as orders, but as a discussion. Let them give input. Yes, their input might be dumb — but 'a good plan with error tolerance' is more useful than 'a perfect plan that breaks on any surprise.' Leave 10% room for improvisation.",
  },

  // ─────────────────────────── 8. GAMBLER ───────────────────────────
  gambler: {
    instinct:
      "你看到'50%成功率'的时候，脑子里想的不是'有一半可能失败'，而是'搏一把'。你天生被高风险选项吸引——不是因为你不懂概率，而是因为你享受那种心脏悬在半空中的感觉。大逃杀里你永远追着空投跑，卡牌游戏里你会把所有筹码推进'这一把'，策略游戏里你选最激进的路线因为'要么大成要么大败，绝不苟活'。你对安全策略过敏——安全等于无聊。",
    instinctEn:
      "When you see '50% success rate,' your brain doesn't think 'half chance of failure' — it thinks 'let's go.' You're naturally drawn to high-risk options — not because you don't understand probability, but because you live for that heart-in-your-throat feeling. In battle royales you always chase airdrops. In card games you push all chips into 'this one hand.' In strategy games you pick the most aggressive path because 'go big or go home, never play it safe.' You're allergic to safe strategies — safe equals boring.",
    behaviors:
      "你在打德州扑克的时候all-in的次数比fold多。你在大逃杀里每次都落最热门的地方——你把'稳定吃鸡'看得比'二十杀吃鸡'低级得多。你在Roguelike里永远选'高风险高奖励'的道具，然后要么第三关通关要么第一关暴毙。你的游戏人生就是一部集锦：惊天翻盘和惨烈暴毙交替出现，从来没有'正常发挥'这种东西。你在朋友圈发的游戏截图要么是'伤害第一'要么是'第一个阵亡'，中间值不存在。",
    behaviorsEn:
      "In poker you all-in more often than you fold. In battle royales you always land at the hottest drop spot — you consider 'safe top-1 finish' far inferior to 'twenty-kill chicken dinner.' In roguelikes you always pick the 'high risk, high reward' item, then either clear floor three or die on floor one. Your gaming life is a highlight reel: miraculous comebacks and spectacular deaths alternate, with zero 'normal performances' in between. Your gaming screenshots are either 'highest damage' or 'first blood death' — there is no middle.",
    teamView:
      "队友跟你组队就像坐过山车。他们知道跟你打一定不会无聊——但他们不确定最后是赢还是输。你是那种会在团战劣势的时候突然开大冲进去的人，要么一打五翻盘让全队起飞，要么白给让团战直接崩盘。没有人不服你的勇气，但很多人受不了你的不稳定。最让他们抓狂的是：就算你的赌博失败了十次，第十一次成功了你就完全忘记前面十次了。",
    teamViewEn:
      "Teaming with you is like riding a roller coaster. They know it won't be boring — but they can't predict if you'll win or lose. You're the one who suddenly ults into a disadvantaged teamfight — either clutching a 1v5 and lifting the whole team, or feeding and collapsing the fight instantly. Nobody questions your courage, but many can't handle your inconsistency. What drives them craziest: even after your gamble fails ten times, the one time it works, you completely forget the previous ten failures.",
    growthPath:
      "场景：你在卡牌排位赛里all-in了手里最后的资源。你知道这是一个'55开'的局面。你输了。不是第一次——这个月你已经因为同样的原因输了七次了。你的段位一直在'快要晋级'和'被打回原形'之间反复横跳。你心里清楚：如果那七次你选的是'稳'，你早就晋级了。但你选不了——因为'稳赢'对你来说没有快感。进化路径：给自己一个'赌博预算'。一局比赛只允许自己做两次高风险决策。其他时候，按照安全策略走。你会发现：当你把冒险控制在'关键时刻'而不是'每个时刻'，你的胜率会暴涨——而那两次赌博的快感反而更强了，因为它们变成了真正有意义的豪赌。",
    growthPathEn:
      "The scene: you all-in your last resources in ranked card games. You know it's a '55-45' situation. You lose. Not the first time — this month you've lost seven games the exact same way. Your rank keeps bouncing between 'almost promoted' and 'back to square one.' Deep down you know: if those seven times you'd played safe, you'd have promoted already. But you can't choose safe — because 'guaranteed wins' give you zero thrill. Growth path: give yourself a 'gambling budget.' Each game, allow yourself exactly two high-risk plays. Everything else, play the safe line. You'll discover that when you reserve your risks for 'key moments' instead of 'every moment,' your win rate skyrockets — and those two gambles actually feel even more thrilling, because they become meaningful bets that matter.",
  },

  // ─────────────────────────── 9. RHYTHM WALKER ───────────────────────────
  "rhythm-walker": {
    instinct:
      "你不用看屏幕就知道下一个节拍在哪。音乐游戏对你来说不是'跟着提示按键'——是你的身体本能地与节奏同步。但这种天赋远不止音游：你在FPS里的射击节奏稳得像节拍器，你在赛车里换挡的时机精准到引擎声都像一首歌，你在MOBA里连招的衔接丝滑到对手来不及反应。你感受到的不是'信息'，是'韵律'——游戏世界对你来说是一首曲子，而你永远在正确的拍子上。",
    instinctEn:
      "You don't need to look at the screen to know where the next beat falls. Rhythm games aren't 'press keys following prompts' for you — your body syncs with the rhythm instinctively. But this gift goes far beyond music games: your FPS fire rate is metronome-steady, your gear shifts in racing are so perfectly timed the engine sounds like a song, your MOBA combos chain so smoothly opponents can't react. What you perceive isn't 'information' — it's 'rhythm.' The game world is a song to you, and you're always on the right beat.",
    behaviors:
      "你打OSU/Cytus/Phigros的时候不看判定线——你靠感觉。你在打FPS的时候有一个别人没注意到的习惯：你的射击间隔几乎是等距的，像一个人形节拍器。你开车游戏的时候不看转速表，你靠引擎的声音判断换挡时机。你大概率有一个跟音乐有关的爱好——弹琴、打鼓、或者至少是一个对节奏有执念的人。你在游戏里最讨厌的事是'卡顿'——不是网络卡顿，是节奏卡顿。一个跳帧就能毁了你整局的手感。",
    behaviorsEn:
      "You play osu!/Cytus/Phigros without watching the judgment line — you go by feel. In FPS, you have a habit nobody notices: your shot intervals are almost perfectly even, like a human metronome. In racing games, you don't look at the tachometer — you shift by engine sound. You probably have a music-related hobby: piano, drums, or at least you're someone with an obsession about rhythm. The thing you hate most in games is 'stutter' — not network lag, rhythm stutter. A single frame skip can ruin your feel for the entire match.",
    teamView:
      "队友对你有一种'看他打比赛像看演出'的感觉。你的操作不是最炸裂的，但它是最'好看'的——每一个动作都流畅、从容、恰到好处。他们注意到你有一个奇怪的规律：游戏前十分钟你表现平平，但一旦你'进入状态'，你的水平会突然跳一个台阶。问题是如果有人在你心流的时候突然跟你说话，你的表现会断崖式下跌——像一首歌被突然按了暂停键。他们学会了在你'进状态'的时候不打扰你。",
    teamViewEn:
      "Teammates feel like 'watching you play is like watching a performance.' Your mechanics aren't the flashiest, but they're the 'prettiest' — every move is fluid, composed, perfectly timed. They notice a strange pattern: you're average in the first ten minutes, but once you 'get in the zone,' your level suddenly jumps a tier. The problem is if someone talks to you mid-flow, your performance falls off a cliff — like a song that got suddenly paused. They've learned not to disturb you once you're 'in it.'",
    growthPath:
      "场景：你在MOBA团战里正在打出完美的技能衔接——然后队友突然喊'小心后面！'你的注意力被扯走了半秒，你的combo断了，你的下一个技能慢了0.3秒，然后连锁反应导致你被集火秒杀。你知道那句提醒是好意，但你就是没法'在被打断后立刻回到节奏里'。你需要重新'找感觉'，而重新找感觉需要30秒——在团战里，30秒就是全部。进化路径：练习'双线节奏'。戴耳机打游戏的时候，用一只耳朵听游戏，另一只耳朵听队友语音。一开始会很难——但你要训练的不是'忽略干扰'，而是'把干扰变成你节奏的一部分'。当你能同时处理游戏节奏和队友信息，你就进化成了编织者。",
    growthPathEn:
      "The scene: you're in a MOBA teamfight executing a perfect skill chain — then a teammate suddenly shouts 'watch behind!' Your attention breaks for half a second. Your combo drops. Your next ability is 0.3 seconds late. The chain reaction gets you focused and deleted. You know the callout was well-intentioned, but you simply can't 'snap back into rhythm after an interruption.' You need to 'find the feel' again, and that takes 30 seconds — in a teamfight, 30 seconds is everything. Growth path: practice 'dual-track rhythm.' When playing with headphones, use one ear for the game and one for voice chat. It'll be hard at first — but you're not training 'ignore distractions,' you're training 'make distractions part of your rhythm.' When you can process game rhythm and teammate information simultaneously, you evolve into the Weaver.",
  },

  // ─────────────────────────── 10. COMMANDER ───────────────────────────
  commander: {
    instinct:
      "你进游戏的第一件事不是'我该干什么'，而是'大家该干什么'。你的大脑自动开始分配角色、规划路线、制定优先级。不是因为你爱管闲事——而是因为你能'看到全局'。在MOBA里你的小地图视野覆盖率是队里最高的，在策略游戏里你同时运营三条战线，在模拟经营里你的团队分工比企业管理教科书还合理。你的能力不在于自己多强，而在于你能让所有人都变强。",
    instinctEn:
      "The first thing you think in any game isn't 'what should I do' — it's 'what should everyone do.' Your brain automatically starts assigning roles, planning routes, setting priorities. Not because you're controlling — because you 'see the big picture.' In MOBAs your minimap awareness rate is the highest on the team. In strategy games you manage three fronts simultaneously. In simulation games your team division is more organized than a management textbook. Your power isn't how strong you are — it's how strong you make everyone else.",
    behaviors:
      "你在MOBA里永远在ping地图。'别人可能会觉得烦吧？'你想过这个问题，但你控制不住——你看到队友要犯错的时候，不提醒就浑身难受。你在Overwatch/Apex里是永远的IGL，就算你没有最好的操作也没人质疑你的指挥，因为你的报点永远比别人多两条信息。你玩模拟经营的时候花70%的时间在'规划'，30%在'执行'——别人正好反过来。你可能有一个记事本或者脑子里有一张'最佳阵容清单'，你组队的时候会默默地按那张清单挑人。",
    behaviorsEn:
      "In MOBAs you're always pinging the map. 'Maybe it's annoying?' you've thought about it, but you can't help it — seeing a teammate about to make a mistake and not saying something makes you physically uncomfortable. In Overwatch/Apex you're the permanent IGL. Even without the best mechanics, nobody questions your shotcalling because your callouts always have two more pieces of information than anyone else's. In simulation games, you spend 70% of your time 'planning' and 30% 'executing' — others do the reverse. You probably have a mental 'ideal team composition list,' and when forming groups, you quietly pick people according to that list.",
    teamView:
      "队友分两种：一种觉得你是团队灵魂，一种觉得你管太多。第一种人在你指挥下赢了很多比赛，他们信任你的判断。第二种人觉得你不给他们自由发挥的空间——'你说了这么多，那我干什么？自己打行吗？'你很难理解第二种人的抱怨：明明按计划走就能赢，为什么非要'自由发挥'？但你不太愿意承认的是：有时候队友'不听话'反而打出了神操作。你的计划很好，但它不是唯一的路。",
    teamViewEn:
      "Teammates split into two camps. One type sees you as the team's soul — they've won many games under your calls and trust your judgment. The other type feels you're too controlling: 'You've said so much, what am I supposed to do? Can I just play?' You struggle to understand the second group: if following the plan wins, why insist on 'freestyle?' But what you won't quite admit is this: sometimes a teammate 'ignoring your call' produces a play of genius. Your plan is good — but it's not the only path.",
    growthPath:
      "场景：你在一场MOBA排位里指挥了全场。你的每一个指令都是对的——你的gank时机、你的dragon call、你的团战站位安排，全部是教科书级别。但你们还是输了。因为对面那个不按套路出牌的独狼carry一个人把你的计划撕碎了。你复盘的时候发现：你的计划很完美，但你计划里的五个人只有'四条手臂'——你自己没有贡献任何操作上的'力量'。你的指挥帮所有人变强了10%，但你自己的个人战斗力是团队最低的。进化路径：每天花十五分钟练习一个'操作型英雄'。不需要精通——只需要让你的手眼协调跟得上你的大脑。当你的指挥能力配上B级的手眼协调，你就是编织者——一个能同时指挥和执行的完美形态。",
    growthPathEn:
      "The scene: you shotcalled an entire MOBA ranked game. Every call was right — gank timing, dragon call, teamfight positioning, all textbook. But you still lost. Because the enemy's off-script lone-wolf carry tore your plan apart solo. Reviewing the replay, your plan was flawless, but the five people in your plan only had 'four pairs of hands' — you yourself contributed zero mechanical 'force.' Your shotcalling made everyone 10% stronger, but your personal combat power was the lowest on the team. Growth path: spend fifteen minutes daily practicing a 'mechanics-heavy hero.' You don't need to master it — just get your hand-eye coordination to keep up with your brain. When your leadership pairs with B-rank mechanics, you become the Weaver — someone who can command AND execute simultaneously.",
  },

  // ─────────────────────────── 11. WEAVER ───────────────────────────
  weaver: {
    instinct:
      "你的大脑是多线程处理器。当别人在做'一件事'的时候，你在同时做三件——而且每一件都不拉胯。RTS里你同时运营主基地、骚扰对手分矿、还在侦察第三个位置。MOBA里你在打线的同时追踪四个队友的血量和三条线的兵线位置。你的注意力不是集中在一个点上的激光——它是覆盖整个屏幕的雷达。你从来不觉得信息太多，你觉得信息永远不够。",
    instinctEn:
      "Your brain is a multi-threaded processor. While others are doing 'one thing,' you're handling three — and none of them suffer. In RTS, you simultaneously manage your main base, harass the enemy expansion, and scout a third location. In MOBAs, you track four teammates' health bars and three lanes' minion waves while laning. Your attention isn't a laser focused on one point — it's a radar covering the entire screen. You never feel like there's too much information. You always feel like there isn't enough.",
    behaviors:
      "你在星际争霸里的APM是朋友里最高的——不是因为你在疯狂乱按，而是因为你真的有那么多'有效操作'在同时执行。你在模拟经营里同时管理十条生产线，而且每一条都在盈利。你打MOBA的时候队友说你有'全图视野'——其实你只是每三秒扫一次小地图。你大概率擅长一心多用：你可能一边打游戏一边回消息，一边听播客，而且三件事都没出错。",
    behaviorsEn:
      "Your APM in StarCraft is the highest among your friends — not because you're spam-clicking, but because you genuinely have that many 'meaningful actions' executing simultaneously. In simulation games, you run ten production lines at once and every single one turns a profit. In MOBAs, teammates say you have 'full map vision' — really, you just glance at the minimap every three seconds. You're probably good at multitasking in real life too: gaming while texting while listening to a podcast, and somehow none of it suffers.",
    teamView:
      "队友觉得你是'那个什么都在做的人'——你永远同时在处理三件事。他们依赖你，因为你能补上任何人的漏洞：打野没看到gank路线你提醒、队友忘了买控制守卫你买、指挥官漏了一个信号你补上。但他们也注意到一个问题：你每件事都做了，但有些事只做到了'够用'而不是'完美'。当遇到一个在某个单一维度上极致的对手——比如一个纯操作的闪电刺客——你在那个维度上会被碾压。因为你的100分散在了五件事里，而他的100全砸在了一件事上。",
    teamViewEn:
      "Teammates see you as 'the person who's always doing everything' — you're perpetually handling three things at once. They rely on you because you fill every gap: you warn the jungler about a gank path they missed, you buy wards the teammate forgot, you relay signals the shotcaller dropped. But they also notice a problem: you do everything, but some things are only 'good enough' rather than 'perfect.' When you face an opponent who's extreme in one dimension — a pure-mechanics Lightning Assassin, for example — you get crushed in that dimension. Because your 100 points are spread across five tasks, and their 100 points are all in one.",
    growthPath:
      "场景：你在一局激烈的RTS对战中，同时运营三个基地、骚扰两条线路、还在微操你的主力部队。你很自豪自己能同时处理这一切——然后你的对手用一波all-in把你的主力部队全歼了。复盘的时候你发现：你在微操的那几秒钟，你的注意力只分了10%给主力部队。你在同时做五件事，但那个关键的战斗只得到了20%的你。而对手的100%碾压了你的20%。进化路径：学会'放手'。你不需要同时做五件事——你需要学会判断'现在最重要的是哪一件'。练习在关键时刻把所有注意力集中到一个任务上，其他的暂时放下。这不是你的弱点——这是你进化成指挥官的关键。把你的雷达切换成激光，在需要的时候。",
    growthPathEn:
      "The scene: you're in an intense RTS match, simultaneously running three bases, harassing two lanes, and microing your main army. You're proud of handling all of this — then your opponent all-ins and annihilates your main force. Reviewing the replay, you realize: during those crucial micro seconds, you only gave 10% attention to your army. You were doing five things, but the decisive battle only got 20% of you. Their 100% crushed your 20%. Growth path: learn to 'let go.' You don't need to do five things simultaneously — you need to learn which one matters most right now. Practice giving 100% attention to one task at critical moments, temporarily dropping everything else. This isn't a weakness — it's the key to evolving into the Commander. Switch your radar into a laser when the moment demands it.",
  },

  // ─────────────────────────── 12. SENTINEL ───────────────────────────
  sentinel: {
    instinct:
      "你走进任何一张地图，第一个注意到的是地形。这面墙能不能挡住视线？那个拐角有没有被偷袭的风险？这个高地能不能架枪？你的空间感就像一个永远在运行的3D建模软件——你不需要刻意思考，你的大脑会自动把整张地图的安全区域和危险区域标记出来。你不是最强的攻击者，但你是最难被攻破的防守者。任何人从你的防区经过，你都会知道。",
    instinctEn:
      "When you enter any map, the first thing you notice is terrain. Can this wall block sightlines? Does that corner have ambush risk? Can this high ground hold an angle? Your spatial sense runs like a perpetual 3D modeling program — you don't think about it consciously, your brain automatically tags every safe zone and danger zone on the entire map. You're not the strongest attacker, but you're the hardest defender to break. Anyone who passes through your zone, you'll know.",
    behaviors:
      "你在FPS里选的永远是'anchor'位——那种整局不挪窝但谁都打不过去的点位。你在生存游戏里建的基地布局合理到让朋友以为你学过建筑学。你在策略游戏里的防御工事永远多修一层——'以防万一'是你的口头禅。你可能在现实生活中也有类似的习惯：到了新地方你会先观察出口在哪，坐在餐厅里你喜欢选能看到门口的位置。你对空间的敏感度不是学来的，是天生的。",
    behaviorsEn:
      "In FPS you always pick the 'anchor' position — the spot where you don't move all game but nobody gets past. In survival games your base layouts are so logical friends think you studied architecture. In strategy games your fortifications always have one extra layer — 'just in case' is your catchphrase. You probably have similar habits in real life: at a new place you first check where the exits are, at restaurants you pick the seat with a view of the door. Your spatial sensitivity isn't learned — it's innate.",
    teamView:
      "队友对你的评价最统一：'放在那个位置就不用管了。'这是最高的赞美，也是最大的限制。你永远是被放在'守'的位置上的人，因为没人比你更适合。但也因为如此，你很少有机会证明你'也能进攻'。他们已经把你定义为'防守型'了——即使你想尝试进攻打法，队友的第一反应也是'你还是去守比较好'。你有时候会想：我到底是因为'擅长防守'才防守，还是因为'一直在防守'才擅长？",
    teamViewEn:
      "Teammates universally agree: 'Put them in that position and forget about it.' It's the highest compliment — and the biggest cage. You're always assigned the defensive role because nobody else is better. But because of this, you rarely get chances to prove you 'can also attack.' They've already labeled you 'defensive player' — even when you want to try aggressive play, the team's first reaction is 'you should probably hold instead.' Sometimes you wonder: am I defending because I'm good at it, or am I good at it because I've always been defending?",
    growthPath:
      "场景：你在生存游戏里建了一个完美的据点。四面城墙、双层防线、完善的资源存储系统。但你第58天饿死了——因为你的据点太远离了资源产出区域。你花了所有时间加固防御，却忘了最重要的事：防线再强，里面没吃的也是死。你不缺'怎么守'的能力，你缺的是'什么时候不该守'的判断。进化路径：下一局游戏，强制自己在前五分钟进行一次进攻行动——哪怕只是侦察性的。你会发现：进攻和防守不是对立的。知道敌人在哪，你的防线才能建在正确的地方。风险评估能力的提升会让你进化成不动要塞——不仅能守，还知道为什么守这里。",
    growthPathEn:
      "The scene: you built a perfect base in a survival game. Four walls, double defense line, complete resource storage system. But you starved on day 58 — because your base was too far from resource-producing areas. You spent all your time reinforcing defenses but forgot the most important thing: no matter how strong the walls, with nothing inside, it's still death. You don't lack the ability to defend — you lack the judgment of 'when not to defend.' Growth path: next game, force yourself to make one offensive move in the first five minutes — even just a scouting run. You'll discover: offense and defense aren't opposites. Knowing where the enemy is lets you build your defense in the right place. Improving risk assessment evolves you into the Fortress — not just defending, but knowing WHY to defend here.",
  },

  // ─────────────────────────── 13. SHAPESHIFTER ───────────────────────────
  shapeshifter: {
    instinct:
      "你不理解那些'只玩一种角色'的人。为什么要把自己限制在一个框里？你今天可以是FPS里的狙击手，明天可以是MOBA里的辅助，后天可以是策略游戏里的经济大师。你适应任何游戏都很快——不是因为你有特定的天赋，而是因为你有一种更稀有的能力：你能把自己'变成'那个游戏需要的玩家。你没有固定的战斗风格，因为你的风格就是'没有风格'。",
    instinctEn:
      "You don't understand people who 'only play one role.' Why box yourself in? Today you can be a sniper in FPS, tomorrow a support in a MOBA, the day after an economy master in strategy. You adapt to any game quickly — not because you have a specific talent, but because you have something rarer: the ability to 'become' whatever player the game needs. You don't have a fixed playstyle because your style is 'no style.'",
    behaviors:
      "你的游戏库比任何人都杂。FPS、策略、卡牌、模拟经营、解谜、音游——你什么都玩，什么都能上手。你在MOBA里不是'某某主'——你是那个'队伍缺什么我就补什么'的人。队友需要坦克你选坦克，需要输出你选输出，需要辅助你选辅助，而且每个角色你都能玩到'中等偏上'的水平。你的朋友经常说：'你这人太全面了，就是没有特别突出的。'你不确定这是表扬还是批评。",
    behaviorsEn:
      "Your game library is more diverse than anyone else's. FPS, strategy, card, simulation, puzzle, rhythm — you play everything and pick up anything. In MOBAs you're not a 'one-trick' — you're the 'whatever the team needs, I'll fill' player. Team needs a tank? Tank. DPS? DPS. Support? Support. And you can play each at an 'above average' level. Your friends often say: 'You're so well-rounded, but nothing really stands out.' You're not sure if that's a compliment or a criticism.",
    teamView:
      "队友对你的感觉是：'有你在很方便，但不是非你不可。'你是最灵活的队友——任何位置都能补，任何战术都能配合。但正因为你什么都能做，你从来不是任何位置上的'首选'。需要carry的时候他们会找闪电刺客，需要指挥的时候他们会找指挥官，需要防守的时候他们会找堡垒。你是永远的'备选'——不是因为你弱，而是因为你没有一个让人立刻想到你的'标签'。",
    teamViewEn:
      "Teammates feel: 'Having you is convenient, but you're not irreplaceable.' You're the most flexible teammate — you can fill any position, adapt to any tactic. But precisely because you can do everything, you're never the 'first pick' for anything. When they need a carry, they call the Lightning Assassin. When they need a shotcaller, they call the Commander. When they need defense, they call the Fortress. You're the permanent 'backup' — not because you're weak, but because you don't have a 'label' that makes people immediately think of you.",
    growthPath:
      "场景：你参加了一个游戏锦标赛。你是队伍里的万金油选手——教练让你填哪个位置你就填哪个。前三轮你表现不错，因为你灵活的角色池给了队伍很多ban/pick优势。但决赛来了，对手ban了你队伍核心carry的英雄。教练看向你：'你能carry吗？'你犹豫了——你能打carry，但你从来没有在'需要carry全场'的压力下打过。你选了carry英雄，但你的表现只是'还行'。而对面那个一辈子只练一个英雄的选手，把你碾碎了。进化路径：选一个。就一个。从你所有能玩的角色/游戏类型里选一个你最喜欢的，然后all-in。花一个月只练这一个东西。你不需要放弃你的灵活性——你只需要给自己一个'主技能'。当你在某个领域从B+到了S，你的全面性才会从'什么都行'变成'什么都行而且有一样无敌'。",
    growthPathEn:
      "The scene: you entered a tournament. You're the team's flex player — coach puts you wherever needed. First three rounds go well because your flexible champion pool gives great draft advantages. But the finals arrive, and the opponent bans your team's core carry. Coach looks at you: 'Can you carry?' You hesitate — you can play carry, but you've never done it under 'carry the entire game' pressure. You pick the carry hero, but your performance is just 'okay.' Meanwhile, the opponent's one-trick specialist crushes you. Growth path: choose one. Just one. From everything you can play, pick the one you enjoy most, and go all-in. Spend one month practicing only that. You don't need to abandon your flexibility — you just need to give yourself a 'main skill.' When you go from B+ to S in one area, your versatility transforms from 'can do anything' to 'can do anything AND is unbeatable at one thing.'",
  },

  // ─────────────────────────── 14. LONE WOLF ───────────────────────────
  "lone-wolf": {
    instinct:
      "你不需要队友，也不想要。这不是孤僻——是你发现一个简单的事实：依赖别人增加了一个你控制不了的变量。你自己做决策、自己执行、自己承担后果。在大逃杀里你从不跟队友一起落地，在RPG里你跳过所有NPC对话直奔Boss，在Roguelike里你单人挑战最高难度。你不是不能合作——你是合作的收益不值得你放弃独立行动的自由。",
    instinctEn:
      "You don't need teammates and you don't want them. This isn't antisocial — you've discovered a simple truth: depending on others adds a variable you can't control. You make your own decisions, execute yourself, bear the consequences alone. In battle royales you never land with your squad. In RPGs you skip all NPC dialogue and head straight for the boss. In roguelikes you solo the hardest difficulty. You're not incapable of cooperation — it's that cooperation's benefits aren't worth sacrificing your freedom of independent action.",
    behaviors:
      "你在大逃杀squad模式里的击杀数经常比队友加起来还多——但你的存活率却是最低的，因为你总是一个人去刚三人小队。你在MMO里有一个满级角色，但公会系统你从来没点开过。你在单机RPG里一周目就选了最高难度，然后硬肝了三天通关了——你拒绝看攻略，因为'被别人告诉答案'让你失去通关的意义。你的Steam个人资料可能写着类似'solo player'的个性签名。",
    behaviorsEn:
      "In battle royale squads, your kill count often exceeds all teammates combined — but your survival rate is the lowest because you keep soloing into three-man squads. In MMOs you have a max-level character, but you've never opened the guild system. In single-player RPGs you picked the hardest difficulty on your first playthrough and brute-forced your way through in three days — you refuse to read guides because 'being told the answer' strips the meaning from clearing it. Your Steam profile probably says something like 'solo player' in the bio.",
    teamView:
      "队友对你的感受很复杂。他们知道你是最强的个体——你的操作、你的决策、你的独立作战能力都是顶级的。但他们也知道有你在的队伍'不像一个队伍'。你不是不配合——你是在'用你自己的方式配合'，而那种方式就是'我去打我的，你们打你们的'。团战开始的时候你经常不在该在的位置上，因为你已经去单独执行了一个'你觉得更高效'的计划。有时候你是对的——你的solo行动赢了比赛。有时候你是错的——因为你不在，你的队友4v5输了。",
    teamViewEn:
      "Teammates have complicated feelings about you. They know you're the strongest individual — your mechanics, decisions, and solo fighting are all top-tier. But they also know a team with you 'doesn't feel like a team.' You don't refuse to cooperate — you cooperate 'your way,' which means 'I'll go do my thing, you guys do yours.' When teamfights start, you're often not where you should be because you've already gone to execute a plan you decided was 'more efficient.' Sometimes you're right — your solo play wins the game. Sometimes you're wrong — because you weren't there, your team lost a 4v5.",
    growthPath:
      "场景：你在一个五人团队赛里。你个人表现完美——击杀最多、死亡最少、目标达成率最高。但你的队伍2:3输了。赛后分析报告显示：你的队友在需要你的三次关键团战中全部是4v5。你不在，因为你在'执行你认为更有价值的solo任务'。你的数据证明你是对的——你的solo任务确实产出了更多资源。但游戏的胜利条件不是资源，是团战。你赢了数据，输了比赛。进化路径：你不需要变成一个'团队型选手'——那不是你。你需要的是学会'选择你的独行时刻'。给自己一个规则：关键团战之前30秒必须归队。其他时间你想solo就solo。这不是妥协——这是一个独狼的战术升级。从'永远solo'进化到'选择何时solo'。",
    growthPathEn:
      "The scene: you're in a five-player team tournament. Your individual performance is perfect — most kills, fewest deaths, highest objective completion. But your team loses 2-3. Post-match analysis shows: your teammates were in a 4v5 for all three critical teamfights. You weren't there because you were 'executing a solo task you deemed higher value.' Your stats prove you were right — your solo task produced more resources. But the win condition isn't resources, it's teamfights. You won the stats, lost the game. Growth path: you don't need to become a 'team player' — that's not you. What you need is to learn 'when to go solo.' Set yourself a rule: 30 seconds before critical teamfights, regroup. All other time, solo as much as you want. This isn't compromise — it's a tactical upgrade for a lone wolf. Evolving from 'always solo' to 'choosing when to solo.'",
  },

  // ─────────────────────────── 15. COLLECTOR ───────────────────────────
  collector: {
    instinct:
      "你不是在'玩游戏'——你是在'完成游戏'。每一个成就、每一个隐藏道具、每一条支线剧情、每一个收集要素……你的大脑会自动生成一张checklist，然后驱动你一个一个打勾。在RPG里你探索完每一个角落才去推主线，在模拟经营里你的仓库比商店还齐全，在解谜游戏里你记得每一条线索出现的位置。你享受'掌握信息'的感觉——当你对一个系统了如指掌的时候，那种'全知'的感觉让你极度满足。",
    instinctEn:
      "You're not 'playing a game' — you're 'completing a game.' Every achievement, every hidden item, every side quest, every collectible — your brain automatically generates a checklist, then drives you to tick them off one by one. In RPGs you explore every corner before touching the main quest. In simulation games your warehouse is better stocked than the shop. In puzzle games you remember where every clue appeared. You enjoy the feeling of 'mastering information' — when you understand a system completely, that sense of omniscience is deeply satisfying.",
    behaviors:
      "你的游戏成就完成率永远是好友列表里最高的。你在开放世界里跑图的时间比打主线多三倍。你在RPG里有一个Excel表格记录所有可获取的物品，而且你按区域排序标注了每一个的获取方式。你在打解谜游戏的时候从不用提示系统——不是因为你不需要，而是因为'用提示'等于'承认你不够了解这个系统'，这对你是一种侮辱。你可能有一个非常整洁的游戏存档管理习惯——每个存档都有命名规则。",
    behaviorsEn:
      "Your achievement completion rate is always the highest on your friends list. In open-world games, you spend three times more time exploring than doing the main quest. In RPGs you have an Excel spreadsheet tracking every obtainable item, sorted by region with acquisition methods noted for each one. In puzzle games you never use the hint system — not because you don't need it, but because 'using hints' means 'admitting you don't fully understand the system,' and that feels like an insult. You probably have a very organized save file management habit — every save has a naming convention.",
    teamView:
      "队友对你有一种'行走的攻略'的印象。他们遇到不确定的事情第一时间问你——'这个boss弱点是什么？'、'那个任务怎么触发？'、'哪里有隐藏房间？'你永远知道。但他们有时候觉得跟你组队'太慢了'——你在每个房间都要搜索一遍，你在每个分岔路口都要先去'不是目标'的那条路看看有没有东西。他们说'直接走主线啊'，你回答'等一下，这个箱子我还没开'。你不是拖延，你是确保没有遗漏。但在他们看来，这两者没什么区别。",
    teamViewEn:
      "Teammates see you as a 'walking strategy guide.' When they're unsure about something, you're the first person they ask: 'What's this boss's weakness?' 'How do I trigger that quest?' 'Where's the hidden room?' You always know. But sometimes they feel grouping with you is 'too slow' — you search every room, take every wrong turn at forks just to check for hidden items. They say 'just follow the main path,' you reply 'hold on, I haven't opened this chest yet.' You're not stalling — you're making sure nothing is missed. But to them, there's no difference.",
    growthPath:
      "场景：你在一个限时竞速赛模式里。你知道所有隐藏路线、所有道具位置、所有机关的最优解法——你的信息量碾压所有对手。但你输了。因为你在第二关停下来收集了一个不影响成绩的隐藏道具，浪费了12秒。你知道那个道具对通关时间没帮助，但你'控制不住'——漏掉一个可收集物品让你浑身不舒服。你的完美主义不允许你'跳过'任何东西。进化路径：练习'带着遗憾前进'。下一次打限时模式的时候，强迫自己跳过一个收集品。感受那种不舒服——然后让它过去。你不需要放弃完美主义，但你需要学会区分'值得完美'和'不值得完美'的东西。当你的决策速度跟上了你的知识储量，你就是预言师——一个既知道一切又能在正确时机行动的人。",
    growthPathEn:
      "The scene: you're in a timed speedrun mode. You know every hidden route, every item location, every puzzle's optimal solution — your information advantage crushes every opponent. But you lost. Because at stage two you stopped to collect a hidden item that doesn't affect your time, wasting 12 seconds. You knew it wouldn't help your completion time, but you 'couldn't help it' — missing a collectible makes you physically uncomfortable. Your perfectionism won't let you 'skip' anything. Growth path: practice 'moving forward with regret.' Next time you play a timed mode, force yourself to skip one collectible. Feel the discomfort — then let it pass. You don't need to abandon perfectionism, but you need to learn to distinguish 'worth being perfect about' from 'not worth it.' When your decision speed catches up to your knowledge base, you become the Oracle — someone who knows everything AND acts at the right moment.",
  },

  // ─────────────────────────── 16. CHAOS CHILD ───────────────────────────
  "chaos-child": {
    instinct:
      "你看到'推荐打法'第一反应是'不用这个'。规则、攻略、最优解——这些东西对别人来说是'指南'，对你来说是'限制'。你天生就想试试'如果不这样做会怎样'。Roguelike里你选那些所有攻略都说'别选'的道具，大逃杀里你用最冷门的武器搭配，RPG里你走所有人都劝你别走的路线。你不是在追求最优——你是在追求'没人试过'。",
    instinctEn:
      "Your first reaction to 'recommended build' is 'nah, not using that.' Rules, guides, optimal paths — for others they're 'directions,' for you they're 'restrictions.' You instinctively want to try 'what happens if I don't do it that way.' In roguelikes you pick the items every guide says 'don't pick.' In battle royales you use the most off-meta weapon combos. In RPGs you take the route everyone warns you against. You're not chasing optimal — you're chasing 'what nobody else has tried.'",
    behaviors:
      "你在Roguelike里有一个'垃圾道具挑战'文件夹，专门记录你用最差的build通关的录像。你在大逃杀里用过平底锅吃鸡。你在格斗游戏里专选最弱角色然后用奇怪的连招击败排行榜选手——不是因为你技术碾压，而是因为对手从来没见过你这种打法所以完全懵了。你的快乐不在于赢，在于'用不可能的方式赢'。当一个正常打法能赢的局，你会故意选一个更难的路——因为轻松赢了有什么意思？",
    behaviorsEn:
      "You have a 'garbage item challenge' folder in your roguelike directory, full of recordings where you cleared the game with the worst possible build. You've won a battle royale with a frying pan. In fighting games you main the weakest character and use weird combos to beat ranked players — not through mechanical dominance, but because they've literally never seen your approach and have no idea what's happening. Your joy isn't in winning — it's in 'winning the impossible way.' When a normal approach would win, you deliberately choose a harder path — because what's the point of an easy victory?",
    teamView:
      "队友跟你打游戏就两个字：刺激。你永远在做出乎意料的事情——有时候是天才操作，有时候是离谱送人头。他们已经学会了不去预测你的行为，因为你自己可能都不知道下一秒要做什么。最让他们又爱又恨的是：你的混沌打法在正常排位赛里是地狱，但在表演赛和自定义模式里是最好看的节目。你不适合'赢比赛'，你适合'让比赛变得有趣'。而有时候，'有趣'本身就能赢。",
    teamViewEn:
      "Playing with you is summed up in one word: chaos. You're always doing something unexpected — sometimes it's genius, sometimes it's spectacularly feeding. Teammates have learned not to predict your behavior because you probably don't know what you're doing next either. What they love and hate most: your chaotic playstyle is hell in ranked, but it's the best show in custom games and showmatches. You're not built to 'win games' — you're built to 'make games interesting.' And sometimes, 'interesting' wins on its own.",
    growthPath:
      "场景：你在卡牌游戏排位赛里用了一套你自创的'混沌卡组'。你觉得它有意思，它的combo路线是别人想不到的，它确实在某些对局里出其不意地赢了。但你的胜率只有38%。你在用62%的失败换那38%的'精彩'。你问自己：那38%的快感值得吗？当然值得——但如果你能把它提高到50%呢？进化路径：不是让你放弃混沌——而是给混沌加一个'底线'。保留你的混沌卡组，但给它加三张'稳定牌'。不是三张最优的牌——是三张在你的combo崩盘时能兜底的牌。你不需要变成一个'正常'玩家，你只需要在'混沌'和'翻车'之间加一道安全网。干扰抑制的提升会让你进化成混沌赌徒——保留所有的疯狂，但学会在崩盘前踩刹车。",
    growthPathEn:
      "The scene: you're playing ranked with a 'chaos deck' you invented in a card game. You think it's interesting — its combo routes are things nobody expects, and it does win some matchups through sheer surprise. But your win rate is 38%. You're trading 62% losses for 38% 'spectacular.' You ask yourself: are those 38% moments worth it? Of course they are — but what if you could push it to 50%? Growth path: don't abandon the chaos — add a 'floor' to it. Keep your chaos deck, but add three 'stable cards.' Not the three optimal cards — three cards that catch you when your combo collapses. You don't need to become a 'normal' player. You just need a safety net between 'chaos' and 'crash.' Improving interference suppression evolves you into the Gambler — keeping all the madness, but learning to hit the brakes before the crash.",
  },
};
