import { ImageResponse } from "next/og";
import { getGameQuiz, getCharacterForArchetype } from "@/lib/game-quizzes";
import { getArchetype } from "@/lib/archetype";

export const runtime = "nodejs";

/**
 * GET /api/quiz/game-card/[gameId]?character=jett&archetype=lightning-assassin
 * Generate game-specific OG share card (1200×630)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const quiz = getGameQuiz(gameId);

    if (!quiz) {
      return new Response("Game quiz not found", { status: 404 });
    }

    const url = new URL(request.url);
    const archetypeId = url.searchParams.get("archetype") || "";
    const character = getCharacterForArchetype(gameId, archetypeId);
    const archetype = getArchetype(archetypeId);

    // Use character-specific or generic game card
    const hasCharacter = character && archetype;

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            fontFamily: "sans-serif",
            color: "white",
            background: `linear-gradient(135deg, #0f172a 0%, ${quiz.gradient[0]}33 50%, #0f172a 100%)`,
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
              background: `radial-gradient(circle, ${hasCharacter ? character.color : quiz.gradient[0]}30, transparent 70%)`,
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
            {/* Top — Game branding */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>{quiz.icon}</span>
              <span style={{ fontSize: "16px", color: "#94a3b8" }}>
                {quiz.gameNameEn}
              </span>
              <span style={{ fontSize: "14px", color: "#475569" }}>|</span>
              <span style={{ fontSize: "14px", color: "#475569" }}>
                gametan.ai
              </span>
            </div>

            {/* Center — Character or generic */}
            <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
              <div style={{ fontSize: "100px", display: "flex" }}>
                {hasCharacter ? archetype.icon : quiz.icon}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {hasCharacter && (
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 500,
                      color: character.color,
                      textTransform: "uppercase" as const,
                      letterSpacing: "2px",
                    }}
                  >
                    {character.titleEn}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "52px",
                    fontWeight: 800,
                    lineHeight: 1.1,
                    background: `linear-gradient(135deg, ${quiz.gradient[0]}, ${quiz.gradient[1]})`,
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {hasCharacter ? character.nameEn : quiz.taglineEn}
                </div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 600,
                    color: "#cbd5e1",
                  }}
                >
                  {hasCharacter ? character.name : quiz.tagline}
                </div>
                {hasCharacter && (
                  <div
                    style={{
                      fontSize: "16px",
                      color: "#94a3b8",
                      maxWidth: "500px",
                      lineHeight: 1.4,
                      marginTop: "4px",
                    }}
                  >
                    {`Core type: ${archetype.nameEn} ${archetype.icon}`}
                  </div>
                )}
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
                  {`${quiz.taglineEn}`}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  borderRadius: "16px",
                  background: `linear-gradient(135deg, ${quiz.gradient[0]}, ${quiz.gradient[1]})`,
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                {`Find yours at gametan.ai/quiz/${gameId}`}
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
    console.error("Game card error:", error);
    return new Response("Error generating card", { status: 500 });
  }
}
