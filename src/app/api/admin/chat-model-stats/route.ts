import { NextRequest } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/admin";
import { db } from "@/db";
import { chatFeedback } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * GET /api/admin/chat-model-stats
 *
 * Returns per-model chat ratings for A/B comparison.
 * Response: { success: true, data: { models: ModelStat[], totalRatings: number } }
 */
export interface ModelStat {
  modelId: string;
  count: number;
  avgRating: number;
  dist: number[]; // [1-star count, 2-star, 3-star, 4-star, 5-star]
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminOrCronSecret(
    request.headers.get("authorization")
  );
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.execute(sql`
    SELECT
      COALESCE(model_id, 'unknown') AS model_id,
      COUNT(*)::int AS count,
      ROUND(AVG(rating)::numeric, 2) AS avg_rating,
      COUNT(CASE WHEN rating = 1 THEN 1 END)::int AS r1,
      COUNT(CASE WHEN rating = 2 THEN 1 END)::int AS r2,
      COUNT(CASE WHEN rating = 3 THEN 1 END)::int AS r3,
      COUNT(CASE WHEN rating = 4 THEN 1 END)::int AS r4,
      COUNT(CASE WHEN rating = 5 THEN 1 END)::int AS r5
    FROM ${chatFeedback}
    GROUP BY COALESCE(model_id, 'unknown')
    ORDER BY count DESC
  `);

  const models: ModelStat[] = (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    modelId: String(r.model_id),
    count: Number(r.count),
    avgRating: Number(r.avg_rating),
    dist: [Number(r.r1), Number(r.r2), Number(r.r3), Number(r.r4), Number(r.r5)],
  }));

  const totalRatings = models.reduce((sum, m) => sum + m.count, 0);

  return Response.json({ success: true, data: { models, totalRatings } });
}
