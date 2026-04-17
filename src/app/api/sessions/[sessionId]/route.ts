import { NextResponse } from "next/server";
import { db } from "@/db";
import { testSessions, gameScores, talentProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthFromCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未登录" } },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    const sessions = await db
      .select()
      .from(testSessions)
      .where(
        and(
          eq(testSessions.id, sessionId),
          eq(testSessions.userId, auth.sub)
        )
      )
      .limit(1);

    if (sessions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "测试不存在" },
        },
        { status: 404 }
      );
    }

    const scores = await db
      .select()
      .from(gameScores)
      .where(eq(gameScores.sessionId, sessionId));

    const profiles = await db
      .select()
      .from(talentProfiles)
      .where(eq(talentProfiles.sessionId, sessionId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        session: sessions[0],
        scores,
        profile: profiles[0] || null,
      },
    });
  } catch (error) {
    logger.error("sessions.get", "Get session failed", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "获取测试详情失败" },
      },
      { status: 500 }
    );
  }
}
