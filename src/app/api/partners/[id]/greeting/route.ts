import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { partners, talentProfiles } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getModel } from "@/lib/ai";
import { generateText } from "ai";
import { logger } from "@/lib/logger";

/**
 * GET /api/partners/[id]/greeting — Generate a proactive greeting
 * Available for all users. Based on recent events (challenge results, talent changes, streaks).
 * Returns { greeting: string } or { greeting: null } if no events.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json({ greeting: null });
    }

    const { id: partnerId } = await params;

    // Load partner
    const partnerResult = await db
      .select({ name: partners.name, definition: partners.definition, memory: partners.memory })
      .from(partners)
      .where(and(eq(partners.id, partnerId), eq(partners.userId, auth.sub)))
      .limit(1);

    if (partnerResult.length === 0) {
      return NextResponse.json({ greeting: null });
    }

    const partner = partnerResult[0];

    // Gather recent events (last 7 days)
    const events: string[] = [];

    // Latest talent profile
    const profiles = await db
      .select({
        overallScore: talentProfiles.overallScore,
        overallRank: talentProfiles.overallRank,
        archetypeId: talentProfiles.archetypeId,
      })
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, auth.sub))
      .orderBy(desc(talentProfiles.createdAt))
      .limit(1);

    if (profiles.length > 0 && profiles[0].overallScore) {
      events.push(
        `Overall talent rank: ${profiles[0].overallRank} (score ${Math.round(profiles[0].overallScore)})` +
          (profiles[0].archetypeId ? `, archetype: ${profiles[0].archetypeId}` : "")
      );
    }

    // If no events, no greeting
    if (events.length === 0) {
      return NextResponse.json({ greeting: null });
    }

    // Generate greeting via AI (fast model for quick response)
    const model = await getModel("google/gemini-2.0-flash-001");
    if (!model) {
      return NextResponse.json({ greeting: null });
    }

    const prompt = `You are ${partner.name}. Your personality: ${partner.definition?.slice(0, 300) || "a friendly AI companion"}.

${partner.memory ? `You remember about the user:\n${partner.memory}\n` : ""}
Recent user events:
${events.map((e) => `- ${e}`).join("\n")}

Generate ONE short, natural greeting (1-2 sentences, max 100 chars) that references one of these recent events. Be warm, engaging, and in-character. If the user has a streak, acknowledge it enthusiastically. Detect and match the language from partner definition/memory (Chinese or English). Do NOT use emoji. Output ONLY the greeting text, nothing else.`;

    // Race AI generation against 2s timeout — don't let greeting block experience
    const result = await Promise.race([
      generateText({ model, prompt, maxOutputTokens: 120 }),
      new Promise<{ text?: string }>((resolve) =>
        setTimeout(() => resolve({}), 2000)
      ),
    ]);

    const greeting = result.text?.trim() || null;

    return NextResponse.json({ greeting });
  } catch (error) {
    logger.error("partners.greeting", "Greeting generation failed", error);
    return NextResponse.json({ greeting: null });
  }
}
