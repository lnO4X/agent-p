import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Legacy ioredis-style REDIS_URL not supported — use Upstash REST API
  if (!url || !token) {
    console.warn("[redis] UPSTASH_REDIS_REST_URL or TOKEN not set — rate limiting disabled");
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

/**
 * Rate limiter using Redis INCR + TTL.
 * Returns { allowed: boolean, remaining: number, resetInSeconds: number }
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
  try {
    const r = getRedis();
    if (!r) {
      // No Redis configured — fail closed (reject the request)
      console.warn("[redis] Rate limiting unavailable — no Redis configured, rejecting request");
      return { allowed: false, remaining: 0, resetInSeconds: windowSeconds };
    }

    const current = await r.incr(key);
    if (current === 1) {
      await r.expire(key, windowSeconds);
    }
    const ttl = await r.ttl(key);
    const remaining = Math.max(0, maxRequests - current);
    return {
      allowed: current <= maxRequests,
      remaining,
      resetInSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  } catch (err) {
    // If Redis is down, fail closed (reject the request)
    console.error("[redis] Rate limiting error — rejecting request:", err);
    return { allowed: false, remaining: 0, resetInSeconds: windowSeconds };
  }
}
