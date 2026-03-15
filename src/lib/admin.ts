import { getAuthFromCookie } from "./auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const CRON_SECRET = process.env.CRON_SECRET || "";

/**
 * Check if the current request is from an admin user (via JWT cookie).
 * Returns the auth payload if admin, null otherwise.
 */
export async function requireAdmin() {
  const auth = await getAuthFromCookie();
  if (!auth) return null;

  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, auth.sub));

  if (!user?.isAdmin) return null;
  return auth;
}

/**
 * Check if the request is authorized for admin operations.
 * Accepts either:
 * 1. JWT cookie + isAdmin flag in database
 * 2. Bearer token matching CRON_SECRET (for programmatic/cron access)
 */
export async function requireAdminOrCronSecret(
  authHeader?: string | null
): Promise<{ type: "admin"; userId: string } | { type: "cron" } | null> {
  // Check Bearer token first (cron/programmatic)
  if (authHeader && CRON_SECRET) {
    const token = authHeader.replace("Bearer ", "");
    if (token === CRON_SECRET) {
      return { type: "cron" };
    }
  }

  // Check JWT + isAdmin
  const admin = await requireAdmin();
  if (admin) {
    return { type: "admin", userId: admin.sub };
  }

  return null;
}
