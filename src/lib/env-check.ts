/**
 * Environment variable validation — runs once at server startup via instrumentation.ts.
 *
 * Levels:
 *   CRITICAL — server cannot function without these, exits process
 *   REQUIRED — features degraded but server can start, emits warning
 *   OPTIONAL — silent if missing
 */

interface EnvVar {
  name: string;
  level: "critical" | "required" | "optional";
}

const ENV_VARS: EnvVar[] = [
  // CRITICAL — server cannot start
  { name: "DATABASE_URL", level: "critical" },
  { name: "JWT_SECRET", level: "critical" },

  // REQUIRED — core features degraded
  { name: "CRON_SECRET", level: "required" },
  { name: "NEXT_PUBLIC_BASE_URL", level: "required" },
  { name: "OPENROUTER_API_KEY", level: "required" },

  // OPTIONAL — graceful degradation
  { name: "UPSTASH_REDIS_REST_URL", level: "optional" },
  { name: "UPSTASH_REDIS_REST_TOKEN", level: "optional" },
  { name: "CREEM_WEBHOOK_SECRET", level: "optional" },
  { name: "RESEND_API_KEY", level: "optional" },
  { name: "FIRECRAWL_API_KEY", level: "optional" },
  { name: "STEAM_API_KEY", level: "optional" },
];

export interface EnvCheckResult {
  ok: boolean;
  missing: { name: string; level: string }[];
}

/** Check env vars without side effects — used by /api/health */
export function checkEnv(): EnvCheckResult {
  const missing = ENV_VARS.filter(
    (v) => v.level !== "optional" && !process.env[v.name]
  ).map((v) => ({ name: v.name, level: v.level }));

  return { ok: missing.length === 0, missing };
}

/** Validate env vars at startup — exits on CRITICAL missing */
export function validateEnv(): void {
  const criticalMissing = ENV_VARS.filter(
    (v) => v.level === "critical" && !process.env[v.name]
  );

  const requiredMissing = ENV_VARS.filter(
    (v) => v.level === "required" && !process.env[v.name]
  );

  if (criticalMissing.length > 0) {
    console.error(
      `[env-check] CRITICAL: Missing required environment variables: ${criticalMissing.map((v) => v.name).join(", ")}. Server cannot start.`
    );
    process.exit(1);
  }

  if (requiredMissing.length > 0) {
    console.warn(
      `[env-check] WARNING: Missing environment variables (features degraded): ${requiredMissing.map((v) => v.name).join(", ")}`
    );
  }
}
