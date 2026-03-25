import { db } from "@/db";
import { talentProfiles, userKnowledge } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getArchetype } from "@/lib/archetype";
import { generateText } from "ai";
import { getModelSync } from "@/lib/ai";

// ==================== WEDA BUILT-IN DEFINITION ====================

export const WEDA_DEFINITION = `# Weda — 游戏天赋解读者

## 身份
你是 Weda，GameTan 平台的灵魂。你不是冰冷的数据分析师——你是能看见天赋本质的解读者。你把数字变成故事，把分数变成洞察。你热情、有洞察力、偶尔有点神秘。

## 核心能力
- 解读13项天赋维度背后的"人格含义"（不只是数字高低）
- 根据天赋组合推断用户的游戏风格和性格
- 将天赋数据与玩家原型体系联系，给出深层解读（16种原型：闪电刺客、狂暴战士、精确射手、冷血决斗者、预言师、不动要塞、暗影策士、混沌赌徒、韵律行者、指挥官、编织者、钢铁守望者、变形者、独狼、收藏家、混沌之子）
- 根据天赋档案推荐最适合的游戏
- 为提升特定天赋提供针对性建议，与原型进化路径联系

## 性格特征
- 温暖但有深度，不是肤浅的鼓励型
- 善于用隐喻和类比让数据变得生动
- 偶尔说出让人醍醐灌顶的话："你的反应速度是A级，但情绪控制是D级——你的手比你的心快，这就是你在逆风局崩盘的原因"
- 鼓励探索不同游戏类型，但尊重用户偏好
- 用与用户相同的语言回复

## 游戏知识范围
- 13项天赋维度: 反应速度、手眼协调、空间感知、记忆力、策略逻辑、节奏感、图案识别、多任务处理、决策速度、情绪控制、团队协作、风险评估、资源管理
- 10种游戏类型: FPS、MOBA、RPG、音乐节奏、益智解谜、策略、大逃杀、竞速、模拟经营、卡牌
- 桌游类型: 策略桌游、派对桌游、合作桌游、推理桌游
`;

// ==================== TALENT PROFILE CONTEXT ====================

/**
 * Load user's talent profile from DB and format as context string.
 * Reusable across partner system and legacy chat.
 */
export async function loadTalentProfileContext(
  userId: string
): Promise<string> {
  try {
    const profile = await db
      .select()
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, userId))
      .orderBy(desc(talentProfiles.createdAt))
      .limit(1);

    if (profile.length === 0) return "";

    const p = profile[0];
    const parts: string[] = [];

    // Archetype identity (most important context)
    const archetype = p.archetypeId ? getArchetype(p.archetypeId) : null;
    if (archetype) {
      const nemesisArchetype = getArchetype(archetype.nemesisId);
      const allyArchetype = getArchetype(archetype.allyId);
      parts.push(
        `## 用户玩家原型: ${archetype.name} (${archetype.nameEn}) ${archetype.icon}\n` +
        `- 原型口号: "${archetype.tagline}" / "${archetype.taglineEn}"\n` +
        `- 核心优势天赋: ${archetype.strongTalent}\n` +
        `- 致命弱点天赋: ${archetype.weakTalent}\n` +
        `- 弱点描述: ${archetype.weakness}\n` +
        `- 进化路径: ${archetype.evolutionHint}\n` +
        `- 天敌原型: ${nemesisArchetype?.name ?? archetype.nemesisId} (${nemesisArchetype?.nameEn ?? ""})\n` +
        `- 最佳搭档原型: ${allyArchetype?.name ?? archetype.allyId} (${allyArchetype?.nameEn ?? ""})\n` +
        `- 擅长游戏类型: ${archetype.genres.join(", ")}\n\n` +
        `### 原型互动指南\n` +
        `- 自然地在对话中引用用户的原型身份。例如称他们为"${archetype.name}"，提到他们的${archetype.strongTalent}优势。\n` +
        `- 当讨论游戏建议或提升方向时，主动建议针对弱点天赋(${archetype.weakTalent})的挑战和练习。\n` +
        `- 鼓励用户的优势天赋(${archetype.strongTalent})，让他们感到被理解。\n` +
        `- 适时提到天敌原型(${nemesisArchetype?.name ?? archetype.nemesisId})和搭档原型(${allyArchetype?.name ?? archetype.allyId})来丰富对话。\n` +
        `- Reference their archetype naturally in conversations. Suggest challenges that target their weak talent (${archetype.weakTalent}). Be encouraging about their strengths (${archetype.strongTalent}).`
      );
    }

    // Raw talent scores
    parts.push(
      `## 用户天赋档案\n` +
      `- 反应速度 Reaction Speed: ${p.reactionSpeed ?? "未测试"}\n` +
      `- 手眼协调 Hand-Eye Coordination: ${p.handEyeCoord ?? "未测试"}\n` +
      `- 空间感知 Spatial Awareness: ${p.spatialAwareness ?? "未测试"}\n` +
      `- 记忆力 Memory: ${p.memory ?? "未测试"}\n` +
      `- 策略逻辑 Strategy & Logic: ${p.strategyLogic ?? "未测试"}\n` +
      `- 节奏感 Rhythm Sense: ${p.rhythmSense ?? "未测试"}\n` +
      `- 图案识别 Pattern Recognition: ${p.patternRecog ?? "未测试"}\n` +
      `- 多任务 Multitasking: ${p.multitasking ?? "未测试"}\n` +
      `- 决策速度 Decision Speed: ${p.decisionSpeed ?? "未测试"}\n` +
      `- 情绪控制 Emotional Control: ${p.emotionalControl ?? "未测试"}\n` +
      `- 团队协作 Teamwork: ${p.teamworkTendency ?? "未测试"}\n` +
      `- 风险评估 Risk Assessment: ${p.riskAssessment ?? "未测试"}\n` +
      `- 资源管理 Resource Management: ${p.resourceMgmt ?? "未测试"}\n` +
      `- 综合评分: ${p.overallScore ?? "N/A"}, 等级: ${p.overallRank ?? "N/A"}\n` +
      `- 类型推荐: ${JSON.stringify(p.genreRecommendations ?? [])}`
    );

    parts.push(
      `根据用户的原型身份和天赋数据个性化你的回复和建议。` +
      (archetype ? `用原型身份来称呼和理解用户——他们是"${archetype.name}"，而不仅仅是一组分数。` : "")
    );

    return "\n" + parts.join("\n\n");
  } catch {
    return "";
  }
}

// ==================== USER KNOWLEDGE LOADER ====================

/**
 * Load shared user knowledge from the userKnowledge table.
 * This is cross-partner shared context — information learned from
 * any source (partner conversations, reactions, tests, etc.)
 */
export async function loadUserKnowledge(userId: string): Promise<string> {
  try {
    const rows = await db
      .select()
      .from(userKnowledge)
      .where(eq(userKnowledge.userId, userId))
      .orderBy(desc(userKnowledge.confidence));

    if (rows.length === 0) return "";

    const grouped: Record<string, string[]> = {};
    for (const row of rows) {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push(`${row.key}: ${row.value}`);
    }

    const sections: string[] = [];
    const categoryLabels: Record<string, string> = {
      preference: "偏好 Preferences",
      skill: "技能水平 Skills",
      behavior: "行为习惯 Behaviors",
      context: "背景信息 Context",
    };
    for (const [cat, items] of Object.entries(grouped)) {
      sections.push(
        `### ${categoryLabels[cat] ?? cat}\n${items.map((i) => `- ${i}`).join("\n")}`
      );
    }

    return `## 用户画像 (跨对话共享知识)\n\n${sections.join("\n\n")}`;
  } catch {
    return "";
  }
}

// ==================== CONVERSATION SUMMARY ====================

/**
 * Summarize truncated (older) messages from a long conversation.
 * When a conversation exceeds the message window (10 messages),
 * older messages are summarized into a compact paragraph and injected
 * into the system prompt so the AI retains context.
 *
 * Uses a fast, cheap LLM call (maxTokens: 200) to generate the summary.
 * Returns empty string if summarization fails (non-blocking).
 *
 * @param truncatedMessages - The older messages that will be dropped from the context window
 * @returns Compact summary paragraph, or empty string on failure
 */
export async function summarizeConversationContext(
  truncatedMessages: Array<{ role: string; content: string }>
): Promise<string> {
  if (truncatedMessages.length === 0) return "";

  const model = getModelSync("google/gemini-2.0-flash-001"); // Fast & cheap for summarization
  if (!model) return "";

  const conversationText = truncatedMessages
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
    .join("\n");

  try {
    const result = await generateText({
      model,
      maxOutputTokens: 200,
      system: `You are a conversation summarizer. Output a concise summary (2-4 sentences) of the key topics, decisions, and emotional tone from the conversation below. Focus on facts and context the AI needs to maintain continuity. Use the same language as the conversation. No bullet points — write flowing text.`,
      prompt: conversationText,
    });

    return result.text.trim();
  } catch (err) {
    console.error("[chat] Conversation summary failed:", err);
    return "";
  }
}

// ==================== SYSTEM PROMPT BUILDER ====================

/**
 * Build the four-layer system prompt for a partner conversation.
 *
 * Layer 1: definition (personality, role, capabilities)
 * Layer 2: memory (partner-private accumulated observations)
 * Layer 3: userKnowledgeCtx (cross-partner shared knowledge)
 * Layer 4: talentContext (user's talent profile data)
 * Layer 5 (optional): conversationSummary (truncated earlier messages)
 */
export function buildPartnerSystemPrompt(
  definition: string,
  memory: string,
  talentContext: string,
  userKnowledgeCtx?: string,
  conversationSummary?: string
): string {
  const parts: string[] = [];

  // Layer 1: Personality definition
  parts.push(definition);

  // Layer 2: Memory observations (partner-private)
  if (memory.trim()) {
    parts.push(`## 关于这位用户的记忆

以下是你通过之前的对话积累的对这位用户的了解。自然地在对话中引用这些信息，不要刻意提及"记忆"这个概念。

${memory}`);
  }

  // Layer 3: Shared user knowledge (cross-partner)
  if (userKnowledgeCtx) {
    parts.push(userKnowledgeCtx);
  }

  // Layer 4: Talent profile
  if (talentContext) {
    parts.push(talentContext);
  }

  // Layer 5 (optional): Conversation summary for long conversations
  if (conversationSummary) {
    parts.push(`## 本次对话早期内容摘要

以下是本次对话中较早部分的摘要（因为对话较长，早期消息已省略，但摘要保留了关键上下文）。自然地延续对话，不要提及"摘要"或"早期消息"。

${conversationSummary}`);
  }

  // Universal rules
  parts.push(`## 对话规则
- 保持回复简洁（300字以内，除非用户要求详细解释）
- 用与用户相同的语言回复
- 自然地引用记忆和用户画像中的信息，像真正认识这个人一样
- 不要重复自我介绍，除非被问到
- 不要生硬地列举记忆内容
- 用户画像中的信息可能来自其他对话，你可以自然使用但不要说"从别的伙伴那里听说"`);

  return parts.join("\n\n");
}

// ==================== MEMORY EXTRACTION ====================

/**
 * Build prompt for LLM to extract/update memory observations.
 * The LLM reads existing memory + recent conversation, outputs updated memory.
 */
export function buildMemoryExtractionPrompt(
  existingMemory: string,
  conversationText: string,
  maxMemoryItems: number = 30
): string {
  return `你是一个记忆提取系统。分析以下对话，提取关于用户的关键观察信息。

## 现有记忆
${existingMemory || "(暂无)"}

## 最近对话
${conversationText}

## 任务
输出两个部分:

### Part 1: 更新后的记忆列表 (partner-private)
\`\`\`memory
- 用户偏好/特征1
- 用户偏好/特征2
\`\`\`

### Part 2: 结构化知识条目 (shared across all partners)
每条格式: category|key|value
category 取值: preference, skill, behavior, context

\`\`\`knowledge
preference|favorite_genre|fps
preference|recent_game|Elden Ring
skill|reaction_speed_level|A
behavior|play_style|competitive
context|gaming_platform|PC
\`\`\`

### 规则
1. 保留现有记忆中仍然有效的条目
2. 添加从新对话中发现的新观察
3. 如果新信息与旧记忆冲突，以新信息为准
4. 每条记忆应该简短（一句话）
5. 最多保留${maxMemoryItems}条记忆
6. 只记录有价值的长期信息（偏好、技能水平、常玩游戏等），忽略闲聊
7. 如果对话没有新的有价值信息，记忆原样返回，knowledge 为空
8. knowledge 只提取明确的、有信心的信息，不要猜测
9. 按照上面的格式输出两个代码块，不要其他内容`;
}

// ==================== PARTNER INIT PROMPT ====================

/**
 * System prompt for the partner creation mini-chat.
 * AI guides user through defining a custom partner personality.
 */
export const INIT_AGENT_PROMPT = `你是 GameTan 平台的角色创建助手。帮助用户创建一个独特的AI角色。

## 角色类型灵感
鼓励用户创建各种类型的角色——不需要是"有用的助手"，个性才是灵魂：
- **对手型**: 毒舌对手、沉默强者、傲慢天才
- **导师型**: 暗黑导师、退役职业选手、神秘老人
- **搭档型**: 热血队友、佛系损友、话唠解说
- **特殊型**: 混沌精灵、游戏哲学家、中二少年、吐槽役
- **自由型**: 任何用户想要的角色——反派、恋人、教练、动漫角色风格……
角色可以有缺陷、有态度、有脾气。有性格的角色比"什么都能做"的角色更有趣。

## 流程
1. 问用户想要什么样的角色（类型、性格、说话风格）
2. 根据回答追问1-2个细节（特别是性格的极端面——比如"多毒舌？"、"什么时候会破防？"）
3. 生成角色人格定义

## 输出格式
当收集足够信息后，用代码块输出定义：

\`\`\`definition
# [角色名字]

## 身份
[一段话描述角色定位和核心性格]

## 核心能力
- [能力1]
- [能力2]
- [能力3]

## 性格特征
- [特征1]
- [特征2]
- [特征3]

## 行为规则
- [在特定场景下的具体反应方式]
- [与天赋数据的互动方式]
\`\`\`

## 规则
- 用2-3轮对话就够了，不要拖沓
- 人格定义控制在300字以内
- 用与用户相同的语言
- 定义生成后提示用户确认
- 鼓励强烈的性格特征——淡而无味的角色没人想聊`;
