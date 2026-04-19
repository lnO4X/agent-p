import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orgMembers,
  organizations,
  talentProfiles,
  testSessions,
  users,
} from "@/db/schema";
import { getAuthFromCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getUserOrgRole } from "@/lib/team";
import { toCsv } from "@/lib/csv";
import { TALENT_CATEGORIES } from "@/types/talent";

/**
 * CSV export of team members with their most-recent cognitive profile.
 *
 * Auth: any org member (admin / coach / player). Rows restricted to members of the org.
 * Query params:
 *   dims=all      → all 13 talent dimensions (default)
 *   dims=standard → reaction_speed, hand_eye_coord, spatial_awareness, memory, strategy_logic, decision_speed
 *   dims=quick    → reaction_speed, decision_speed, memory
 *
 * One row per member. Members without a completed profile still appear; cognitive
 * columns are empty strings for them.
 */

type DimMode = "all" | "standard" | "quick";

const DIM_PRESETS: Record<DimMode, readonly string[]> = {
  all: TALENT_CATEGORIES,
  standard: [
    "reaction_speed",
    "hand_eye_coord",
    "spatial_awareness",
    "memory",
    "strategy_logic",
    "decision_speed",
  ],
  quick: ["reaction_speed", "decision_speed", "memory"],
};

function parseDimMode(value: string | null): DimMode {
  if (value === "standard" || value === "quick") return value;
  return "all";
}

/** DB column name for each snake-case dimension (schema uses camelCase). */
const DIM_TO_COLUMN: Record<string, keyof typeof talentProfiles.$inferSelect> = {
  reaction_speed: "reactionSpeed",
  hand_eye_coord: "handEyeCoord",
  spatial_awareness: "spatialAwareness",
  memory: "memory",
  strategy_logic: "strategyLogic",
  rhythm_sense: "rhythmSense",
  pattern_recog: "patternRecog",
  multitasking: "multitasking",
  decision_speed: "decisionSpeed",
  emotional_control: "emotionalControl",
  teamwork_tendency: "teamworkTendency",
  risk_assessment: "riskAssessment",
  resource_mgmt: "resourceMgmt",
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(
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
    const role = await getUserOrgRole(auth.sub, orgId);
    if (!role) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const mode = parseDimMode(url.searchParams.get("dims"));
    const dimKeys = DIM_PRESETS[mode];

    // Load org metadata for filename.
    const [org] = await db
      .select({ slug: organizations.slug, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    if (!org) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // One row per org member. Left-join into the most-recent completed
    // talent_profile via a lateral subquery that returns the profile id.
    // We then load those profiles in a second query to keep the JOIN simple.
    const memberRows = await db
      .select({
        memberId: orgMembers.id,
        userId: orgMembers.userId,
        role: orgMembers.role,
        memberDisplayName: orgMembers.displayName,
        username: users.username,
        userDisplayName: users.displayName,
        latestProfileId: sql<string | null>`(
          SELECT tp.id FROM talent_profiles tp
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

    // Fetch the profiles that exist.
    const profileIds = memberRows
      .map((m) => m.latestProfileId)
      .filter((id): id is string => !!id);
    const profileRows =
      profileIds.length === 0
        ? []
        : await db
            .select()
            .from(talentProfiles)
            .where(
              sql`${talentProfiles.id} IN (${sql.join(
                profileIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            );

    const profilesById = new Map<
      string,
      typeof profileRows[number]
    >();
    for (const p of profileRows) profilesById.set(p.id, p);

    // Fetch the associated session (for tested_at timestamp).
    const sessionIds = profileRows.map((p) => p.sessionId);
    const sessionRows =
      sessionIds.length === 0
        ? []
        : await db
            .select({
              id: testSessions.id,
              completedAt: testSessions.completedAt,
            })
            .from(testSessions)
            .where(
              sql`${testSessions.id} IN (${sql.join(
                sessionIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            );
    const sessionById = new Map<string, (typeof sessionRows)[number]>();
    for (const s of sessionRows) sessionById.set(s.id, s);

    // Build headers
    const baseHeaders = [
      "member_id",
      "display_name",
      "username",
      "role",
      "tested_at",
      "archetype",
      "overall",
      "overall_rank",
    ];
    const headers = [...baseHeaders, ...dimKeys];

    // Build rows
    const rows = memberRows.map((m) => {
      const displayName =
        m.memberDisplayName ?? m.userDisplayName ?? m.username;
      const profile = m.latestProfileId
        ? profilesById.get(m.latestProfileId) ?? null
        : null;
      const session = profile ? sessionById.get(profile.sessionId) ?? null : null;

      const row: Record<string, unknown> = {
        member_id: m.memberId,
        display_name: displayName,
        username: m.username,
        role: m.role,
        tested_at: session?.completedAt
          ? new Date(session.completedAt).toISOString()
          : "",
        archetype: profile?.archetypeId ?? "",
        overall:
          profile?.overallScore != null
            ? Number(profile.overallScore).toFixed(1)
            : "",
        overall_rank: profile?.overallRank ?? "",
      };

      for (const dim of dimKeys) {
        const colKey = DIM_TO_COLUMN[dim];
        if (!profile || !colKey) {
          row[dim] = "";
          continue;
        }
        const v = profile[colKey] as number | null | undefined;
        row[dim] = v == null ? "" : Number(v).toFixed(1);
      }
      return row;
    });

    const csv = toCsv(headers, rows);

    const filename = `gametan-team-${org.slug}-${isoDate(new Date())}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    logger.error("team.export.csv", "CSV export failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to export CSV" },
      { status: 500 }
    );
  }
}
