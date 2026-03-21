import { ImageResponse } from "next/og";
import { db } from "@/db";
import { pkChallenges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { gameRegistry } from "@/games";

export const runtime = "nodejs";

function rankColor(score: number): string {
  if (score >= 90) return "#facc15";
  if (score >= 75) return "#a78bfa";
  if (score >= 55) return "#3b82f6";
  if (score >= 35) return "#22c55e";
  return "#94a3b8";
}

function scoreToRank(score: number): string {
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 55) return "B";
  if (score >= 35) return "C";
  return "D";
}

/**
 * GET /api/pk/card/[id] — Generate PK challenge OG share card (1200×630)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await db
      .select()
      .from(pkChallenges)
      .where(eq(pkChallenges.id, id))
      .limit(1);

    if (rows.length === 0) {
      return new Response("PK not found", { status: 404 });
    }

    const pk = rows[0];
    const game = gameRegistry.get(pk.gameId);
    const gameIcon = game?.icon || "🎮";
    const gameName = game?.nameEn || game?.name || pk.gameId;
    const rank = scoreToRank(pk.creatorScore);
    const color = rankColor(pk.creatorScore);
    const isCompleted = pk.status === "completed";

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontFamily: "sans-serif",
            color: "white",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            padding: "50px 60px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", fontWeight: 700 }}>
                GameTan PK Challenge
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 16px",
                borderRadius: "20px",
                background: "#7c3aed",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {gameName}
            </div>
          </div>

          {/* Center */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "60px",
            }}
          >
            <div style={{ fontSize: "80px", display: "flex" }}>{gameIcon}</div>

            {/* Creator score */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "16px",
                  color: "#94a3b8",
                  display: "flex",
                }}
              >
                {pk.creatorName}
              </div>
              <div
                style={{
                  fontSize: "100px",
                  fontWeight: 800,
                  lineHeight: 1,
                  color,
                  display: "flex",
                }}
              >
                {Math.round(pk.creatorScore)}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "20px",
                  color: "#94a3b8",
                }}
              >
                <span style={{ color, display: "flex" }}>Rank {rank}</span>
              </div>
            </div>

            {/* VS or challenger */}
            {isCompleted && pk.challengerScore != null ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#475569",
                    display: "flex",
                  }}
                >
                  VS
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#94a3b8",
                      display: "flex",
                    }}
                  >
                    {pk.challengerName || "Challenger"}
                  </div>
                  <div
                    style={{
                      fontSize: "60px",
                      fontWeight: 800,
                      lineHeight: 1,
                      color: rankColor(pk.challengerScore),
                      display: "flex",
                    }}
                  >
                    {Math.round(pk.challengerScore)}
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      color: rankColor(pk.challengerScore),
                      display: "flex",
                    }}
                  >
                    Rank {scoreToRank(pk.challengerScore)}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#475569",
                    display: "flex",
                  }}
                >
                  VS
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "#64748b",
                    display: "flex",
                  }}
                >
                  ???
                </div>
              </div>
            )}
          </div>

          {/* Bottom */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "13px", color: "#475569", display: "flex" }}>
                gametan.ai
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${color}, ${color}88)`,
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {isCompleted ? "See the result!" : "Can you beat this?"}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("PK card error:", error);
    return new Response("Error generating card", { status: 500 });
  }
}
