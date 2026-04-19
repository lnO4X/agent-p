import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  orgInvites,
  orgMembers,
  organizations,
} from "@/db/schema";
import { getAuthFromCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";

type InviteStatus = "valid" | "expired" | "used" | "not_found";

async function loadInvite(token: string) {
  const rows = await db
    .select({
      id: orgInvites.id,
      orgId: orgInvites.orgId,
      email: orgInvites.email,
      role: orgInvites.role,
      expiresAt: orgInvites.expiresAt,
      acceptedAt: orgInvites.acceptedAt,
      orgName: organizations.name,
      orgSlug: organizations.slug,
    })
    .from(orgInvites)
    .innerJoin(organizations, eq(organizations.id, orgInvites.orgId))
    .where(eq(orgInvites.token, token))
    .limit(1);
  return rows[0] ?? null;
}

function inviteStatus(invite: {
  expiresAt: Date;
  acceptedAt: Date | null;
}): InviteStatus {
  if (invite.acceptedAt) return "used";
  if (invite.expiresAt < new Date()) return "expired";
  return "valid";
}

// GET /api/team/invite/:token — Public metadata about the invite.
// Used by the accept page so users see the org name + role before logging in.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invite = await loadInvite(token);
    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invite not found" },
        { status: 404 }
      );
    }

    const status = inviteStatus(invite);

    return NextResponse.json({
      success: true,
      data: {
        orgId: invite.orgId,
        orgName: invite.orgName,
        orgSlug: invite.orgSlug,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        status,
      },
    });
  } catch (err) {
    logger.error("team.invite.get", "Load invite failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to load invite" },
      { status: 500 }
    );
  }
}

// POST /api/team/invite/:token — Accept the invite (requires an authenticated user).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { token } = await params;
    const invite = await loadInvite(token);
    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invite not found" },
        { status: 404 }
      );
    }

    const status = inviteStatus(invite);
    if (status === "expired") {
      return NextResponse.json(
        { success: false, error: "Invite has expired" },
        { status: 400 }
      );
    }
    if (status === "used") {
      return NextResponse.json(
        { success: false, error: "Invite has already been used" },
        { status: 400 }
      );
    }

    // Already a member? Treat as idempotent success (still mark invite used).
    const existing = await db
      .select({ id: orgMembers.id })
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, invite.orgId),
          eq(orgMembers.userId, auth.sub)
        )
      )
      .limit(1);

    const now = new Date();

    if (existing.length === 0) {
      await db.insert(orgMembers).values({
        id: nanoid(),
        orgId: invite.orgId,
        userId: auth.sub,
        role: invite.role,
        addedAt: now,
      });
    }

    await db
      .update(orgInvites)
      .set({ acceptedAt: now })
      .where(eq(orgInvites.id, invite.id));

    return NextResponse.json({
      success: true,
      data: {
        orgId: invite.orgId,
        orgSlug: invite.orgSlug,
        role: invite.role,
        alreadyMember: existing.length > 0,
      },
    });
  } catch (err) {
    logger.error("team.invite.accept", "Accept invite failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
