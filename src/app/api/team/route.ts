import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { getUserOrgs } from "@/lib/team";
import { logger } from "@/lib/logger";

// GET /api/team — List orgs the current user is a member of.
export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orgs = await getUserOrgs(auth.sub);
    return NextResponse.json({ success: true, data: { orgs } });
  } catch (err) {
    logger.error("team.list", "List orgs failed", err);
    return NextResponse.json(
      { success: false, error: "Failed to list teams" },
      { status: 500 }
    );
  }
}
