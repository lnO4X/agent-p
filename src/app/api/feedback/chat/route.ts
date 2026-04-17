import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { chatFeedback, partners, siteSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const feedbackSchema = z.object({
  partnerId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
});

/**
 * Resolve which AI model was used for a partner.
 * Priority: partner.modelId → site_settings ai_model → env AI_MODEL
 */
async function resolveModelId(partnerId: string): Promise<string | null> {
  try {
    const [partnerRow, settingsRow] = await Promise.all([
      db.select({ modelId: partners.modelId }).from(partners).where(eq(partners.id, partnerId)).limit(1),
      db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, "ai_model")).limit(1),
    ]);
    return partnerRow[0]?.modelId || settingsRow[0]?.value || process.env.AI_MODEL || null;
  } catch {
    return null;
  }
}

/**
 * POST /api/feedback/chat — Rate a chat session
 */
export async function POST(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { partnerId, rating } = parsed.data;
  const modelId = await resolveModelId(partnerId);

  await db.insert(chatFeedback).values({
    id: nanoid(),
    userId: auth.sub,
    partnerId,
    rating,
    modelId,
  });

  return NextResponse.json({ success: true });
}

/**
 * GET /api/feedback/chat — Get user's chat feedback stats
 */
export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const stats = await db
    .select({
      total: sql<number>`count(*)::int`,
      avgRating: sql<number>`round(avg(rating)::numeric, 1)`,
    })
    .from(chatFeedback)
    .where(eq(chatFeedback.userId, auth.sub));

  return NextResponse.json({
    success: true,
    data: {
      totalRatings: stats[0]?.total || 0,
      avgRating: stats[0]?.avgRating || null,
    },
  });
}
