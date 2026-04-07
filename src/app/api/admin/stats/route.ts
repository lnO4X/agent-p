import { NextRequest } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/admin";
import { db } from "@/db";
import { users, testSessions, partners } from "@/db/schema";
import { eq, sql, gte } from "drizzle-orm";

/**
 * GET /api/admin/stats — Aggregate dashboard statistics
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminOrCronSecret(
    request.headers.get("authorization")
  );
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsersResult,
    premiumUsersResult,
    registeredTodayResult,
    totalSessionsResult,
    totalPartnersResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.tier, "premium")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, today)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(testSessions)
      .where(eq(testSessions.status, "completed")),
    db.select({ count: sql<number>`count(*)` }).from(partners),
  ]);

  return Response.json({
    success: true,
    data: {
      totalUsers: Number(totalUsersResult[0]?.count ?? 0),
      premiumUsers: Number(premiumUsersResult[0]?.count ?? 0),
      registeredToday: Number(registeredTodayResult[0]?.count ?? 0),
      totalSessions: Number(totalSessionsResult[0]?.count ?? 0),
      totalPartners: Number(totalPartnersResult[0]?.count ?? 0),
    },
  });
}
