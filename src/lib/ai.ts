import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// In-memory cache for settings (refreshes every 60s)
let cachedGlobalModel: string | null = null;
let cachedApiKey: string | null = null;
let cachedProvider: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 seconds

type AiProvider = "minimax" | "openrouter";

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
 * Detect which AI provider to use.
 * Priority: DB ai_provider → MINIMAX_API_KEY exists → default "minimax"
 */
async function getProvider(): Promise<AiProvider> {
  const now = Date.now();
  if (cachedProvider && now - cacheTimestamp < CACHE_TTL) {
    return cachedProvider as AiProvider;
  }

  const dbProvider = await getCachedSetting("ai_provider");
  if (dbProvider === "openrouter" || dbProvider === "minimax") {
    cachedProvider = dbProvider;
    return dbProvider;
  }

  // Default: prefer MiniMax if key exists, else OpenRouter
  cachedProvider = process.env.MINIMAX_API_KEY ? "minimax" : "openrouter";
  return cachedProvider as AiProvider;
}

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

  const provider = await getProvider();
  const fallback = provider === "minimax"
    ? (process.env.MINIMAX_MODEL || "MiniMax-M2.7-highspeed")
    : (process.env.AI_MODEL || "anthropic/claude-sonnet-4");

  cachedGlobalModel = fallback;
  cacheTimestamp = now;
  return fallback;
}

/**
 * Get API key for the active provider.
 * MiniMax: DB minimax_api_key → MINIMAX_API_KEY env
 * OpenRouter: DB openrouter_api_key → OPENROUTER_API_KEY env
 */
async function getApiKey(): Promise<string | null> {
  const now = Date.now();
  if (cachedApiKey !== null && now - cacheTimestamp < CACHE_TTL) {
    return cachedApiKey || null;
  }

  const provider = await getProvider();

  if (provider === "minimax") {
    const dbKey = await getCachedSetting("minimax_api_key");
    const key = dbKey || process.env.MINIMAX_API_KEY || null;
    cachedApiKey = key || "";
    cacheTimestamp = now;
    return key;
  }

  // OpenRouter
  const dbKey = await getCachedSetting("openrouter_api_key");
  const key = dbKey || process.env.OPENROUTER_API_KEY || null;
  cachedApiKey = key || "";
  cacheTimestamp = now;
  return key;
}

export function invalidateModelCache() {
  cachedGlobalModel = null;
  cachedApiKey = null;
  cachedProvider = null;
  cacheTimestamp = 0;
}

/**
 * Get an AI model instance. Supports MiniMax (primary) + OpenRouter (fallback).
 * MiniMax: OpenAI-compatible API at api.minimax.io/v1
 * OpenRouter: existing provider
 */
export async function getModel(modelId?: string | null) {
  const provider = await getProvider();
  const apiKey = await getApiKey();
  if (!apiKey) {
    // Fallback: try the other provider
    const fallbackKey = provider === "minimax"
      ? process.env.OPENROUTER_API_KEY
      : process.env.MINIMAX_API_KEY;
    if (!fallbackKey) return null;

    if (provider === "minimax") {
      // MiniMax key missing, fall back to OpenRouter
      const openrouter = createOpenRouter({ apiKey: fallbackKey });
      return openrouter(modelId || process.env.AI_MODEL || "anthropic/claude-sonnet-4");
    } else {
      // OpenRouter key missing, fall back to MiniMax
      const minimax = createOpenAI({
        apiKey: fallbackKey,
        baseURL: "https://api.minimax.io/v1",
        compatibility: "compatible",
      });
      return minimax.chat(modelId || process.env.MINIMAX_MODEL || "MiniMax-M2.7-highspeed");
    }
  }

  const resolvedModel = modelId || (await getGlobalModelId());

  if (provider === "minimax") {
    const minimax = createOpenAI({
      apiKey,
      baseURL: "https://api.minimax.io/v1",
      compatibility: "compatible",  // Force /chat/completions, not /responses
    });
    return minimax.chat(resolvedModel);
  }

  const openrouter = createOpenRouter({ apiKey });
  return openrouter(resolvedModel);
}

/**
 * Sync version — env keys only, no DB. For non-critical paths.
 */
export function getModelSync(modelId: string) {
  // Prefer MiniMax
  const minimaxKey = process.env.MINIMAX_API_KEY;
  if (minimaxKey) {
    const minimax = createOpenAI({
      apiKey: minimaxKey,
      baseURL: "https://api.minimax.io/v1",
      compatibility: "compatible",
    });
    return minimax.chat(modelId);
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) return null;
  const openrouter = createOpenRouter({ apiKey: openrouterKey });
  return openrouter(modelId);
}
