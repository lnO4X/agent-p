import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { partners } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updatePartnerSchema } from "@/lib/validations";

// GET /api/partners/[id] — Get a single partner (fast, for chat page)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const result = await db
    .select({
      id: partners.id,
      slot: partners.slot,
      name: partners.name,
      avatar: partners.avatar,
      modelId: partners.modelId,
      definition: partners.definition,
      memory: partners.memory,
    })
    .from(partners)
    .where(and(eq(partners.id, id), eq(partners.userId, auth.sub)))
    .limit(1);
  if (result.length === 0) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: result[0] });
}

// PUT /api/partners/[id] — Update a partner
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();
  const parsed = updatePartnerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verify ownership
  const existing = await db
    .select({ id: partners.id, slot: partners.slot })
    .from(partners)
    .where(and(eq(partners.id, id), eq(partners.userId, auth.sub)))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  const { name, avatar, definition, modelId } = parsed.data;
  if (name !== undefined) updateData.name = name;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (definition !== undefined) updateData.definition = definition;
  if (modelId !== undefined) updateData.modelId = modelId;

  const updated = await db
    .update(partners)
    .set(updateData)
    .where(and(eq(partners.id, id), eq(partners.userId, auth.sub)))
    .returning();

  return NextResponse.json({ success: true, data: updated[0] });
}

// DELETE /api/partners/[id] — Delete a custom partner (slot != 0)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership and check it's not the built-in Weda coach (slot=0)
  const existing = await db
    .select({ id: partners.id, slot: partners.slot })
    .from(partners)
    .where(and(eq(partners.id, id), eq(partners.userId, auth.sub)))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  if (existing[0].slot === 0) {
    return NextResponse.json(
      { error: "无法删除内置伙伴" },
      { status: 403 }
    );
  }

  await db
    .delete(partners)
    .where(and(eq(partners.id, id), eq(partners.userId, auth.sub)));

  return NextResponse.json({ success: true });
}
