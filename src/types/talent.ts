export const TALENT_CATEGORIES = [
  "reaction_speed",
  "hand_eye_coord",
  "spatial_awareness",
  "memory",
  "strategy_logic",
  "rhythm_sense",
  "pattern_recog",
  "multitasking",
  "decision_speed",
  "emotional_control",
  "teamwork_tendency",
  "risk_assessment",
  "resource_mgmt",
] as const;

export type TalentCategory = (typeof TALENT_CATEGORIES)[number];

export type Rank = "S" | "A" | "B" | "C" | "D";

export interface TalentScore {
  category: TalentCategory;
  score: number; // 0-100
  rank: Rank;
}

export interface TalentProfile {
  scores: Record<TalentCategory, number>;
  overallScore: number;
  overallRank: Rank;
}

export interface GenreRecommendation {
  genre: string;
  name: string;
  nameZh: string;
  fitScore: number;
}
