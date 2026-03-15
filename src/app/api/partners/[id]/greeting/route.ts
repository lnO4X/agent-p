import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { partners, users, microChallenges, talentProfiles } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getModel } from "@/lib/ai";
import { generateText } from "ai";

/**
 * GET /api/partners/[id]/greeting — Generate a proactive greeting
 * Premium-only: based on recent events (challenge results, talent changes).
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

    // Check premium tier
    const userResult = await db
      .select({ tier: users.tier, tierExpiresAt: users.tierExpiresAt })
      .from(users)
      .where(eq(users.id, auth.sub))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ greeting: null });
    }

    const user = userResult[0];
    const isPremium =
      user.tier === "premium" &&
      (!user.tierExpiresAt || user.tierExpiresAt >= new Date());

    if (!isPremium) {
      return NextResponse.json({ greeting: null });
    }

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

    // Gather recent events (last 3 days)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const events: string[] = [];

    // Recent challenges
    const challenges = await db
      .select({
        talentCategory: microChallenges.talentCategory,
        score: microChallenges.score,
        completedAt: microChallenges.completedAt,
      })
      .from(microChallenges)
      .where(eq(microChallenges.userId, auth.sub))
      .orderBy(desc(microChallenges.completedAt))
      .limit(3);

    for (const ch of challenges) {
      if (ch.completedAt && ch.completedAt >= threeDaysAgo) {
        events.push(
          `Completed a ${ch.talentCategory} challenge with score ${Math.round(ch.score)}`
        );
      }
    }

    // Latest talent profile score
    const profiles = await db
      .select({ overallScore: talentProfiles.overallScore, overallRank: talentProfiles.overallRank })
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, auth.sub))
      .orderBy(desc(talentProfiles.createdAt))
      .limit(1);

    if (profiles.length > 0 && profiles[0].overallScore) {
      events.push(
        `Overall talent rank: ${profiles[0].overallRank} (score ${Math.round(profiles[0].overallScore)})`
      );
    }

    // If no events, no greeting
    if (events.length === 0) {
      return NextResponse.json({ greeting: null });
    }

    // Generate greeting via AI
    const model = getModel();
    if (!model) {
      return NextResponse.json({ greeting: null });
    }

    const prompt = `You are ${partner.name}. Your personality: ${partner.definition?.slice(0, 200) || "a friendly AI companion"}.

${partner.memory ? `You remember about the user:\n${partner.memory}\n` : ""}
Recent user events:
${events.map((e) => `- ${e}`).join("\n")}

Generate ONE short greeting (1-2 sentences, under 80 chars) that references one of these recent events. Be warm, natural, and in-character. Match the language the user typically uses (Chinese or English). Do NOT use emoji.`;

    const result = await generateText({
      model,
      prompt,
      maxOutputTokens: 100,
    });

    const greeting = result.text?.trim() || null;

    return NextResponse.json({ greeting });
  } catch (error) {
    console.error("Greeting error:", error);
    return NextResponse.json({ greeting: null });
  }
}
