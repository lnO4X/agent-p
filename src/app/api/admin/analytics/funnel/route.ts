import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/admin";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * Completion-rate funnel query shapes.
 *
 * Per-game:  { gameId, starts, completes, aborts, completionPct }
 * Per-tier:  { tier, quizStarts, quizCompletes, completionPct }
 *
 * Window defaults to 7 days; callers may pass `?days=30` (1–90 clamped).
 *
 * Data source: `analytics_events` table. The per-game events (game_start,
 * game_complete, game_abort) carry `props.gameId` and `props.tier`. The
 * per-tier events (quiz_start, quiz_complete) carry `props.tier` (and for
 * quiz_start a legacy `props.mode` that was previously the tier name).
 */

type Row = Record<string, unknown>;

function rows(result: unknown): Array<Row> {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows: Array<Row> }).rows;
  }
  return [];
}

interface GameFunnelRow {
  gameId: string;
  starts: number;
  completes: number;
  aborts: number;
  completionPct: number;
}

interface TierFunnelRow {
  tier: string;
  quizStarts: number;
  quizCompletes: number;
  completionPct: number;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminOrCronSecret(
    request.headers.get("authorization")
  );
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const rawDays = Number(url.searchParams.get("days") ?? "7");
    const days = Number.isFinite(rawDays)
      ? Math.min(90, Math.max(1, Math.round(rawDays)))
      : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Per-game counts: one row per (gameId, event) pair pivoted in SQL.
    const gameRowsRaw = rows(
      await db.execute(sql`
        SELECT
          props->>'gameId' AS game_id,
          event AS event_type,
          COUNT(*) AS count
        FROM analytics_events
        WHERE event IN ('game_start', 'game_complete', 'game_abort')
          AND created_at >= ${since}::timestamp
          AND props->>'gameId' IS NOT NULL
        GROUP BY props->>'gameId', event
        ORDER BY props->>'gameId'
      `)
    );

    // Pivot: { gameId → { starts, completes, aborts } }
    const gameMap = new Map<string, { starts: number; completes: number; aborts: number }>();
    for (const r of gameRowsRaw) {
      const id = String(r.game_id ?? "");
      if (!id) continue;
      const bucket = gameMap.get(id) ?? { starts: 0, completes: 0, aborts: 0 };
      const n = Number(r.count ?? 0);
      const ev = String(r.event_type ?? "");
      if (ev === "game_start") bucket.starts += n;
      else if (ev === "game_complete") bucket.completes += n;
      else if (ev === "game_abort") bucket.aborts += n;
      gameMap.set(id, bucket);
    }

    const perGame: GameFunnelRow[] = Array.from(gameMap.entries())
      .map(([gameId, v]) => ({
        gameId,
        starts: v.starts,
        completes: v.completes,
        aborts: v.aborts,
        completionPct: v.starts > 0 ? (v.completes / v.starts) * 100 : 0,
      }))
      .sort((a, b) => b.starts - a.starts);

    // Per-tier counts. `mode` covers legacy quiz_start payloads where we
    // stored the tier name in `mode`. COALESCE picks tier first.
    const tierRowsRaw = rows(
      await db.execute(sql`
        SELECT
          COALESCE(props->>'tier', props->>'mode') AS tier,
          event AS event_type,
          COUNT(*) AS count
        FROM analytics_events
        WHERE event IN ('quiz_start', 'quiz_complete')
          AND created_at >= ${since}::timestamp
          AND COALESCE(props->>'tier', props->>'mode') IN ('quick', 'standard', 'pro')
        GROUP BY COALESCE(props->>'tier', props->>'mode'), event
      `)
    );

    const tierMap = new Map<string, { quizStarts: number; quizCompletes: number }>();
    for (const r of tierRowsRaw) {
      const tier = String(r.tier ?? "");
      if (!tier) continue;
      const bucket = tierMap.get(tier) ?? { quizStarts: 0, quizCompletes: 0 };
      const n = Number(r.count ?? 0);
      const ev = String(r.event_type ?? "");
      if (ev === "quiz_start") bucket.quizStarts += n;
      else if (ev === "quiz_complete") bucket.quizCompletes += n;
      tierMap.set(tier, bucket);
    }

    const perTier: TierFunnelRow[] = (["quick", "standard", "pro"] as const).map(
      (tier) => {
        const v = tierMap.get(tier) ?? { quizStarts: 0, quizCompletes: 0 };
        return {
          tier,
          quizStarts: v.quizStarts,
          quizCompletes: v.quizCompletes,
          completionPct:
            v.quizStarts > 0 ? (v.quizCompletes / v.quizStarts) * 100 : 0,
        };
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        windowDays: days,
        perGame,
        perTier,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("admin.analytics.funnel", "Funnel query failed", error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
