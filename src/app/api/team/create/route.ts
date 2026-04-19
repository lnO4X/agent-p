import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { organizations, orgMembers } from "@/db/schema";
import { getAuthFromCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { ensureUniqueSlug, slugify } from "@/lib/team";

const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Team name must be at least 2 characters / 团队名称至少2个字符")
    .max(80, "Team name must be at most 80 characters / 团队名称最多80个字符"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens")
    .min(2)
    .max(60)
    .optional(),
});

// POST /api/team/create — Create a new organization with the current user as owner+admin.
export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const parsed = createOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug: rawSlug } = parsed.data;
    const baseSlug = rawSlug ? rawSlug : slugify(name);
    if (!baseSlug) {
      return NextResponse.json(
        { success: false, error: "Unable to derive slug from name" },
        { status: 400 }
      );
    }

    const finalSlug = await ensureUniqueSlug(baseSlug, () =>
      nanoid(6).toLowerCase().replace(/[^a-z0-9]/g, "")
    );

    const orgId = nanoid();
    const now = new Date();

    const [org] = await db
      .insert(organizations)
      .values({
        id: orgId,
        name,
        slug: finalSlug,
        plan: "beta",
        ownerId: auth.sub,
        maxMembers: 10,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db.insert(orgMembers).values({
      id: nanoid(),
      orgId,
      userId: auth.sub,
      role: "admin",
      addedAt: now,
    });

    return NextResponse.json(
      { success: true, data: { org } },
      { status: 201 }
    );
  } catch (err) {
    logger.error("team.create", "Create org failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to create team" },
      { status: 500 }
    );
  }
}
