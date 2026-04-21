import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { orgInvites, organizations, users } from "@/db/schema";
import { getAuthFromCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { requireOrgRole } from "@/lib/team";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

interface InviteEmailOpts {
  to: string;
  inviterName: string;
  orgName: string;
  role: "admin" | "coach" | "player";
  inviteUrl: string;
}

function inviteEmailHtml(opts: InviteEmailOpts): string {
  const { inviterName, orgName, role, inviteUrl } = opts;
  const zhRole =
    role === "admin" ? "管理员" : role === "coach" ? "教练" : "成员";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 12px; font-size: 18px; color: #111;">
      ${inviterName} 邀请你加入 ${orgName} / You've been invited to ${orgName}
    </h2>
    <p style="font-size: 14px; color: #333; margin: 0 0 16px;">
      ${inviterName} 邀请你以 <strong>${zhRole}</strong> 身份加入 ${orgName}。接受邀请后即可查看团队认知图谱看板。<br><br>
      ${inviterName} has invited you to join <strong>${orgName}</strong> as a ${role} on GameTan. Accept the invite to view your team's cognitive profile dashboard.
    </p>
    <a href="${inviteUrl}" style="display: inline-block; background: #00D4AA; color: white; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
      接受邀请 / Accept invite
    </a>
    <p style="margin: 16px 0 0; font-size: 11px; color: #999;">
      如果你不认识邀请人，请忽略此邮件。/ If you don't recognise the sender, please ignore this email.
    </p>
    <p style="margin: 8px 0 0; font-size: 11px; color: #999;">GameTan · gametan.ai</p>
  </div>
</body>
</html>`;
}

/**
 * Fire-and-log invite email. Never throws — failures are logged but don't
 * break the invite creation flow (the URL is still returned to the caller
 * so an admin can copy it manually if email is down).
 */
async function sendInviteEmail(opts: InviteEmailOpts): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    if (process.env.NODE_ENV !== "production") {
      logger.info(
        "team.invites.email",
        "RESEND_API_KEY missing, skipping send",
        { to: opts.to }
      );
    }
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GameTan <noreply@gametan.ai>",
        to: opts.to,
        subject: `${opts.inviterName} 邀请你加入 ${opts.orgName} / You've been invited to ${opts.orgName} — GameTan`,
        html: inviteEmailHtml(opts),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "<unreadable>");
      logger.error("team.invites.email", "Resend non-2xx", undefined, {
        status: res.status,
        body: body.slice(0, 200),
        to: opts.to,
      });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("team.invites.email", "Resend dispatch failed", err, {
      to: opts.to,
    });
    return false;
  }
}

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

    const inviteUrl = `${BASE_URL}/team/invite/${token}`;

    // Look up org name + inviter display name for a readable email body.
    // If either lookup fails we still send with a sensible fallback — never
    // block the invite creation over an email nicety.
    let orgName = "GameTan team";
    let inviterName = "A teammate";
    try {
      const [orgRow] = await db
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
      if (orgRow?.name) orgName = orgRow.name;
    } catch (err) {
      logger.warn("team.invites.orgLookup", "Org lookup failed", {
        orgId,
        err: String(err),
      });
    }
    try {
      const [inviterRow] = await db
        .select({
          displayName: users.displayName,
          username: users.username,
        })
        .from(users)
        .where(eq(users.id, auth.sub))
        .limit(1);
      if (inviterRow) {
        inviterName = inviterRow.displayName || inviterRow.username || inviterName;
      }
    } catch (err) {
      logger.warn("team.invites.inviterLookup", "Inviter lookup failed", {
        userId: auth.sub,
        err: String(err),
      });
    }

    // Fire the invite email. Best-effort — failures are logged but we still
    // return 201 so the admin sees the URL and the invite row is persisted.
    const emailSent = await sendInviteEmail({
      to: email,
      inviterName,
      orgName,
      role,
      inviteUrl,
    });

    return NextResponse.json(
      {
        success: true,
        data: { invite, token, inviteUrl, emailSent },
      },
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
