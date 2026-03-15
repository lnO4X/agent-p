import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { partners, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createPartnerSchema } from "@/lib/validations";
import { WEDA_DEFINITION } from "@/lib/partner-prompts";

/** Tier-based slot limits: free=1 custom, premium=5 custom */
const SLOT_LIMITS = { free: 1, premium: 5 } as const;

async function getUserTier(userId: string): Promise<"free" | "premium"> {
  const result = await db
    .select({ tier: users.tier, tierExpiresAt: users.tierExpiresAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (result.length === 0) return "free";
  const user = result[0];
  if (user.tier === "premium") {
    // Check if premium has expired
    if (user.tierExpiresAt && user.tierExpiresAt < new Date()) {
      return "free";
    }
    return "premium";
  }
  return "free";
}

/**
 * Ensure Weda (slot=0) exists for user. Lazily created on first access.
 * Uses INSERT ... ON CONFLICT DO NOTHING — safe for concurrent calls.
 */
async function ensureWeda(userId: string) {
  await db
    .insert(partners)
    .values({
      id: nanoid(),
      userId,
      slot: 0,
      name: "Weda",
      avatar: "Bot",
      definition: WEDA_DEFINITION,
      memory: "",
    })
    .onConflictDoNothing();
}

// GET /api/partners — List user's partners (auto-creates Weda)
export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure Weda exists
  await ensureWeda(auth.sub);

  const [result, tier] = await Promise.all([
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

  const maxSlots = 1 + SLOT_LIMITS[tier]; // 1 (Weda) + custom slots

  return NextResponse.json({ success: true, data: result, tier, maxSlots });
}

// POST /api/partners — Create a custom partner
export async function POST(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createPartnerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Tier-based slot limits
  const tier = await getUserTier(auth.sub);
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
