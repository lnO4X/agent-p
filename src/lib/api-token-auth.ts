import crypto from "crypto";
import { db } from "@/db";
import { apiTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Validate a raw API token (format: `gtn_<40-char-nanoid>`) against the
 * hashed record in `api_tokens`. Returns the owning orgId on success, or
 * null on any invalid/expired/revoked state.
 *
 * Fire-and-forget updates `lastUsedAt` so consumers don't block on that write.
 */
export async function validateApiToken(
  rawToken: string
): Promise<string | null> {
  if (!rawToken.startsWith("gtn_")) return null;
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const rows = await db
    .select()
    .from(apiTokens)
    .where(eq(apiTokens.tokenHash, hash))
    .limit(1);
  const token = rows[0];
  if (!token || token.revokedAt) return null;
  if (token.expiresAt && token.expiresAt < new Date()) return null;

  // Fire-and-forget: update lastUsedAt.
  // We explicitly swallow errors here — this is a best-effort metadata write.
  void db
    .update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, token.id))
    .catch(() => {
      /* best-effort — do not block auth on this */
    });

  return token.orgId;
}

/**
 * Hash a raw API token for storage. Exported so the token-creation
 * endpoint can compute the hash at create-time.
 */
export function hashApiToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
