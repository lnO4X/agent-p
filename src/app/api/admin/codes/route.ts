import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { activationCodes, users } from "@/db/schema";
import { requireAdminOrCronSecret } from "@/lib/admin";
import { desc, eq, isNull, isNotNull, sql } from "drizzle-orm";

function generateCode(): string {
  // 8 char alphanumeric uppercase (no ambiguous chars: 0/O, 1/I/L)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * GET /api/admin/codes — List activation codes
 *
 * Query params: ?status=all|used|unused&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminOrCronSecret(
    request.headers.get("authorization")
  );
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
  const offset = (page - 1) * limit;

  const whereClause =
    status === "used"
      ? isNotNull(activationCodes.usedBy)
      : status === "unused"
        ? isNull(activationCodes.usedBy)
        : undefined;

  const [codeList, totalResult] = await Promise.all([
    db
      .select({
        id: activationCodes.id,
        code: activationCodes.code,
        tier: activationCodes.tier,
        durationDays: activationCodes.durationDays,
        usedBy: activationCodes.usedBy,
        usedByUsername: sql<string>`(SELECT username FROM users WHERE id = ${activationCodes.usedBy})`,
        usedAt: activationCodes.usedAt,
        createdAt: activationCodes.createdAt,
        expiresAt: activationCodes.expiresAt,
      })
      .from(activationCodes)
      .where(whereClause)
      .orderBy(desc(activationCodes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(activationCodes)
      .where(whereClause),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      codes: codeList,
      total: Number(totalResult[0]?.count ?? 0),
      page,
      limit,
    },
  });
}

/**
 * POST /api/admin/codes — Generate activation codes
 *
 * Body: { count?: number, durationDays?: number }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminOrCronSecret(
    request.headers.get("authorization")
  );
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const count = Math.min(Number(body.count) || 1, 50);
  const durationDays = Number(body.durationDays) || 30;

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = generateCode();
    const id = nanoid();
    await db.insert(activationCodes).values({
      id,
      code,
      tier: "premium",
      durationDays,
    });
    codes.push(code);
  }

  return NextResponse.json({
    success: true,
    data: { codes, durationDays },
  });
}
