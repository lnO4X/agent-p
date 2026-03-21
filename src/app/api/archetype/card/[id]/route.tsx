import { ImageResponse } from "next/og";
import { getArchetype } from "@/lib/archetype";

export const runtime = "nodejs";

/**
 * GET /api/archetype/card/[id] — Generate archetype OG share card (1200×630)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const archetype = getArchetype(id);

    if (!archetype) {
      return new Response("Archetype not found", { status: 404 });
    }

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
                game.weda.ai
              </span>
            </div>

            {/* Center — Archetype */}
            <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
              <div style={{ fontSize: "120px", display: "flex" }}>
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
                    fontSize: "52px",
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
                    fontSize: "32px",
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
                  {`\u201C${archetype.taglineEn}\u201D`}
                </div>
              </div>
            </div>

            {/* Bottom — CTA */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "14px", color: "#64748b", display: "flex" }}>
                  1 of 16 Gamer Archetypes
                </span>
              </div>
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
                What&apos;s yours? game.weda.ai/quiz
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
