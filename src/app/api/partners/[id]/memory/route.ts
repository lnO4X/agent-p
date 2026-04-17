import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getModel } from "@/lib/ai";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { partners, users, userKnowledge } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { buildMemoryExtractionPrompt } from "@/lib/partner-prompts";
import { memoryExtractionSchema } from "@/lib/validations";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

/** Parse structured knowledge entries from LLM output */
function parseKnowledgeEntries(
  text: string
): Array<{ category: string; key: string; value: string }> {
  const knowledgeMatch = text.match(/```knowledge\s*\n([\s\S]*?)```/);
  if (!knowledgeMatch) return [];

  const validCategories = new Set([
    "preference",
    "skill",
    "behavior",
    "context",
  ]);
  const entries: Array<{ category: string; key: string; value: string }> = [];

  for (const line of knowledgeMatch[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split("|");
    if (parts.length >= 3) {
      const category = parts[0].trim();
      const key = parts[1].trim();
      const value = parts.slice(2).join("|").trim();
      if (validCategories.has(category) && key && value) {
        entries.push({ category, key, value });
      }
    }
  }

  return entries;
}

// DELETE /api/partners/[id]/memory — Clear partner memory
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Verify ownership
  const partner = await db
    .select({ id: partners.id })
    .from(partners)
    .where(and(eq(partners.id, id), eq(partners.userId, auth.sub)))
    .limit(1);

  if (partner.length === 0) {
    return NextResponse.json(
      { success: false, error: "Partner not found" },
      { status: 404 }
    );
  }

  try {
    // Clear partner memory
    await db
      .update(partners)
      .set({ memory: "", updatedAt: new Date() })
      .where(eq(partners.id, id));

    // Clear associated knowledge entries
    await db
      .delete(userKnowledge)
      .where(
        and(
          eq(userKnowledge.userId, auth.sub),
          eq(userKnowledge.source, id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("partners.memory", "Memory clear failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to clear memory" },
      { status: 500 }
    );
  }
}

// POST /api/partners/[id]/memory — Extract and update memory + knowledge graph
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();
  const parsed = memoryExtractionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verify ownership
  const partner = await db
    .select({
      id: partners.id,
      memory: partners.memory,
      modelId: partners.modelId,
    })
    .from(partners)
    .where(and(eq(partners.id, id), eq(partners.userId, auth.sub)))
    .limit(1);

  if (partner.length === 0) {
    return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
  }

  const model = await getModel(partner[0].modelId);
  if (!model) {
    return NextResponse.json(
      { success: false, error: "AI model not configured" },
      { status: 503 }
    );
  }

  // Tier-based memory limit: free=20, premium=50
  const userResult = await db
    .select({ tier: users.tier, tierExpiresAt: users.tierExpiresAt })
    .from(users)
    .where(eq(users.id, auth.sub))
    .limit(1);
  const isPremium = userResult.length > 0 && userResult[0].tier === "premium" &&
    (!userResult[0].tierExpiresAt || userResult[0].tierExpiresAt >= new Date());
  const maxMemory = isPremium ? 50 : 20;

  // Truncate conversation text to prevent token overflow (max ~8000 chars ≈ ~2000 tokens)
  const conversationText = parsed.data.conversationText.length > 8000
    ? parsed.data.conversationText.slice(-8000) // keep most recent part
    : parsed.data.conversationText;

  const prompt = buildMemoryExtractionPrompt(
    partner[0].memory,
    conversationText,
    maxMemory
  );

  try {
    const { text } = await generateText({
      model,
      prompt,
      maxOutputTokens: 1500,
    });

    // Extract memory bullet list (new format: ```memory ... ```)
    let memory = "";
    const memoryMatch = text.match(/```memory\s*\n([\s\S]*?)```/);
    if (memoryMatch) {
      memory = memoryMatch[1].trim();
    } else {
      // Fallback: old format (plain bullet list or generic code block)
      const codeBlockMatch = text.match(/```[\s\S]*?\n([\s\S]*?)```/);
      memory = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
    }

    // Update partner memory
    await db
      .update(partners)
      .set({ memory, updatedAt: new Date() })
      .where(eq(partners.id, id));

    // Extract and write knowledge entries to shared graph
    const knowledgeEntries = parseKnowledgeEntries(text);
    if (knowledgeEntries.length > 0) {
      const now = new Date();
      for (const entry of knowledgeEntries) {
        // Upsert: update existing key or insert new
        const existing = await db
          .select({ id: userKnowledge.id })
          .from(userKnowledge)
          .where(
            and(
              eq(userKnowledge.userId, auth.sub),
              eq(userKnowledge.key, entry.key)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(userKnowledge)
            .set({
              value: entry.value,
              category: entry.category as
                | "preference"
                | "skill"
                | "behavior"
                | "context",
              source: id,
              confidence: 0.8,
              updatedAt: now,
            })
            .where(eq(userKnowledge.id, existing[0].id));
        } else {
          await db.insert(userKnowledge).values({
            id: nanoid(),
            userId: auth.sub,
            category: entry.category as
              | "preference"
              | "skill"
              | "behavior"
              | "context",
            key: entry.key,
            value: entry.value,
            source: id,
            confidence: 0.8,
            updatedAt: now,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      memory,
      knowledgeCount: knowledgeEntries.length,
    });
  } catch (err) {
    logger.error("partners.memory", "Memory extraction failed", err);
    return NextResponse.json(
      { success: false, error: "Memory extraction failed" },
      { status: 500 }
    );
  }
}
