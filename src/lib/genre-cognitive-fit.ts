import type { TalentCategory, TalentProfile } from "@/types/talent";

export type GameGenreId =
  | "fps"
  | "moba"
  | "rts"
  | "battle_royale"
  | "rhythm"
  | "puzzle"
  | "rpg"
  | "card"
  | "racing"
  | "simulation";

export interface GenreProfile {
  id: GameGenreId;
  nameEn: string;
  nameZh: string;
  /** Top cognitive dimensions emphasized by this genre, with weights (0-1). */
  keyDimensions: { cat: TalentCategory; weight: number }[];
  exampleGames: string[];
  source: string;
}

/**
 * Published gamer cognitive profiles. Weights are derived from published
 * effect sizes of gamer-vs-control studies or author expertise where
 * literature is thin.
 *
 * Sources:
 *  - Dale & Green 2017: Action/FPS — enhanced attention, multitasking, RT
 *  - Green & Bavelier 2003/2012: Action games → UFOV, attention breadth
 *  - Kowal et al. 2018: MOBA e-sports — working memory, task-switching
 *  - Thompson et al. 2013: RTS (StarCraft) — cognitive flexibility, WM
 *  - Bediou et al. 2018 meta: action video games cognitive benefits
 *  - Repp 2005: rhythm & timing
 */
export const GENRE_PROFILES: GenreProfile[] = [
  {
    id: "fps",
    nameEn: "FPS (First-Person Shooter)",
    nameZh: "FPS 射击游戏",
    keyDimensions: [
      { cat: "reaction_speed", weight: 1.0 },
      { cat: "hand_eye_coord", weight: 0.9 },
      { cat: "resource_mgmt", weight: 0.8 }, // UFOV / visual attention
      { cat: "multitasking", weight: 0.8 },
      { cat: "pattern_recog", weight: 0.6 },
      { cat: "emotional_control", weight: 0.5 },
    ],
    exampleGames: ["Valorant", "CS2", "Apex Legends", "Overwatch"],
    source: "Dale & Green 2017; Green & Bavelier 2003",
  },
  {
    id: "moba",
    nameEn: "MOBA",
    nameZh: "MOBA",
    keyDimensions: [
      { cat: "memory", weight: 1.0 },
      { cat: "strategy_logic", weight: 0.9 }, // Go/No-Go → inhibitory control
      { cat: "decision_speed", weight: 0.9 },
      { cat: "multitasking", weight: 0.8 },
      { cat: "teamwork_tendency", weight: 0.7 },
      { cat: "pattern_recog", weight: 0.7 },
    ],
    exampleGames: ["League of Legends", "Dota 2", "Honor of Kings"],
    source: "Kowal et al. 2018",
  },
  {
    id: "rts",
    nameEn: "RTS (Real-Time Strategy)",
    nameZh: "RTS 即时战略",
    keyDimensions: [
      { cat: "strategy_logic", weight: 1.0 },
      { cat: "multitasking", weight: 1.0 },
      { cat: "memory", weight: 0.9 },
      { cat: "decision_speed", weight: 0.8 },
      { cat: "hand_eye_coord", weight: 0.7 }, // APM
      { cat: "resource_mgmt", weight: 0.8 },
    ],
    exampleGames: ["StarCraft II", "Age of Empires IV", "Company of Heroes"],
    source: "Thompson et al. 2013 (StarCraft cognitive flexibility)",
  },
  {
    id: "battle_royale",
    nameEn: "Battle Royale",
    nameZh: "大逃杀",
    keyDimensions: [
      { cat: "risk_assessment", weight: 1.0 }, // BART
      { cat: "resource_mgmt", weight: 0.9 },
      { cat: "reaction_speed", weight: 0.8 },
      { cat: "spatial_awareness", weight: 0.8 },
      { cat: "decision_speed", weight: 0.7 },
      { cat: "multitasking", weight: 0.6 },
    ],
    exampleGames: ["PUBG", "Fortnite", "Call of Duty: Warzone"],
    source: "Genre-typical emphasis; no single canonical study",
  },
  {
    id: "rhythm",
    nameEn: "Rhythm Games",
    nameZh: "节奏游戏",
    keyDimensions: [
      { cat: "rhythm_sense", weight: 1.0 },
      { cat: "reaction_speed", weight: 0.9 },
      { cat: "hand_eye_coord", weight: 0.9 },
      { cat: "pattern_recog", weight: 0.6 },
    ],
    exampleGames: ["osu!", "Beat Saber", "Dance Dance Revolution"],
    source: "Repp 2005 review; rhythm-specific timing research",
  },
  {
    id: "puzzle",
    nameEn: "Puzzle Games",
    nameZh: "解谜游戏",
    keyDimensions: [
      { cat: "spatial_awareness", weight: 1.0 },
      { cat: "pattern_recog", weight: 0.9 },
      { cat: "memory", weight: 0.7 },
      { cat: "strategy_logic", weight: 0.7 },
    ],
    exampleGames: ["Portal 2", "The Witness", "Baba Is You"],
    source: "Spatial cognition literature; Uttal et al. 2013",
  },
  {
    id: "rpg",
    nameEn: "RPG",
    nameZh: "角色扮演",
    keyDimensions: [
      { cat: "memory", weight: 0.8 },
      { cat: "strategy_logic", weight: 0.8 },
      { cat: "decision_speed", weight: 0.6 },
      { cat: "resource_mgmt", weight: 0.7 },
    ],
    exampleGames: ["Elden Ring", "Baldur's Gate 3", "The Witcher 3"],
    source: "Genre-typical emphasis; less time-pressured than action genres",
  },
  {
    id: "card",
    nameEn: "Card / Deckbuilder",
    nameZh: "卡牌/构筑",
    keyDimensions: [
      { cat: "strategy_logic", weight: 1.0 },
      { cat: "memory", weight: 0.9 },
      { cat: "risk_assessment", weight: 0.8 },
      { cat: "decision_speed", weight: 0.5 },
    ],
    exampleGames: ["Hearthstone", "Magic: The Gathering Arena", "Slay the Spire"],
    source: "Strategy literature adapted",
  },
  {
    id: "racing",
    nameEn: "Racing / Driving",
    nameZh: "竞速",
    keyDimensions: [
      { cat: "reaction_speed", weight: 0.9 },
      { cat: "hand_eye_coord", weight: 1.0 },
      { cat: "spatial_awareness", weight: 0.8 },
      { cat: "rhythm_sense", weight: 0.5 },
    ],
    exampleGames: ["Forza", "Gran Turismo", "iRacing"],
    source: "Motor-cognitive co-ordination literature",
  },
  {
    id: "simulation",
    nameEn: "Simulation / Sandbox",
    nameZh: "模拟/沙盒",
    keyDimensions: [
      { cat: "resource_mgmt", weight: 0.9 },
      { cat: "strategy_logic", weight: 0.8 },
      { cat: "memory", weight: 0.7 },
      { cat: "multitasking", weight: 0.6 },
    ],
    exampleGames: ["Factorio", "Cities: Skylines", "Stardew Valley"],
    source: "Genre-typical emphasis",
  },
];

export interface GenreFitResult {
  genre: GenreProfile;
  /** 0-100 — how well the user's profile matches this genre's cognitive demands */
  fitScore: number;
  /** Weighted cosine-similarity or weighted-average interpretation */
  why: string[];
}

/**
 * Compute genre fit for a user's talent profile.
 * Returns genres sorted by fit score (descending).
 */
export function computeGenreFit(profile: TalentProfile): GenreFitResult[] {
  const results: GenreFitResult[] = GENRE_PROFILES.map((genre) => {
    // Weighted average of user scores on genre's key dimensions
    let weightedSum = 0;
    let totalWeight = 0;
    const contributingDims: {
      cat: TalentCategory;
      score: number;
      weight: number;
    }[] = [];
    for (const { cat, weight } of genre.keyDimensions) {
      const s = profile.scores[cat] ?? 50;
      weightedSum += s * weight;
      totalWeight += weight;
      contributingDims.push({ cat, score: s, weight });
    }
    const fitScore = totalWeight > 0 ? weightedSum / totalWeight : 50;
    // Top 2 dimensions pushing the fit up
    const top = [...contributingDims]
      .sort((a, b) => b.score * b.weight - a.score * a.weight)
      .slice(0, 2);
    const why = top.map(
      (d) =>
        `Strong ${d.cat.replace(/_/g, " ")} (${Math.round(d.score)}/100) — a key ${genre.id} dimension`
    );
    return { genre, fitScore: Math.round(fitScore), why };
  });
  return results.sort((a, b) => b.fitScore - a.fitScore);
}
