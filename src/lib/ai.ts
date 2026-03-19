import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// In-memory cache for settings (refreshes every 60s)
let cachedGlobalModel: string | null = null;
let cachedApiKey: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 seconds

/**
 * Read a site_settings value from DB with cache.
 * Falls back to null if not found.
 */
async function getCachedSetting(key: string): Promise<string | null> {
  try {
    const row = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);
    return row.length > 0 ? row[0].value : null;
  } catch {
    return null;
  }
}

/**
 * Read the global AI model from site_settings DB table.
 * Falls back to AI_MODEL env or "anthropic/claude-sonnet-4".
 * Cached in memory for 60s to avoid DB round-trips on every chat.
 */
async function getGlobalModelId(): Promise<string> {
  const now = Date.now();
  if (cachedGlobalModel && now - cacheTimestamp < CACHE_TTL) {
    return cachedGlobalModel;
  }

  const dbValue = await getCachedSetting("ai_model");
  if (dbValue) {
    cachedGlobalModel = dbValue;
    cacheTimestamp = now;
    return cachedGlobalModel;
  }

  const fallback = process.env.AI_MODEL || "anthropic/claude-sonnet-4";
  cachedGlobalModel = fallback;
  cacheTimestamp = now;
  return fallback;
}

/**
 * Read the OpenRouter API key.
 * Priority: DB site_settings "openrouter_api_key" → OPENROUTER_API_KEY env.
 * DB key allows hot-rotation without container restart.
 * Cached in memory for 60s.
 */
async function getApiKey(): Promise<string | null> {
  const now = Date.now();
  if (cachedApiKey !== null && now - cacheTimestamp < CACHE_TTL) {
    return cachedApiKey || null;
  }

  const dbKey = await getCachedSetting("openrouter_api_key");
  if (dbKey) {
    cachedApiKey = dbKey;
    cacheTimestamp = now;
    return cachedApiKey;
  }

  const envKey = process.env.OPENROUTER_API_KEY || null;
  cachedApiKey = envKey || "";
  cacheTimestamp = now;
  return envKey;
}

/**
 * Invalidate all cached settings (call after admin changes anything).
 */
export function invalidateModelCache() {
  cachedGlobalModel = null;
  cachedApiKey = null;
  cacheTimestamp = 0;
}

/**
 * Get an AI model instance. Supports per-partner model override.
 * Priority: explicit modelId param → DB site_settings → AI_MODEL env → claude-sonnet-4
 * API Key: DB site_settings "openrouter_api_key" → OPENROUTER_API_KEY env
 *
 * @param modelId - Optional model ID override (e.g. "anthropic/claude-sonnet-4").
 *                  Pass null/undefined to use global default.
 */
export async function getModel(modelId?: string | null) {
  const apiKey = await getApiKey();
  if (!apiKey) return null;

  const openrouter = createOpenRouter({ apiKey });
  const resolvedModel = modelId || (await getGlobalModelId());
  return openrouter(resolvedModel);
}

/**
 * Synchronous version for cases where we know the model ID already.
 * Uses env API key only (no DB lookup) — only use for non-critical paths.
 */
export function getModelSync(modelId: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const openrouter = createOpenRouter({ apiKey });
  return openrouter(modelId);
}
