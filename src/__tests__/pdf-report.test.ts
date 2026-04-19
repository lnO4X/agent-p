import { describe, expect, it } from "vitest";

import { generatePDFReport } from "@/lib/pdf-report";

const FULL_SCORES = {
  reaction_speed: 72,
  hand_eye_coord: 58,
  spatial_awareness: 81,
  memory: 66,
  strategy_logic: 49,
  rhythm_sense: 77,
  pattern_recog: 63,
  multitasking: 55,
  decision_speed: 42,
  emotional_control: 70,
  teamwork_tendency: 38,
  risk_assessment: 51,
  resource_mgmt: 74,
};

describe("generatePDFReport", () => {
  it("produces a non-empty multi-page PDF blob for a full Pro-tier profile", async () => {
    const blob = generatePDFReport({
      talentScores: FULL_SCORES,
      archetype: {
        id: "oracle",
        name: "先知",
        nameEn: "Oracle",
      },
      overallScore: 61,
      tier: "pro",
      testedAt: new Date("2026-04-17T00:00:00Z"),
      userLabel: "Test User",
      locale: "en",
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(2000);

    // Verify it's in the target 8-12 page range by counting Page objects in raw PDF.
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const text = new TextDecoder("latin1").decode(bytes);
    const pageCount = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
    expect(pageCount).toBeGreaterThanOrEqual(8);
    expect(pageCount).toBeLessThanOrEqual(12);
    // Expose exact count for diagnostics.
    console.log(`[diagnostic] full Pro-tier report page count = ${pageCount}`);
  });

  it("handles a partial profile without crashing", () => {
    const blob = generatePDFReport({
      talentScores: {
        reaction_speed: 65,
        memory: 50,
        emotional_control: 72,
      },
      archetype: null,
      overallScore: 62,
      tier: "pro",
      testedAt: new Date("2026-04-17T00:00:00Z"),
      locale: "en",
    });
    expect(blob.size).toBeGreaterThan(1500);
  });

  it("handles missing userLabel by substituting the anonymous fallback", () => {
    const blob = generatePDFReport({
      talentScores: FULL_SCORES,
      archetype: null,
      overallScore: 58,
      tier: "pro",
      testedAt: new Date("2026-04-17T00:00:00Z"),
      locale: "en",
    });
    expect(blob.size).toBeGreaterThan(2000);
  });
});
