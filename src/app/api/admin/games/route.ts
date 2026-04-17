import { NextRequest } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/admin";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq, sql, ilike, or, desc, asc } from "drizzle-orm";
import { z } from "zod";

const patchGameSchema = z.object({
  gameId: z.string().min(1),
  status: z.enum(["active", "hidden", "pending"]).optional(),
  popularity: z.number().optional(),
  rating: z.number().optional(),
});

/**
 * GET /api/admin/games — List games with search, filter, pagination
 *
 * Query params: ?search=&status=all|active|hidden|pending&source=all|seed|steam|taptap|manual|boardgame&page=1&limit=20&sort=name|popularity|rating
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
  const statusFilter = searchParams.get("status") || "all";
  const sourceFilter = searchParams.get("source") || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const sort = searchParams.get("sort") || "name";
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(games.name, `%${search}%`),
        ilike(games.nameEn, `%${search}%`),
        ilike(games.slug, `%${search}%`)
      )!
    );
  }
  if (statusFilter !== "all") {
    conditions.push(eq(games.status, statusFilter as "active" | "hidden" | "pending"));
  }
  if (sourceFilter !== "all") {
    conditions.push(eq(games.sourceType, sourceFilter as "seed" | "steam" | "taptap" | "boardgame" | "manual"));
  }

  const whereClause = conditions.length > 0
    ? sql`${sql.join(conditions, sql` AND `)}`
    : undefined;

  // Sort
  const orderBy = sort === "popularity"
    ? desc(games.popularity)
    : sort === "rating"
      ? desc(games.rating)
      : asc(games.name);

  const [gameList, totalResult] = await Promise.all([
    db
      .select({
        id: games.id,
        name: games.name,
        nameEn: games.nameEn,
        slug: games.slug,
        status: games.status,
        sourceType: games.sourceType,
        popularity: games.popularity,
        rating: games.rating,
        genres: games.genres,
        platforms: games.platforms,
        coverUrl: games.coverUrl,
        createdAt: games.createdAt,
      })
      .from(games)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .where(whereClause),
  ]);

  return Response.json({
    success: true,
    data: {
      games: gameList,
      total: Number(totalResult[0]?.count ?? 0),
      page,
      limit,
    },
  });
}

/**
 * PATCH /api/admin/games — Update game status or metadata
 *
 * Body: { gameId, status?, popularity?, rating? }
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

  const parsed = patchGameSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: "Invalid request: " + JSON.stringify(parsed.error.flatten()) },
      { status: 400 }
    );
  }
  const validated = parsed.data;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (validated.status) {
    updates.status = validated.status;
  }
  if (typeof validated.popularity === "number") {
    updates.popularity = validated.popularity;
  }
  if (typeof validated.rating === "number") {
    updates.rating = validated.rating;
  }

  await db.update(games).set(updates).where(eq(games.id, validated.gameId));

  return Response.json({ success: true });
}
