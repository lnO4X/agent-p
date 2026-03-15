import { db } from "@/db";
import { games, gameRecommendations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { TalentCategory, GenreRecommendation } from "@/types/talent";
import { GENRE_TALENT_MAP, TALENT_LABELS } from "./constants";
import { scoreToRank } from "./scoring";

/**
 * Generate game recommendations for a talent profile.
 *
 * Algorithm:
 * 1. Use genreRecommendations (genre fit scores) from the talent profile
 * 2. Query all active games from DB
 * 3. For each game: sum(genre fitScores for game's genres) + popularity bonus
 * 4. Sort descending, take topN
 * 5. Generate human-readable reason per game
 *
 * @param profileId - talent profile ID
 * @param talentScores - user's talent category scores
 * @param genreRecs - genre recommendations from recommendGenres()
 * @param topN - number of games to recommend (default: 20)
 */
export async function generateGameRecommendations(
  profileId: string,
  talentScores: Partial<Record<TalentCategory, number>>,
  genreRecs: GenreRecommendation[],
  topN: number = 20
): Promise<void> {
  // Build genre fitScore lookup
  const genreFitMap = new Map<string, number>();
  for (const rec of genreRecs) {
    genreFitMap.set(rec.genre, rec.fitScore);
  }

  // Also compute fit scores for genres not in top-N recommendations
  for (const [genre, config] of Object.entries(GENRE_TALENT_MAP)) {
    if (!genreFitMap.has(genre)) {
      const fitScore = config.requiredTalents.reduce(
        (sum, { category, weight }) => sum + (talentScores[category] || 0) * weight,
        0
      );
      genreFitMap.set(genre, Math.round(fitScore * 10) / 10);
    }
  }

  // Get all active games
  const allGames = await db
    .select()
    .from(games)
    .where(eq(games.status, "active"));

  if (allGames.length === 0) return;

  // Score each game
  const scored = allGames.map((game) => {
    const gameGenres = (game.genres as string[]) || [];
    const gamePopularity = game.popularity ?? 0;

    // Genre match score: average of fit scores for the game's genres
    let genreScore = 0;
    let genreCount = 0;
    for (const g of gameGenres) {
      const fit = genreFitMap.get(g);
      if (fit != null) {
        genreScore += fit;
        genreCount++;
      }
    }
    const avgGenreScore = genreCount > 0 ? genreScore / genreCount : 0;

    // Popularity bonus: 0-10 points (10% weight of a 100-score genre)
    const popularityBonus = (gamePopularity / 100) * 10;

    const totalScore = avgGenreScore + popularityBonus;

    return {
      gameId: game.id,
      gameName: game.name,
      gameGenres,
      totalScore,
      avgGenreScore,
    };
  });

  // Sort and take topN
  scored.sort((a, b) => b.totalScore - a.totalScore);
  const topGames = scored.slice(0, topN);

  // Generate reasons
  const recommendations = topGames.map((g, index) => {
    const reason = buildReason(g.gameGenres, talentScores, genreFitMap);
    return {
      id: nanoid(),
      profileId,
      gameId: g.gameId,
      fitScore: Math.round(g.totalScore * 10) / 10,
      rank: index + 1,
      reason,
      createdAt: new Date(),
    };
  });

  // Replace old recommendations atomically (delete + insert in transaction)
  await db.transaction(async (tx) => {
    await tx
      .delete(gameRecommendations)
      .where(eq(gameRecommendations.profileId, profileId));

    if (recommendations.length > 0) {
      await tx.insert(gameRecommendations).values(recommendations);
    }
  });
}

/**
 * Build bilingual recommendation reasons.
 * Stored as "zh|||en" format so frontend can split by locale.
 *
 * Example ZH: "反应速度 S级 + 手眼协调 A级，射击类游戏是你的强项"
 * Example EN: "Reaction Speed S + Hand-Eye Coordination A — Shooter is your strength"
 */
function buildReason(
  gameGenres: string[],
  talentScores: Partial<Record<TalentCategory, number>>,
  genreFitMap: Map<string, number>
): string {
  // Find the best-matching genre for this game
  let bestGenre = gameGenres[0] || "";
  let bestFit = 0;
  for (const g of gameGenres) {
    const fit = genreFitMap.get(g) ?? 0;
    if (fit > bestFit) {
      bestFit = fit;
      bestGenre = g;
    }
  }

  // Find top 2 talents relevant to this genre
  const genreConfig = GENRE_TALENT_MAP[bestGenre];
  if (!genreConfig) return "";

  const topTalents = genreConfig.requiredTalents
    .map((t) => ({
      category: t.category,
      score: talentScores[t.category] ?? 0,
      rank: scoreToRank(talentScores[t.category] ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  // Chinese reason
  const zhParts = topTalents
    .map(
      (t) =>
        `${TALENT_LABELS[t.category]?.zh ?? t.category} ${t.rank}级`
    )
    .join(" + ");
  const zhReason = `${zhParts}，${genreConfig.nameZh}是你的强项`;

  // English reason
  const enParts = topTalents
    .map(
      (t) =>
        `${TALENT_LABELS[t.category]?.en ?? t.category} ${t.rank}`
    )
    .join(" + ");
  const enReason = `${enParts} — ${genreConfig.name} is your strength`;

  return `${zhReason}|||${enReason}`;
}

/**
 * Get recommendations for a user's latest profile.
 * Used by the recommend API endpoint.
 */
export async function getRecommendationsForProfile(profileId: string) {
  const recs = await db
    .select({
      id: gameRecommendations.id,
      fitScore: gameRecommendations.fitScore,
      rank: gameRecommendations.rank,
      reason: gameRecommendations.reason,
      gameId: games.id,
      gameName: games.name,
      gameNameEn: games.nameEn,
      gameSlug: games.slug,
      gameCoverUrl: games.coverUrl,
      gameRating: games.rating,
      gamePlatforms: games.platforms,
      gameGenres: games.genres,
    })
    .from(gameRecommendations)
    .innerJoin(games, eq(gameRecommendations.gameId, games.id))
    .where(eq(gameRecommendations.profileId, profileId))
    .orderBy(sql`${gameRecommendations.rank} ASC`);

  return recs;
}
