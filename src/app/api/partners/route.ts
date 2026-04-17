import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { partners, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createPartnerSchema } from "@/lib/validations";
import { COACH_DEFINITION } from "@/lib/partner-prompts";

/** Tier-based slot limits: free=2 custom, premium=5 custom */
const SLOT_LIMITS = { free: 2, premium: 5 } as const;

type TierInfo = { tier: "free" | "premium"; tierExpiresAt: Date | null };

async function getUserTier(userId: string): Promise<TierInfo> {
  const result = await db
    .select({ tier: users.tier, tierExpiresAt: users.tierExpiresAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (result.length === 0) return { tier: "free", tierExpiresAt: null };
  const user = result[0];
  if (user.tier === "premium") {
    // Check if premium has expired
    if (user.tierExpiresAt && user.tierExpiresAt < new Date()) {
      return { tier: "free", tierExpiresAt: null };
    }
    return { tier: "premium", tierExpiresAt: user.tierExpiresAt };
  }
  return { tier: "free", tierExpiresAt: null };
}

/**
 * Ensure Talent Coach coach (slot=0) exists for user. Lazily created on first access.
 * Uses INSERT ... ON CONFLICT DO NOTHING — safe for concurrent calls.
 */
async function ensureCoach(userId: string) {
  await db
    .insert(partners)
    .values({
      id: nanoid(),
      userId,
      slot: 0,
      name: "Talent Coach",
      avatar: "Brain",
      definition: COACH_DEFINITION,
      memory: "",
    })
    .onConflictDoNothing();
}

// GET /api/partners — List user's partners (auto-creates Talent Coach)
export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Ensure Talent Coach coach exists
  await ensureCoach(auth.sub);

  const [result, tierInfo] = await Promise.all([
    db
      .select({
        id: partners.id,
        slot: partners.slot,
        name: partners.name,
        avatar: partners.avatar,
        modelId: partners.modelId,
        definition: partners.definition,
        memory: partners.memory,
        createdAt: partners.createdAt,
        updatedAt: partners.updatedAt,
      })
      .from(partners)
      .where(eq(partners.userId, auth.sub))
      .orderBy(partners.slot),
    getUserTier(auth.sub),
  ]);

  const { tier, tierExpiresAt } = tierInfo;
  const maxSlots = 1 + SLOT_LIMITS[tier]; // 1 (coach) + custom slots

  // Fix legacy "Weda" name in DB — always return "Talent Coach" for built-in coach (slot 0)
  const fixedResult = result.map((p) =>
    p.slot === 0 && p.name !== "Talent Coach" ? { ...p, name: "Talent Coach" } : p
  );

  return NextResponse.json({
    success: true,
    data: fixedResult,
    tier,
    tierExpiresAt: tierExpiresAt?.toISOString() ?? null,
    maxSlots,
  });
}

// POST /api/partners — Create a custom partner
export async function POST(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createPartnerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Tier-based slot limits
  const { tier } = await getUserTier(auth.sub);
  const maxCustomSlots = SLOT_LIMITS[tier];

  // Find next available slot
  const existing = await db
    .select({ slot: partners.slot })
    .from(partners)
    .where(eq(partners.userId, auth.sub));

  const usedSlots = new Set(existing.map((p) => p.slot));
  let nextSlot: number | null = null;
  for (let i = 1; i <= maxCustomSlots; i++) {
    if (!usedSlots.has(i)) {
      nextSlot = i;
      break;
    }
  }

  if (nextSlot === null) {
    return NextResponse.json(
      {
        success: false,
        error: tier === "free"
          ? "免费版最多1个自定义伙伴，升级Premium解锁更多"
          : "已达到伙伴数量上限",
        needsUpgrade: tier === "free",
      },
      { status: 409 }
    );
  }

  const { name, avatar, definition, modelId } = parsed.data;

  const newPartner = await db
    .insert(partners)
    .values({
      id: nanoid(),
      userId: auth.sub,
      slot: nextSlot,
      name,
      avatar,
      definition,
      modelId: modelId ?? null,
      memory: "",
    })
    .returning();

  return NextResponse.json({ success: true, data: newPartner[0] }, { status: 201 });
}
