import { NextRequest } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/admin";
import { db } from "@/db";
import { users, testSessions, partners } from "@/db/schema";
import { eq, sql, ilike, or, desc } from "drizzle-orm";
import { z } from "zod";

const patchUserSchema = z.object({
  userId: z.string().min(1),
  tier: z.enum(["free", "premium"]).optional(),
  isAdmin: z.boolean().optional(),
});

/**
 * GET /api/admin/users — List users with search & pagination
 *
 * Query params: ?search=&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminOrCronSecret(
    request.headers.get("authorization")
  );
  if (!auth) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  // Build where clause
  const whereClause = search
    ? or(
        ilike(users.username, `%${search}%`),
        ilike(users.displayName, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    : undefined;

  const [userList, totalResult] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        tier: users.tier,
        tierExpiresAt: users.tierExpiresAt,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        sessionCount: sql<number>`(SELECT count(*) FROM test_sessions WHERE user_id = ${users.id} AND status = 'completed')`,
        partnerCount: sql<number>`(SELECT count(*) FROM partners WHERE user_id = ${users.id})`,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause),
  ]);

  return Response.json({
    success: true,
    data: {
      users: userList.map((u) => ({
        ...u,
        sessionCount: Number(u.sessionCount),
        partnerCount: Number(u.partnerCount),
      })),
      total: Number(totalResult[0]?.count ?? 0),
      page,
      limit,
    },
  });
}

/**
 * PATCH /api/admin/users — Update user tier or admin status
 *
 * Body: { userId, tier?, isAdmin? }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminOrCronSecret(
    request.headers.get("authorization")
  );
  if (!auth) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchUserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: "Invalid request: " + JSON.stringify(parsed.error.flatten()) },
      { status: 400 }
    );
  }
  const validated = parsed.data;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (validated.tier === "free" || validated.tier === "premium") {
    updates.tier = validated.tier;
    if (validated.tier === "premium") {
      // Set 30 days premium
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      updates.tierExpiresAt = expires;
    }
  }
  if (typeof validated.isAdmin === "boolean") {
    updates.isAdmin = validated.isAdmin;
  }

  await db.update(users).set(updates).where(eq(users.id, validated.userId));

  return Response.json({ success: true });
}
