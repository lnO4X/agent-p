import { ImageResponse } from "next/og";
import {
  getArchetype,
  scoreToArchetype,
  quickScoresToArchetype,
} from "@/lib/archetype";
import type { TalentCategory } from "@/types/talent";

export const runtime = "nodejs";

const TALENT_LABELS_ZH: Record<string, string> = {
  reaction_speed: "反应速度",
  hand_eye_coord: "手眼协调",
  spatial_awareness: "空间感知",
  memory: "记忆力",
  strategy_logic: "策略逻辑",
  rhythm_sense: "节奏感",
  pattern_recog: "图案识别",
  multitasking: "多任务",
  decision_speed: "决策速度",
  emotional_control: "情绪控制",
  teamwork_tendency: "团队协作",
  risk_assessment: "风险评估",
  resource_mgmt: "资源管理",
};

const TALENT_LABELS_EN: Record<string, string> = {
  reaction_speed: "Reaction Speed",
  hand_eye_coord: "Hand-Eye Coord",
  spatial_awareness: "Spatial Awareness",
  memory: "Memory",
  strategy_logic: "Strategy",
  rhythm_sense: "Rhythm",
  pattern_recog: "Pattern Recognition",
  multitasking: "Multitasking",
  decision_speed: "Decision Speed",
  emotional_control: "Emotional Control",
  teamwork_tendency: "Teamwork",
  risk_assessment: "Risk Assessment",
  resource_mgmt: "Resource Mgmt",
};

const SCORE_LABELS = [
  { zh: "反应速度", en: "Reaction" },
  { zh: "模式识别", en: "Pattern" },
  { zh: "风险决策", en: "Risk" },
];

/**
 * GET /api/result-card — Generate a 1080x1920 vertical result card image
 *
 * Query params:
 *  - archetype (required): archetype ID
 *  - scores (optional): talent scores "key:value,key:value" (questionnaire mode)
 *  - s (optional): quick-test scores "78-45-62"
 *  - lang (optional): "en" or "zh", defaults to "en"
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const archetypeId = searchParams.get("archetype");
    const scoresParam = searchParams.get("scores");
    const quickScoresParam = searchParams.get("s");
    const lang = searchParams.get("lang") || "en";
    const isZh = lang === "zh";

    // Resolve archetype
    let archetype = archetypeId ? getArchetype(archetypeId) ?? null : null;

    // Parse talent scores (questionnaire mode)
    let talentScores: { key: string; score: number }[] = [];
    if (scoresParam) {
      const parsed: Partial<Record<TalentCategory, number>> = {};
      for (const pair of scoresParam.split(",")) {
        const [key, val] = pair.split(":");
        if (key && val && !isNaN(Number(val))) {
          parsed[key as TalentCategory] = Number(val);
        }
      }
      if (!archetype && Object.keys(parsed).length > 0) {
        archetype = scoreToArchetype(parsed);
      }
      // Top 3 talents sorted by score
      talentScores = Object.entries(parsed)
        .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
        .slice(0, 3)
        .map(([key, score]) => ({ key, score: score ?? 0 }));
    }

    // Parse quick-test scores
    let quickScores: { label: string; score: number }[] = [];
    if (quickScoresParam && !scoresParam) {
      const parts = quickScoresParam.split("-").map(Number);
      if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
        if (!archetype) {
          archetype = quickScoresToArchetype(parts[0], parts[1], parts[2]);
        }
        quickScores = parts.map((score, i) => ({
          label: isZh ? SCORE_LABELS[i].zh : SCORE_LABELS[i].en,
          score: Math.round(score),
        }));
      }
    }

    if (!archetype) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid archetype or scores" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build score bars data
    const scoreBars =
      talentScores.length > 0
        ? talentScores.map((t) => ({
            label: isZh
              ? TALENT_LABELS_ZH[t.key] || t.key
              : TALENT_LABELS_EN[t.key] || t.key.replace(/_/g, " "),
            score: Math.round(t.score),
          }))
        : quickScores.length > 0
          ? quickScores
          : [];

    const nemesis = getArchetype(archetype.nemesisId);
    const ally = getArchetype(archetype.allyId);

    const archetypeName = isZh ? archetype.name : archetype.nameEn;
    const tagline = isZh ? archetype.tagline : archetype.taglineEn;
    const nemesisName = nemesis
      ? isZh
        ? nemesis.name
        : nemesis.nameEn
      : "";
    const allyName = ally ? (isZh ? ally.name : ally.nameEn) : "";

    return new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1920px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: "DM Sans, sans-serif",
            color: "white",
            background: "#0F1117",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background gradient glow */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              background: `radial-gradient(ellipse 80% 50% at 50% 30%, ${archetype.gradient[0]}15, transparent 70%), radial-gradient(ellipse 60% 40% at 70% 70%, ${archetype.gradient[1]}10, transparent 60%)`,
              display: "flex",
            }}
          />

          {/* Top decorative line */}
          <div
            style={{
              width: "120px",
              height: "3px",
              marginTop: "100px",
              borderRadius: "2px",
              background: `linear-gradient(90deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
              display: "flex",
            }}
          />

          {/* Archetype Emoji */}
          <div
            style={{
              fontSize: "120px",
              marginTop: "64px",
              display: "flex",
              lineHeight: 1,
            }}
          >
            {archetype.icon}
          </div>

          {/* Spacing */}
          <div style={{ height: "48px", display: "flex" }} />

          {/* Label */}
          <div
            style={{
              fontSize: "18px",
              letterSpacing: "6px",
              color: "#6b7280",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            {isZh ? "你的玩家原型" : "YOUR GAMER ARCHETYPE"}
          </div>

          {/* Spacing */}
          <div style={{ height: "20px", display: "flex" }} />

          {/* Archetype Name - gradient text */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: 800,
              lineHeight: 1.15,
              textAlign: "center",
              maxWidth: "900px",
              background: `linear-gradient(135deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
              backgroundClip: "text",
              color: "transparent",
              display: "flex",
              padding: "0 40px",
            }}
          >
            {`${archetype.icon} ${archetypeName}`}
          </div>

          {/* Chinese subtitle when English */}
          {!isZh && (
            <div
              style={{
                fontSize: "24px",
                color: "#6b7280",
                marginTop: "8px",
                display: "flex",
              }}
            >
              {archetype.name}
            </div>
          )}

          {/* Spacing */}
          <div style={{ height: "36px", display: "flex" }} />

          {/* Tagline */}
          <div
            style={{
              fontSize: "26px",
              fontStyle: "italic",
              color: "#d1d5db",
              textAlign: "center",
              maxWidth: "800px",
              lineHeight: 1.5,
              padding: "0 60px",
              display: "flex",
            }}
          >
            {`\u201C${tagline}\u201D`}
          </div>

          {/* Spacing */}
          <div style={{ height: "64px", display: "flex" }} />

          {/* Score Bars Section */}
          {scoreBars.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "800px",
                gap: "20px",
                padding: "36px 44px",
                borderRadius: "24px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Section title */}
              <div
                style={{
                  fontSize: "16px",
                  letterSpacing: "4px",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                  display: "flex",
                }}
              >
                {isZh ? "核心天赋" : "TOP TALENTS"}
              </div>

              {scoreBars.map((bar) => (
                <div
                  key={bar.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  {/* Label */}
                  <div
                    style={{
                      width: "160px",
                      fontSize: "20px",
                      color: "#d1d5db",
                      textAlign: "right",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    {bar.label}
                  </div>
                  {/* Bar track */}
                  <div
                    style={{
                      flex: 1,
                      height: "28px",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      overflow: "hidden",
                    }}
                  >
                    {/* Bar fill */}
                    <div
                      style={{
                        width: `${bar.score}%`,
                        height: "100%",
                        borderRadius: "14px",
                        background: `linear-gradient(90deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                        display: "flex",
                      }}
                    />
                  </div>
                  {/* Score number */}
                  <div
                    style={{
                      width: "50px",
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "white",
                      display: "flex",
                    }}
                  >
                    {`${bar.score}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Spacing */}
          <div style={{ height: "48px", display: "flex" }} />

          {/* Nemesis & Ally row */}
          <div
            style={{
              display: "flex",
              gap: "48px",
              alignItems: "center",
            }}
          >
            {nemesis && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div style={{ fontSize: "28px", display: "flex" }}>
                  {nemesis.icon}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#ef4444",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      display: "flex",
                    }}
                  >
                    {isZh ? "天敌" : "NEMESIS"}
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 600,
                      color: "#fca5a5",
                      display: "flex",
                    }}
                  >
                    {nemesisName}
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div
              style={{
                width: "1px",
                height: "48px",
                background: "rgba(255,255,255,0.12)",
                display: "flex",
              }}
            />

            {ally && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div style={{ fontSize: "28px", display: "flex" }}>
                  {ally.icon}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#22c55e",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      display: "flex",
                    }}
                  >
                    {isZh ? "最佳搭档" : "BEST ALLY"}
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 600,
                      color: "#86efac",
                      display: "flex",
                    }}
                  >
                    {allyName}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Push branding to bottom */}
          <div style={{ flex: 1, display: "flex" }} />

          {/* Branding footer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              marginBottom: "100px",
            }}
          >
            {/* Decorative line with text */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "1px",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                }}
              />
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  letterSpacing: "3px",
                  color: "#00D4AA",
                  display: "flex",
                }}
              >
                gametan.ai
              </div>
              <div
                style={{
                  width: "60px",
                  height: "1px",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                }}
              />
            </div>
            <div
              style={{
                fontSize: "18px",
                color: "#6b7280",
                display: "flex",
              }}
            >
              {isZh ? "扫码测出你的玩家原型" : "Find your gamer archetype"}
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
      }
    );
  } catch (error) {
    console.error("Result card error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error generating result card" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
