import { ImageResponse } from "next/og";

export const runtime = "nodejs";

/**
 * GET /api/home-card — Homepage OG share card (1200×630)
 * Shows brand + value prop + key stats for social sharing
 */
export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
            color: "white",
            background: "linear-gradient(135deg, #0F1117 0%, #0A2A22 50%, #0F1117 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: "-150px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "600px",
              height: "400px",
              background: "radial-gradient(ellipse, rgba(0,212,170,0.15) 0%, transparent 70%)",
              display: "flex",
            }}
          />

          {/* Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "4px",
              marginBottom: "24px",
            }}
          >
            <span style={{ fontSize: "72px", fontWeight: 800, color: "#F0F0F0" }}>
              Game
            </span>
            <span style={{ fontSize: "72px", fontWeight: 800, color: "#00D4AA" }}>
              Tan
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "32px",
              fontWeight: 600,
              color: "#F0F0F0",
              marginBottom: "16px",
              display: "flex",
            }}
          >
            Do You Have What It Takes to Go Pro?
          </div>

          {/* Sub */}
          <div
            style={{
              fontSize: "20px",
              color: "#8B8FA3",
              marginBottom: "40px",
              display: "flex",
            }}
          >
            3 mini-games · Pro player benchmarks · Instant results
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "48px",
              alignItems: "center",
            }}
          >
            {[
              { label: "Mini-Games", value: "3" },
              { label: "Talent Dimensions", value: "13" },
              { label: "Archetypes", value: "16" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "36px", fontWeight: 700, color: "#00D4AA" }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: "14px", color: "#8B8FA3" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Contrast bar */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              marginTop: "32px",
              fontSize: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "120px", height: "6px", borderRadius: "3px", background: "rgba(255,184,0,0.5)", display: "flex" }} />
              <span style={{ color: "#FFB800" }}>98% want to go pro</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "4px", height: "6px", borderRadius: "3px", background: "#00D4AA", display: "flex" }} />
              <span style={{ color: "#00D4AA" }}>{`<1% make it`}</span>
            </div>
          </div>

          {/* URL */}
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              fontSize: "16px",
              color: "#565B6E",
              display: "flex",
            }}
          >
            gametan.ai
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch {
    return new Response("Failed to generate image", { status: 500 });
  }
}
