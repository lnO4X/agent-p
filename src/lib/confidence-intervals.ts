import type { TalentCategory } from "@/types/talent";

/**
 * Test-retest reliability coefficients (r) from published literature.
 * Higher r = more stable across sessions = narrower CI.
 *
 * Sources:
 *  - Simple RT (0.68): Deary et al. 2001; Bridges 2020 Human Benchmark
 *  - Stroop interference (0.85): MacLeod 1991 meta-analysis
 *  - Flanker effect (0.80): Eriksen 1974; modern replications
 *  - Corsi span (0.80): Kessels et al. 2000
 *  - N-Back (0.75): Jaeggi et al. 2010
 *  - Mental Rotation (0.85): Shepard & Metzler 1971
 *  - UFOV (0.80): Edwards et al. 2005
 *  - Task-Switching (0.70): Monsell 2003
 *  - Go/No-Go (0.75): Logan 1994
 *  - BART (0.55): Lejuez 2002 — behavioural measures are noisier
 *  - IGT (0.55): Bechara 2001 — learning task, lower reliability
 *  - MOT (0.70): Pylyshyn & Storm 1988
 *  - Posner Cueing (0.70): Posner & Petersen 1990
 *  - Perspective Taking (0.65): Samson et al. 2010
 *  - SMS Tapping (0.75): Repp 2005 review
 *  - Pursuit Rotor / Hand-Eye (0.60): classic motor-learning estimate
 *  - Dual-Task (0.70): Pashler 1994
 */
export const PARADIGM_RELIABILITY: Record<TalentCategory, number> = {
  reaction_speed: 0.68,
  hand_eye_coord: 0.6,
  spatial_awareness: 0.82, // avg of MR 0.85 and MOT 0.70 weighted by primary
  memory: 0.78, // avg of Corsi 0.80 and N-Back 0.75
  strategy_logic: 0.73, // avg of Go/No-Go 0.75 and Task-Switch 0.70
  rhythm_sense: 0.75, // SMS
  pattern_recog: 0.7, // Posner
  multitasking: 0.7, // Dual-task / Pashler
  decision_speed: 0.55, // IGT + Task-Switch — low end behavioural
  emotional_control: 0.83, // Stroop + Flanker — high reliability
  teamwork_tendency: 0.65, // Samson perspective-taking
  risk_assessment: 0.55, // BART
  resource_mgmt: 0.8, // UFOV
};

/**
 * Compute a 95% confidence interval for a normalized percentile score (1–99).
 *
 * Methodology:
 *   SE = sigma_scaled * sqrt(1 − r)
 *   CI95 = score ± 1.96 × SE
 *
 * For percentile scores with approximate SD≈25 across the 1–99 range,
 * the simplified form is:
 *   halfWidth = 1.96 × 25 × sqrt(1 − r) ≈ 49 × sqrt(1 − r)
 *
 * Lower-reliability tests produce wider CIs (more honest about noise).
 * Results are clamped to [1, 99].
 *
 * @param percentileScore  normalized score (1–99)
 * @param reliability      test-retest r for the paradigm (0–1)
 * @returns                [lower, upper] CI95 bounds as integers in [1, 99]
 */
export function computeCI95(
  percentileScore: number,
  reliability: number,
): [number, number] {
  const SIGMA = 25;
  const halfWidth = 1.96 * SIGMA * Math.sqrt(Math.max(0, 1 - reliability));
  const lower = Math.max(1, Math.round(percentileScore - halfWidth));
  const upper = Math.min(99, Math.round(percentileScore + halfWidth));
  return [lower, upper];
}

/**
 * Convenience: CI95 for a specific talent dimension.
 */
export function getDimensionCI95(
  category: TalentCategory,
  score: number,
): [number, number] {
  const r = PARADIGM_RELIABILITY[category] ?? 0.7;
  return computeCI95(score, r);
}

/**
 * Human-readable CI description for UI.
 * e.g. "72 (62–82)"
 */
export function formatScoreCI(score: number, ci: [number, number]): string {
  return `${Math.round(score)} (${ci[0]}\u2013${ci[1]})`;
}
