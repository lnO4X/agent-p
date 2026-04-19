import { db } from "@/db";
import { organizations, orgMembers } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export type OrgRole = "admin" | "coach" | "player";

/**
 * Role precedence — higher index = more privileged.
 * Used by requireOrgRole() to check "at least coach" etc.
 */
const ROLE_ORDER: OrgRole[] = ["player", "coach", "admin"];

/**
 * Get all orgs a user is a member of, with their role in each + member count.
 * Returns empty array if user is not a member of any org.
 */
export async function getUserOrgs(userId: string): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    plan: "starter" | "pro" | "enterprise" | "beta";
    role: OrgRole;
    memberCount: number;
  }>
> {
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      plan: organizations.plan,
      role: orgMembers.role,
      memberCount: sql<number>`(SELECT count(*)::int FROM org_members WHERE org_id = ${organizations.id})`,
    })
    .from(orgMembers)
    .innerJoin(organizations, eq(organizations.id, orgMembers.orgId))
    .where(eq(orgMembers.userId, userId));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    plan: r.plan,
    role: r.role as OrgRole,
    memberCount: Number(r.memberCount),
  }));
}

/**
 * Look up the role a user has in a given org.
 * Returns null if the user is not a member.
 */
export async function getUserOrgRole(
  userId: string,
  orgId: string
): Promise<OrgRole | null> {
  const rows = await db
    .select({ role: orgMembers.role })
    .from(orgMembers)
    .where(and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, orgId)))
    .limit(1);
  return (rows[0]?.role as OrgRole) ?? null;
}

/**
 * Check that userId has at least `minRole` in the org.
 * Returns false if not a member, or if their role is below minRole.
 *
 * Hierarchy: admin > coach > player
 */
export async function requireOrgRole(
  userId: string,
  orgId: string,
  minRole: OrgRole
): Promise<boolean> {
  const role = await getUserOrgRole(userId, orgId);
  if (!role) return false;
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(minRole);
}

/**
 * Generate a URL-friendly slug from a name.
 * Lowercase, ASCII-safe, hyphen-separated, trimmed.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Generate a unique slug by appending a short nanoid suffix if the base is taken.
 * Tries the raw slug first; on conflict, appends -<6char suffix>.
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  makeSuffix: () => string
): Promise<string> {
  const base = baseSlug || "team";
  const existing = await db
    .select({ slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.slug, base))
    .limit(1);
  if (existing.length === 0) return base;

  // Append a random suffix. In extremely rare collision, try a few times.
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${makeSuffix()}`.slice(0, 80);
    const clash = await db
      .select({ slug: organizations.slug })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);
    if (clash.length === 0) return candidate;
  }
  // Last-resort: full fresh slug
  return `team-${makeSuffix()}-${makeSuffix()}`.slice(0, 80);
}
