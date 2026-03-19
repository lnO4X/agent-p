import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 200, 2000);
      },
    });
    redis.on("error", (err) => {
      console.error("[redis] Connection error:", err.message);
    });
  }
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
  } catch {
    // If Redis is down, fail open (allow the request)
    return { allowed: true, remaining: maxRequests, resetInSeconds: windowSeconds };
  }
}
