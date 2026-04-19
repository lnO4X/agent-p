import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { orgInvites } from "@/db/schema";
import { getAuthFromCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { requireOrgRole } from "@/lib/team";

const roleEnum = z.enum(["admin", "coach", "player"]);

const createInviteSchema = z.object({
  email: z.string().email("Invalid email / 邮箱无效"),
  role: roleEnum.optional().default("player"),
  ttlDays: z.number().int().min(1).max(60).optional().default(14),
});

// GET /api/team/:orgId/invites — admins list pending (not yet accepted, not expired) invites.
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
    const hasRole = await requireOrgRole(auth.sub, orgId, "admin");
    if (!hasRole) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const now = new Date();
    const rows = await db
      .select()
      .from(orgInvites)
      .where(
        and(
          eq(orgInvites.orgId, orgId),
          isNull(orgInvites.acceptedAt)
        )
      )
      .orderBy(desc(orgInvites.createdAt));

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    return NextResponse.json({
      success: true,
      data: {
        invites: rows.map((r) => ({
          id: r.id,
          email: r.email,
          role: r.role,
          token: r.token,
          expiresAt: r.expiresAt,
          createdAt: r.createdAt,
          expired: r.expiresAt < now,
          inviteUrl: `${base}/team/invite/${r.token}`,
        })),
      },
    });
  } catch (err) {
    logger.error("team.invites.list", "List invites failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to list invites" },
      { status: 500 }
    );
  }
}

// POST /api/team/:orgId/invites — admin creates a new invite and returns the URL.
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

    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role, ttlDays } = parsed.data;

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

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
      { success: true, data: { invite, token, inviteUrl } },
      { status: 201 }
    );
  } catch (err) {
    logger.error("team.invites.create", "Create invite failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
