import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { organizations, orgMembers, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getUserOrgRole, requireOrgRole } from "@/lib/team";

const patchOrgSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  plan: z.enum(["starter", "pro", "enterprise", "beta"]).optional(),
  maxMembers: z.number().int().min(1).max(10000).optional(),
});

// GET /api/team/:orgId — Org detail + member list with latest score summary per member.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orgId } = await params;

    const role = await getUserOrgRole(auth.sub, orgId);
    if (!role) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const [orgRows, memberRows] = await Promise.all([
      db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1),
      // Member list with joined user info + latest completed session profile.
      // Uses a lateral-style subquery via SQL to pick the newest talentProfile row.
      db
        .select({
          memberId: orgMembers.id,
          userId: orgMembers.userId,
          role: orgMembers.role,
          displayName: orgMembers.displayName,
          notes: orgMembers.notes,
          addedAt: orgMembers.addedAt,
          username: users.username,
          userDisplayName: users.displayName,
          email: users.email,
          latestOverallScore: sql<number | null>`(
            SELECT tp.overall_score FROM talent_profiles tp
            INNER JOIN test_sessions ts ON ts.id = tp.session_id
            WHERE tp.user_id = ${orgMembers.userId}
              AND ts.status = 'completed'
            ORDER BY tp.created_at DESC
            LIMIT 1
          )`,
          latestOverallRank: sql<string | null>`(
            SELECT tp.overall_rank FROM talent_profiles tp
            INNER JOIN test_sessions ts ON ts.id = tp.session_id
            WHERE tp.user_id = ${orgMembers.userId}
              AND ts.status = 'completed'
            ORDER BY tp.created_at DESC
            LIMIT 1
          )`,
          latestArchetypeId: sql<string | null>`(
            SELECT tp.archetype_id FROM talent_profiles tp
            INNER JOIN test_sessions ts ON ts.id = tp.session_id
            WHERE tp.user_id = ${orgMembers.userId}
              AND ts.status = 'completed'
            ORDER BY tp.created_at DESC
            LIMIT 1
          )`,
          latestSessionAt: sql<Date | null>`(
            SELECT tp.created_at FROM talent_profiles tp
            INNER JOIN test_sessions ts ON ts.id = tp.session_id
            WHERE tp.user_id = ${orgMembers.userId}
              AND ts.status = 'completed'
            ORDER BY tp.created_at DESC
            LIMIT 1
          )`,
        })
        .from(orgMembers)
        .innerJoin(users, eq(users.id, orgMembers.userId))
        .where(eq(orgMembers.orgId, orgId))
        .orderBy(desc(orgMembers.addedAt)),
    ]);

    if (orgRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        org: orgRows[0],
        viewerRole: role,
        members: memberRows.map((m) => ({
          memberId: m.memberId,
          userId: m.userId,
          role: m.role,
          displayName: m.displayName ?? m.userDisplayName ?? m.username,
          notes: role === "admin" || role === "coach" ? m.notes : null,
          addedAt: m.addedAt,
          email: role === "admin" ? m.email : null,
          username: m.username,
          latestOverallScore:
            m.latestOverallScore == null ? null : Number(m.latestOverallScore),
          latestOverallRank: m.latestOverallRank,
          latestArchetypeId: m.latestArchetypeId,
          latestSessionAt: m.latestSessionAt,
        })),
      },
    });
  } catch (err) {
    logger.error("team.detail", "Get org detail failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to load team" },
      { status: 500 }
    );
  }
}

// PATCH /api/team/:orgId — Admin updates org metadata.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orgId } = await params;

    const hasRole = await requireOrgRole(auth.sub, orgId, "admin");
    if (!hasRole) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
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

    const parsed = patchOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.plan !== undefined) updates.plan = parsed.data.plan;
    if (parsed.data.maxMembers !== undefined)
      updates.maxMembers = parsed.data.maxMembers;

    const [updated] = await db
      .update(organizations)
      .set(updates)
      .where(eq(organizations.id, orgId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { org: updated } });
  } catch (err) {
    logger.error("team.patch", "Update org failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to update team" },
      { status: 500 }
    );
  }
}

// DELETE /api/team/:orgId — Only the owner may delete. Cascades to members/invites/tokens.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orgId } = await params;

    const orgRows = await db
      .select({ id: organizations.id, ownerId: organizations.ownerId })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (orgRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    if (orgRows[0].ownerId !== auth.sub) {
      return NextResponse.json(
        { success: false, error: "Only the owner may delete this team" },
        { status: 403 }
      );
    }

    // Owner is the only one who can delete. Remove owner's orgMembers row first
    // so the FK restrict on ownerId clears via cascade of dependent rows, then
    // finally the org itself. Postgres handles cascade on FKs referencing
    // organizations.id; we must clear the owner reference last by deleting the org.
    //
    // Because owner_id has onDelete:"restrict", we must delete org via the org row;
    // the restrict only fires when deleting the USER, not the org.
    await db.delete(organizations).where(eq(organizations.id, orgId));

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("team.delete", "Delete org failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
