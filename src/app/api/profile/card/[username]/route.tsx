import { ImageResponse } from "next/og";
import { db } from "@/db";
import { users, talentProfiles, testSessions } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export const runtime = "nodejs";

const TALENT_LABELS_EN: Record<string, string> = {
  reaction_speed: "Reaction",
  hand_eye_coord: "Hand-Eye",
  spatial_awareness: "Spatial",
  memory: "Memory",
  strategy_logic: "Strategy",
  rhythm_sense: "Rhythm",
  pattern_recog: "Pattern",
  multitasking: "Multitask",
  decision_speed: "Decision",
  emotional_control: "Emotion",
  teamwork_tendency: "Teamwork",
  risk_assessment: "Risk",
  resource_mgmt: "Resource",
};

const RANK_COLORS: Record<string, string> = {
  S: "#ef4444",
  A: "#f97316",
  B: "#eab308",
  C: "#22c55e",
  D: "#94a3b8",
};

/**
 * GET /api/profile/card/[username] — Generate 1200×630 OG share image
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Find user + best profile
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        tier: users.tier,
        tierExpiresAt: users.tierExpiresAt,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (userResult.length === 0) {
      return new Response("Not found", { status: 404 });
    }

    const user = userResult[0];

    const profiles = await db
      .select({
        overallScore: talentProfiles.overallScore,
        overallRank: talentProfiles.overallRank,
        reactionSpeed: talentProfiles.reactionSpeed,
        handEyeCoord: talentProfiles.handEyeCoord,
        spatialAwareness: talentProfiles.spatialAwareness,
        memory: talentProfiles.memory,
        strategyLogic: talentProfiles.strategyLogic,
        rhythmSense: talentProfiles.rhythmSense,
        patternRecog: talentProfiles.patternRecog,
        multitasking: talentProfiles.multitasking,
        decisionSpeed: talentProfiles.decisionSpeed,
        emotionalControl: talentProfiles.emotionalControl,
        teamworkTendency: talentProfiles.teamworkTendency,
        riskAssessment: talentProfiles.riskAssessment,
        resourceMgmt: talentProfiles.resourceMgmt,
      })
      .from(talentProfiles)
      .innerJoin(
        testSessions,
        and(
          eq(talentProfiles.sessionId, testSessions.id),
          eq(testSessions.status, "completed")
        )
      )
      .where(eq(talentProfiles.userId, user.id))
      .orderBy(desc(talentProfiles.overallScore))
      .limit(1);

    const profile = profiles[0];
    const rank = profile?.overallRank || "?";
    const score = Math.round(profile?.overallScore || 0);
    const rankColor = RANK_COLORS[rank] || "#94a3b8";

    // Build top talents
    const talentEntries = profile
      ? [
          { key: "reaction_speed", score: profile.reactionSpeed },
          { key: "hand_eye_coord", score: profile.handEyeCoord },
          { key: "spatial_awareness", score: profile.spatialAwareness },
          { key: "memory", score: profile.memory },
          { key: "strategy_logic", score: profile.strategyLogic },
          { key: "rhythm_sense", score: profile.rhythmSense },
          { key: "pattern_recog", score: profile.patternRecog },
          { key: "multitasking", score: profile.multitasking },
          { key: "decision_speed", score: profile.decisionSpeed },
          { key: "emotional_control", score: profile.emotionalControl },
          { key: "teamwork_tendency", score: profile.teamworkTendency },
          { key: "risk_assessment", score: profile.riskAssessment },
          { key: "resource_mgmt", score: profile.resourceMgmt },
        ]
          .filter((t) => typeof t.score === "number")
          .sort((a, b) => (b.score as number) - (a.score as number))
      : [];

    const top5 = talentEntries.slice(0, 5);

    const isPremium =
      user.tier === "premium" &&
      (!user.tierExpiresAt || user.tierExpiresAt >= new Date());

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
            fontFamily: "sans-serif",
            color: "white",
            padding: "60px",
          }}
        >
          {/* Left section */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "18px", color: "#94a3b8" }}>
                  GameTan DNA Card
                </span>
                {isPremium && (
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#eab308",
                      background: "rgba(234, 179, 8, 0.1)",
                      padding: "2px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    Premium
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  marginTop: "12px",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "36px",
                    fontWeight: 700,
                  }}
                >
                  {username.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "36px", fontWeight: 700 }}>
                    {username}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <span style={{ fontSize: "16px", color: "#94a3b8" }}>
                      Overall
                    </span>
                    <span
                      style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        color: rankColor,
                      }}
                    >
                      {rank}
                    </span>
                    <span style={{ fontSize: "20px", color: "#cbd5e1" }}>
                      {`${score} pts`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top talents */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span
                style={{ fontSize: "14px", color: "#64748b", marginBottom: "4px" }}
              >
                Top Talents
              </span>
              {top5.map((t) => (
                <div
                  key={t.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#94a3b8",
                      width: "90px",
                    }}
                  >
                    {TALENT_LABELS_EN[t.key] || t.key}
                  </span>
                  {/* Bar */}
                  <div
                    style={{
                      flex: 1,
                      height: "20px",
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      display: "flex",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round(t.score as number)}%`,
                        height: "100%",
                        background:
                          "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                        borderRadius: "10px",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      width: "36px",
                      textAlign: "right",
                    }}
                  >
                    {Math.round(t.score as number)}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px", color: "#475569" }}>
                gametan.ai
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Card generation error:", error);
    return new Response("Error generating card", { status: 500 });
  }
}
