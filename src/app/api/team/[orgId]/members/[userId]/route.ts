import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orgMembers, talentProfiles, testSessions } from "@/db/schema";
import { getAuthFromCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getUserOrgRole, requireOrgRole } from "@/lib/team";

const patchMemberSchema = z.object({
  displayName: z.string().max(80).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

/**
 * GET /api/team/:orgId/members/:userId — Per-member detail including latest
 * full talent profile (all 13 dimensions). Any org member may read; only
 * admin/coach see private notes.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orgId, userId } = await params;
    const viewerRole = await getUserOrgRole(auth.sub, orgId);
    if (!viewerRole) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const [member] = await db
      .select()
      .from(orgMembers)
      .where(
        and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId))
      )
      .limit(1);
    if (!member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    const [profile] = await db
      .select({
        id: talentProfiles.id,
        reactionSpeed: talentProfiles.reactionSpeed,
        handEyeCoord: talentProfiles.handEyeCoord,
        spatialAwareness: talentProfiles.spatialAwareness,
        memory: talentProfiles.memory,
        strategyLogic: talentProfiles.strategyLogic,
        rhythmSense: talentProfiles.rhythmSense,
        patternRecog: talentProfiles.patternRecog,
        multitasking: talentProfiles.multitasking,
        decisionSpeed: talentProfiles.decisionSpeed,
        emotionalControl: talentProfiles.emotionalControl,
        teamworkTendency: talentProfiles.teamworkTendency,
        riskAssessment: talentProfiles.riskAssessment,
        resourceMgmt: talentProfiles.resourceMgmt,
        overallScore: talentProfiles.overallScore,
        overallRank: talentProfiles.overallRank,
        archetypeId: talentProfiles.archetypeId,
        createdAt: talentProfiles.createdAt,
        sessionId: talentProfiles.sessionId,
      })
      .from(talentProfiles)
      .innerJoin(testSessions, eq(testSessions.id, talentProfiles.sessionId))
      .where(
        and(eq(talentProfiles.userId, userId), eq(testSessions.status, "completed"))
      )
      .orderBy(desc(talentProfiles.createdAt))
      .limit(1);

    const canSeeNotes = viewerRole === "admin" || viewerRole === "coach";

    return NextResponse.json({
      success: true,
      data: {
        member: {
          memberId: member.id,
          userId: member.userId,
          role: member.role,
          displayName: member.displayName,
          notes: canSeeNotes ? member.notes : null,
          addedAt: member.addedAt,
        },
        profile: profile ?? null,
        viewerRole,
      },
    });
  } catch (err) {
    logger.error("team.member.detail", "Load member detail failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to load member" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/team/:orgId/members/:userId — admin/coach edits per-member
 * metadata (displayName alias, private notes).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orgId, userId } = await params;
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

    const parsed = patchMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.displayName !== undefined)
      updates.displayName = parsed.data.displayName;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(orgMembers)
      .set(updates)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { member: updated },
    });
  } catch (err) {
    logger.error("team.member.patch", "Update member failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to update member" },
      { status: 500 }
    );
  }
}
