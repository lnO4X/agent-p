import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiTokens } from "@/db/schema";
import { getAuthFromCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { requireOrgRole } from "@/lib/team";
import { hashApiToken } from "@/lib/api-token-auth";

const createTokenSchema = z.object({
  name: z
    .string()
    .min(1, "Token name is required / 令牌名称不能为空")
    .max(80, "Token name must be at most 80 characters"),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

const deleteTokenSchema = z.object({
  tokenId: z.string().min(1),
});

/**
 * GET /api/team/:orgId/tokens — Admin lists API tokens.
 *
 * SECURITY: Raw tokens are NEVER returned; only metadata (name, timestamps).
 */
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

    const rows = await db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
        createdAt: apiTokens.createdAt,
        revokedAt: apiTokens.revokedAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.orgId, orgId))
      .orderBy(desc(apiTokens.createdAt));

    return NextResponse.json({
      success: true,
      data: { tokens: rows },
    });
  } catch (err) {
    logger.error("team.tokens.list", "List tokens failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to list API tokens" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/:orgId/tokens — Admin creates a new token.
 *
 * Returns the raw token string ONCE in the response body. The hash is stored
 * in the database; the raw value is never retrievable later.
 *
 * Token format: `gtn_<40-char-nanoid>` — the prefix makes leaked tokens easy
 * to identify in log scanners.
 */
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

    const parsed = createTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, expiresInDays } = parsed.data;

    // Generate a raw token. nanoid(40) gives 40 URL-safe chars.
    const rawToken = `gtn_${nanoid(40)}`;
    const tokenHash = hashApiToken(rawToken);

    const now = new Date();
    const expiresAt = expiresInDays
      ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const [inserted] = await db
      .insert(apiTokens)
      .values({
        id: nanoid(),
        orgId,
        name,
        tokenHash,
        expiresAt,
        createdAt: now,
      })
      .returning({
        id: apiTokens.id,
        name: apiTokens.name,
        expiresAt: apiTokens.expiresAt,
        createdAt: apiTokens.createdAt,
      });

    return NextResponse.json(
      {
        success: true,
        data: {
          token: inserted,
          // IMPORTANT: Only returned ONCE — not stored anywhere else in cleartext.
          rawToken,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error("team.tokens.create", "Create token failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to create API token" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/:orgId/tokens — Admin revokes a token by id.
 * Sets `revokedAt = now` so subsequent validateApiToken() calls reject it.
 */
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

    const parsed = deleteTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tokenId } = parsed.data;

    const updated = await db
      .update(apiTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.orgId, orgId)))
      .returning({ id: apiTokens.id });

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: "Token not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("team.tokens.revoke", "Revoke token failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to revoke API token" },
      { status: 500 }
    );
  }
}
