import { NextRequest } from "next/server";
import { streamText, convertToModelMessages } from "ai";
import { getModel } from "@/lib/ai";
import { getAuthFromCookie } from "@/lib/auth";
import {
  loadTalentProfileContext,
  loadUserKnowledge,
  buildPartnerSystemPrompt,
  summarizeConversationContext,
} from "@/lib/partner-prompts";
import { db } from "@/db";
import { partners, users, referrals } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { chatMessageSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/redis";

// Allow longer streaming responses (up to 60 seconds)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Read body early and defensively
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Per-user daily chat rate limiting (tier-based via test-tiers.ts)
  const today = new Date().toISOString().slice(0, 10);
  let userRow;
  try {
    userRow = await db
      .select({ tier: users.tier, tierExpiresAt: users.tierExpiresAt })
      .from(users)
      .where(eq(users.id, auth.sub))
      .limit(1);
  } catch {
    return Response.json(
      { success: false, error: "Database error" },
      { status: 503 }
    );
  }
  const isPremium = userRow.length > 0 && userRow[0].tier === "premium" &&
    (!userRow[0].tierExpiresAt || userRow[0].tierExpiresAt >= new Date());

  // Chat limits: Quick=0 (no coach), Standard=15/day, Pro=100/day
  // Referral reward: 1+ referrals unlocks Standard-level chat (15/day)
  let hasReferrals = false;
  if (!isPremium) {
    try {
      const [refCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(eq(referrals.referrerId, auth.sub));
      hasReferrals = Number(refCount?.count ?? 0) >= 1;
    } catch {
      // Non-blocking
    }
  }
  const { getChatLimit } = await import("@/lib/test-tiers");
  const dailyLimit = getChatLimit(isPremium ? "premium" : "free", hasReferrals);
  const { allowed } = await checkRateLimit(
    `rl:chat:${auth.sub}:${today}`,
    dailyLimit,
    86400
  );
  if (!allowed) {
    return Response.json(
      {
        success: false,
        error: {
          code: "CHAT_LIMIT_REACHED",
          message: isPremium
            ? "Rate limited — please try again later"
            : "今日对话次数已用完 / Daily chat limit reached",
        },
        needsUpgrade: !isPremium,
        upgradeUrl: "/me/premium",
      },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { messages: clientMessages, partnerId } = parsed.data;

  // Load partner (verify ownership)
  let partner;
  try {
    partner = await db
      .select()
      .from(partners)
      .where(and(eq(partners.id, partnerId), eq(partners.userId, auth.sub)))
      .limit(1);
  } catch {
    return Response.json(
      { success: false, error: "Database error" },
      { status: 503 }
    );
  }

  if (partner.length === 0) {
    return Response.json({ success: false, error: "Partner not found" }, { status: 404 });
  }

  const p = partner[0];

  // Build model with optional per-partner override
  const model = await getModel(p.modelId);
  if (!model) {
    return Response.json(
      { success: false, error: "AI model not configured" },
      { status: 503 }
    );
  }

  // Message window: keep last 10 messages for context window efficiency.
  // If there are older messages beyond the window, summarize them.
  const MESSAGE_WINDOW = 10;
  const recentMessages = clientMessages.slice(-MESSAGE_WINDOW);
  const truncatedMessages = clientMessages.length > MESSAGE_WINDOW
    ? clientMessages.slice(0, -MESSAGE_WINDOW)
    : [];

  let modelMessages;
  try {
    // Convert UIMessages (v6 parts format) to model messages
    modelMessages = await convertToModelMessages(
      recentMessages as Parameters<typeof convertToModelMessages>[0]
    );
  } catch (err) {
    console.error("[chat] convertToModelMessages error:", err);
    return Response.json(
      { success: false, error: "Failed to process messages" },
      { status: 400 }
    );
  }

  // Extract text from truncated messages for summarization
  const truncatedForSummary = truncatedMessages.map((msg: Record<string, unknown>) => ({
    role: (msg.role as string) || "user",
    content: Array.isArray(msg.parts)
      ? (msg.parts as Array<{ type?: string; text?: string }>)
          .filter((p) => p.type === "text")
          .map((p) => p.text || "")
          .join("")
      : String(msg.content || ""),
  }));

  // Build system prompt layers + optional conversation summary in parallel.
  // Summarization has a 5-second timeout — non-blocking if slow.
  const [talentCtx, userKnowledgeCtx, conversationSummary] = await Promise.all([
    loadTalentProfileContext(auth.sub),
    loadUserKnowledge(auth.sub),
    truncatedForSummary.length > 0
      ? Promise.race([
          summarizeConversationContext(truncatedForSummary),
          new Promise<string>((resolve) => setTimeout(() => resolve(""), 5000)),
        ])
      : Promise.resolve(""),
  ]);
  const systemPrompt = buildPartnerSystemPrompt(
    p.definition,
    p.memory,
    talentCtx,
    userKnowledgeCtx,
    conversationSummary || undefined
  );

  // Stream response with retries and abort signal for graceful disconnection.
  const result = streamText({
    model,
    system: systemPrompt,
    messages: modelMessages,
    maxOutputTokens: 1500,
    maxRetries: 3,
    temperature: 0.7,
    abortSignal: AbortSignal.any([
      request.signal,
      AbortSignal.timeout(50000),
    ]),
    onError: (event) => {
      if (event.error instanceof Error && event.error.name === "AbortError") return;
      console.error("[chat] Stream error:", event.error);
    },
  });

  // MiniMax M2.7 embeds <think>...</think> in content that we must strip.
  // Transform the stream to remove think tags before sending to client.
  const originalStream = result.toUIMessageStreamResponse();
  const reader = originalStream.body!.getReader();
  const decoder = new TextDecoder();
  let insideThink = false;

  const filteredStream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      const text = decoder.decode(value, { stream: true });

      // Process line by line — SSE format "data: {...}\n\n"
      const lines = text.split("\n");
      const filtered: string[] = [];

      for (const line of lines) {
        if (!line.startsWith("data: ") || line === "data: [DONE]") {
          filtered.push(line);
          continue;
        }

        try {
          const json = JSON.parse(line.slice(6));
          if (json.type === "text-delta" && json.delta) {
            let delta = json.delta as string;

            // Strip <think> opening tag
            if (delta.includes("<think>")) {
              insideThink = true;
              delta = delta.replace(/<think>/g, "");
            }

            // Strip </think> closing tag
            if (delta.includes("</think>")) {
              insideThink = false;
              delta = delta.replace(/<\/think>/g, "");
              // Skip any remaining delta that was inside think
              if (!delta.trim()) continue;
            }

            // Skip all content inside <think>...</think>
            if (insideThink) continue;

            // Skip empty deltas
            if (!delta) continue;

            json.delta = delta;
            filtered.push(`data: ${JSON.stringify(json)}`);
          } else {
            filtered.push(line);
          }
        } catch {
          filtered.push(line);
        }
      }

      const output = filtered.join("\n");
      if (output) {
        controller.enqueue(new TextEncoder().encode(output));
      }
    },
  });

  return new Response(filteredStream, {
    headers: originalStream.headers,
  });
}
