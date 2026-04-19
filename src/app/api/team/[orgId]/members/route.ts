import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orgInvites,
  orgMembers,
  organizations,
  users,
} from "@/db/schema";
import { getAuthFromCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getUserOrgRole, requireOrgRole } from "@/lib/team";

const roleEnum = z.enum(["admin", "coach", "player"]);

const addMemberSchema = z.object({
  email: z.string().email("Invalid email / 邮箱无效"),
  role: roleEnum.optional().default("player"),
  displayName: z.string().max(80).optional(),
});

const deleteMemberSchema = z.object({
  userId: z.string().min(1),
});

/** Invite TTL for auto-issued invites when email doesn't match an existing user. */
const INVITE_TTL_DAYS = 14;

// GET /api/team/:orgId/members — List members with latest score summary.
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

    const members = await db
      .select({
        memberId: orgMembers.id,
        userId: orgMembers.userId,
        role: orgMembers.role,
        displayName: orgMembers.displayName,
        addedAt: orgMembers.addedAt,
        username: users.username,
        userDisplayName: users.displayName,
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
      })
      .from(orgMembers)
      .innerJoin(users, eq(users.id, orgMembers.userId))
      .where(eq(orgMembers.orgId, orgId))
      .orderBy(desc(orgMembers.addedAt));

    return NextResponse.json({
      success: true,
      data: {
        members: members.map((m) => ({
          memberId: m.memberId,
          userId: m.userId,
          role: m.role,
          displayName: m.displayName ?? m.userDisplayName ?? m.username,
          username: m.username,
          addedAt: m.addedAt,
          latestOverallScore:
            m.latestOverallScore == null ? null : Number(m.latestOverallScore),
          latestOverallRank: m.latestOverallRank,
          latestArchetypeId: m.latestArchetypeId,
        })),
      },
    });
  } catch (err) {
    logger.error("team.members.list", "List members failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to list members" },
      { status: 500 }
    );
  }
}

// POST /api/team/:orgId/members — admin/coach adds a member by email.
//
// If an existing user has that email, they are added directly as an org member.
// Otherwise, an invite row is created and the invite URL is returned.
export async function POST(
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

    const hasRole = await requireOrgRole(auth.sub, orgId, "coach");
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

    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role, displayName } = parsed.data;

    // Coaches may not promote to admin; only admins can add admins.
    if (role === "admin") {
      const isAdmin = await requireOrgRole(auth.sub, orgId, "admin");
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: "Only admins may add admins" },
          { status: 403 }
        );
      }
    }

    // Respect max-members capacity.
    const [org] = await db
      .select({
        id: organizations.id,
        maxMembers: organizations.maxMembers,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    if (!org) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    const [{ count: memberCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orgMembers)
      .where(eq(orgMembers.orgId, orgId));
    if (Number(memberCount) >= org.maxMembers) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Team is at member capacity / 团队已达成员上限",
        },
        { status: 409 }
      );
    }

    // Does a user with this email already exist?
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      const uid = existingUser[0].id;

      // Already a member?
      const existingMember = await db
        .select({ id: orgMembers.id })
        .from(orgMembers)
        .where(
          and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, uid))
        )
        .limit(1);
      if (existingMember.length > 0) {
        return NextResponse.json(
          { success: false, error: "User is already a member of this team" },
          { status: 409 }
        );
      }

      const [member] = await db
        .insert(orgMembers)
        .values({
          id: nanoid(),
          orgId,
          userId: uid,
          role,
          displayName: displayName ?? null,
          addedAt: new Date(),
        })
        .returning();

      return NextResponse.json(
        {
          success: true,
          data: { type: "member" as const, member },
        },
        { status: 201 }
      );
    }

    // No user found — issue an invite.
    const token = nanoid(32);
    const expiresAt = new Date(
      Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    const [invite] = await db
      .insert(orgInvites)
      .values({
        id: nanoid(),
        orgId,
        email,
        role,
        token,
        expiresAt,
      })
      .returning();

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const inviteUrl = `${base}/team/invite/${token}`;

    return NextResponse.json(
      {
        success: true,
        data: { type: "invite" as const, invite, inviteUrl },
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error("team.members.add", "Add member failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to add member" },
      { status: 500 }
    );
  }
}

// DELETE /api/team/:orgId/members — admin removes a member by userId.
export async function DELETE(
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

    const parsed = deleteMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId } = parsed.data;

    // Can't remove the owner.
    const [org] = await db
      .select({ ownerId: organizations.ownerId })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    if (!org) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }
    if (org.ownerId === userId) {
      return NextResponse.json(
        { success: false, error: "Cannot remove the team owner" },
        { status: 409 }
      );
    }

    const deleted = await db
      .delete(orgMembers)
      .where(
        and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId))
      )
      .returning({ id: orgMembers.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("team.members.delete", "Remove member failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
