import { ImageResponse } from "next/og";
import { quickScoresToArchetype } from "@/lib/archetype";

export const runtime = "nodejs";

/**
 * GET /api/quiz/card?s=78-45-62 — Generate archetype OG share card (1200×630)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const s = searchParams.get("s");

    if (!s) {
      return new Response("Missing scores", { status: 400 });
    }

    const parts = s.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      return new Response("Invalid scores", { status: 400 });
    }

    const [reaction, pattern, risk] = parts;
    const archetype = quickScoresToArchetype(reaction, pattern, risk);

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            fontFamily: "sans-serif",
            color: "white",
            background: `linear-gradient(135deg, #0f172a 0%, ${archetype.gradient[0]}33 50%, #0f172a 100%)`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${archetype.gradient[0]}20, transparent 70%)`,
              display: "flex",
            }}
          />

          {/* Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "60px",
              flex: 1,
            }}
          >
            {/* Top */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "16px", color: "#64748b" }}>
                GameTan Archetype
              </span>
              <span style={{ fontSize: "14px", color: "#475569" }}>|</span>
              <span style={{ fontSize: "14px", color: "#475569" }}>
                game.weda.ai/quiz
              </span>
            </div>

            {/* Center — Archetype */}
            <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
              <div style={{ fontSize: "100px", display: "flex" }}>
                {archetype.icon}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    fontWeight: 800,
                    lineHeight: 1.1,
                    background: `linear-gradient(135deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {archetype.nameEn}
                </div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 600,
                    color: "#cbd5e1",
                  }}
                >
                  {archetype.name}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    color: "#94a3b8",
                    maxWidth: "500px",
                    lineHeight: 1.4,
                    marginTop: "4px",
                  }}
                >
                  &ldquo;{archetype.taglineEn}&rdquo;
                </div>
              </div>
            </div>

            {/* Bottom — Scores + CTA */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              {/* Score pills */}
              <div style={{ display: "flex", gap: "20px" }}>
                {[
                  { label: "Reaction", score: reaction },
                  { label: "Pattern", score: pattern },
                  { label: "Risk", score: risk },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "28px",
                        fontWeight: 700,
                        color: "white",
                      }}
                    >
                      {Math.round(item.score)}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  borderRadius: "16px",
                  background: `linear-gradient(135deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                What&apos;s yours? Take the quiz
              </div>
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
    console.error("Archetype card error:", error);
    return new Response("Error generating card", { status: 500 });
  }
}
