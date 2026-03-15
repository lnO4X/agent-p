import { NextRequest } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/admin";
import { db } from "@/db";
import {
  users,
  testSessions,
  talentProfiles,
  partners,
  microChallenges,
  activationCodes,
  userKnowledge,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/admin/users/[id] — Detailed user profile for admin
 *
 * Returns: user info + test sessions + talent profile + partners + challenges + codes used
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminOrCronSecret(
    request.headers.get("authorization")
  );
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch all data in parallel
  const [
    userResult,
    sessionsResult,
    latestProfile,
    partnersList,
    challengesList,
    codesUsed,
    knowledgeEntries,
  ] = await Promise.all([
    db.select().from(users).where(eq(users.id, id)).limit(1),
    db
      .select({
        id: testSessions.id,
        status: testSessions.status,
        startedAt: testSessions.startedAt,
        completedAt: testSessions.completedAt,
      })
      .from(testSessions)
      .where(eq(testSessions.userId, id))
      .orderBy(desc(testSessions.startedAt))
      .limit(20),
    db
      .select()
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, id))
      .orderBy(desc(talentProfiles.createdAt))
      .limit(1),
    db
      .select({
        id: partners.id,
        slot: partners.slot,
        name: partners.name,
        avatar: partners.avatar,
        memory: partners.memory,
        definition: partners.definition,
        createdAt: partners.createdAt,
      })
      .from(partners)
      .where(eq(partners.userId, id))
      .orderBy(partners.slot),
    db
      .select({
        id: microChallenges.id,
        gameId: microChallenges.gameId,
        talentCategory: microChallenges.talentCategory,
        score: microChallenges.score,
        completedAt: microChallenges.completedAt,
      })
      .from(microChallenges)
      .where(eq(microChallenges.userId, id))
      .orderBy(desc(microChallenges.completedAt))
      .limit(30),
    db
      .select({
        id: activationCodes.id,
        code: activationCodes.code,
        durationDays: activationCodes.durationDays,
        usedAt: activationCodes.usedAt,
      })
      .from(activationCodes)
      .where(eq(activationCodes.usedBy, id))
      .orderBy(desc(activationCodes.usedAt)),
    db
      .select({
        id: userKnowledge.id,
        category: userKnowledge.category,
        key: userKnowledge.key,
        value: userKnowledge.value,
        confidence: userKnowledge.confidence,
        updatedAt: userKnowledge.updatedAt,
      })
      .from(userKnowledge)
      .where(eq(userKnowledge.userId, id))
      .orderBy(desc(userKnowledge.updatedAt))
      .limit(50),
  ]);

  const user = userResult[0];
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Don't leak password hash
  const { passwordHash: _, ...safeUser } = user;

  return Response.json({
    success: true,
    data: {
      user: safeUser,
      sessions: sessionsResult,
      talentProfile: latestProfile[0] || null,
      partners: partnersList,
      challenges: challengesList,
      codesUsed,
      knowledge: knowledgeEntries,
    },
  });
}
