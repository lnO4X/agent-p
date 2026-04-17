import { NextResponse } from "next/server";
import { db } from "@/db";
import { talentProfiles } from "@/db/schema";
import { eq, or, isNull } from "drizzle-orm";
import { scoreToArchetype } from "@/lib/archetype";
import type { TalentCategory } from "@/types/talent";

// GET handler for Vercel Cron (sends GET with Authorization: Bearer CRON_SECRET)
export async function GET(request: Request) {
  return handleBackfill(request);
}

// POST handler for manual invocation
export async function POST(request: Request) {
  return handleBackfill(request);
}

async function handleBackfill(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await db
    .select()
    .from(talentProfiles)
    .where(
      or(
        isNull(talentProfiles.archetypeId),
        eq(talentProfiles.archetypeId, "")
      )
    );

  const results: Array<{ id: string; archetypeId: string }> = [];

  for (const p of profiles) {
    const scores: Partial<Record<TalentCategory, number>> = {};
    if (p.reactionSpeed != null) scores.reaction_speed = p.reactionSpeed;
    if (p.handEyeCoord != null) scores.hand_eye_coord = p.handEyeCoord;
    if (p.spatialAwareness != null) scores.spatial_awareness = p.spatialAwareness;
    if (p.memory != null) scores.memory = p.memory;
    if (p.strategyLogic != null) scores.strategy_logic = p.strategyLogic;
    if (p.rhythmSense != null) scores.rhythm_sense = p.rhythmSense;
    if (p.patternRecog != null) scores.pattern_recog = p.patternRecog;
    if (p.multitasking != null) scores.multitasking = p.multitasking;
    if (p.decisionSpeed != null) scores.decision_speed = p.decisionSpeed;
    if (p.emotionalControl != null) scores.emotional_control = p.emotionalControl;
    if (p.teamworkTendency != null) scores.teamwork_tendency = p.teamworkTendency;
    if (p.riskAssessment != null) scores.risk_assessment = p.riskAssessment;
    if (p.resourceMgmt != null) scores.resource_mgmt = p.resourceMgmt;

    const archetype = scoreToArchetype(scores);

    await db
      .update(talentProfiles)
      .set({ archetypeId: archetype.id })
      .where(eq(talentProfiles.id, p.id));

    results.push({ id: p.id, archetypeId: archetype.id });
  }

  return NextResponse.json({
    success: true,
    message: `Backfilled ${results.length} profiles`,
    data: results,
  });
}
