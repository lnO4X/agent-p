import { ImageResponse } from "next/og";
import type { TalentCategory } from "@/types/talent";
import { gameRegistry } from "@/games";

export const runtime = "nodejs";

const TALENT_LABELS: Record<string, string> = {
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
 * GET /api/challenge/card?score=82&talent=reaction_speed&streak=14&name=Player
 *
 * Generates a Wordle-style OG share card for daily challenge results (1200x630)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const score = Number(searchParams.get("score") || 0);
    const talent = (searchParams.get("talent") || "reaction_speed") as TalentCategory;
    const streak = Number(searchParams.get("streak") || 0);
    const name = searchParams.get("name") || "Player";

    const rank = scoreToRank(score);
    const color = rankColor(score);
    const talentLabel = TALENT_LABELS[talent] || talent;

    const allGames = gameRegistry.getAll();
    const game = allGames.find((g) => g.primaryTalent === talent);
    const gameIcon = game?.icon || "🎮";

    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );

    // Build Wordle-style grid rows
    const gridRows = [0, 1, 2, 3, 4].map((row) =>
      [0, 1, 2, 3, 4].map((col) => {
        const threshold = (4 - row) * 20 + col * 4;
        return score >= threshold;
      })
    );

    const streakText = streak > 0 ? `🔥 ${streak} day streak` : "";
    const dateText = today.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

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
                {`GameTan Daily Challenge #${dayOfYear}`}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 16px",
                borderRadius: "20px",
                background: streak > 0 ? "#f97316" : "transparent",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {streakText}
            </div>
          </div>

          {/* Center — Score + Grid */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "60px",
            }}
          >
            <div style={{ fontSize: "80px", display: "flex" }}>{gameIcon}</div>

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
                  fontSize: "100px",
                  fontWeight: 800,
                  lineHeight: 1,
                  color,
                  display: "flex",
                }}
              >
                {Math.round(score)}
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
                <span style={{ display: "flex" }}>{talentLabel}</span>
                <span style={{ color, display: "flex" }}>Rank {rank}</span>
              </div>
            </div>

            {/* Wordle grid */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {gridRows.map((cols, row) => (
                <div key={row} style={{ display: "flex", gap: "6px" }}>
                  {cols.map((filled, col) => (
                    <div
                      key={col}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "4px",
                        background: filled ? color : "#334155",
                        display: "flex",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
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
              <span style={{ fontSize: "16px", color: "#cbd5e1", display: "flex" }}>
                {name}
              </span>
              <span style={{ fontSize: "13px", color: "#475569", display: "flex" }}>
                {dateText}
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
              Can you beat this? gametan.ai
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
    console.error("Challenge card error:", error);
    return new Response("Error generating card", { status: 500 });
  }
}
