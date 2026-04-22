import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getRedis } from "@/lib/redis";
import { gameRegistry } from "@/games";
import { checkEnv } from "@/lib/env-check";
import fs from "fs";
import path from "path";

interface HealthCheck {
  ok: boolean;
  latencyMs?: number;
  count?: number;
  expected?: number;
  locales?: number;
  keysPerLocale?: number;
  mismatches?: string[];
  missing?: { name: string; level: string }[];
  error?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: Record<string, HealthCheck>;
}

// 18 games: 17 original + posner (added in M5 when Pattern was split into Quick-tier
// "Find the Odd One" + Pro-tier Posner Cueing for research-grade pattern_recog).
const EXPECTED_GAME_COUNT = 18;

async function checkDatabase(): Promise<HealthCheck> {
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  try {
    const r = getRedis();
    if (!r) {
      return { ok: false, error: "Redis not configured" };
    }
    const start = Date.now();
    await r.ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function checkGameRegistry(): HealthCheck {
  const allGames = gameRegistry.getAll();
  const count = allGames.length;
  return {
    ok: count === EXPECTED_GAME_COUNT,
    count,
    expected: EXPECTED_GAME_COUNT,
  };
}

// Module-level cache — locale files are static between deploys, so we only
// read + parse them once per serverless instance. This avoids 8 disk reads
// + 8 JSON.parse calls on every /api/health invocation.
let _i18nCache: HealthCheck | null = null;

function checkI18n(): HealthCheck {
  if (_i18nCache) return _i18nCache;

  try {
    const localesDir = path.join(process.cwd(), "src", "i18n", "locales");
    const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));

    const keyCounts: Record<string, number> = {};
    for (const file of files) {
      const content = JSON.parse(
        fs.readFileSync(path.join(localesDir, file), "utf-8")
      );
      keyCounts[file] = countKeys(content);
    }

    const counts = Object.values(keyCounts);
    const expected = keyCounts["en.json"] ?? counts[0];
    const mismatches = Object.entries(keyCounts)
      .filter(([, count]) => count !== expected)
      .map(([file, count]) => `${file}: ${count} (expected ${expected})`);

    _i18nCache = {
      ok: mismatches.length === 0,
      locales: files.length,
      keysPerLocale: expected,
      mismatches,
    };
    return _i18nCache;
  } catch (err) {
    // Don't cache errors — retry next time
    return { ok: false, error: String(err) };
  }
}

function countKeys(obj: Record<string, unknown>, prefix = ""): number {
  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      count += countKeys(value as Record<string, unknown>, fullKey);
    } else {
      count++;
    }
  }
  return count;
}

/**
 * GET /api/health — Structured health check
 *
 * Public endpoint (no auth). Returns system health status.
 * Used by gametan-watchdog scheduled task.
 */
export async function GET() {
  const [database, redis] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  const env = { ...checkEnv() };
  const gameReg = checkGameRegistry();
  const i18n = checkI18n();

  const checks: Record<string, HealthCheck> = {
    database,
    redis,
    env: { ok: env.ok, missing: env.missing },
    gameRegistry: gameReg,
    i18n,
  };

  // Determine overall status
  const criticalFailed = !database.ok || !env.ok;
  const anyFailed = Object.values(checks).some((c) => !c.ok);

  const status: HealthResponse["status"] = criticalFailed
    ? "unhealthy"
    : anyFailed
      ? "degraded"
      : "healthy";

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(response, {
    status: status === "unhealthy" ? 503 : 200,
  });
}
