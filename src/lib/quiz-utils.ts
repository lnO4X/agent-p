import type { TalentCategory } from "@/types/talent";

/**
 * Parse test scores from URL: "78-45-62" → [78, 45, 62]
 * Accepts any number of scores (Quick=3, Standard=7, Pro=17).
 */
export function parseScores(s: string | null): number[] | null {
  if (!s) return null;
  const parts = s.split("-");
  if (parts.length === 0 || parts.some((p) => p === "" || isNaN(Number(p)))) return null;
  return parts.map(Number);
}

/**
 * Parse questionnaire talent scores from URL: "reaction_speed:75,memory:60,..."
 */
export function parseTalentScores(
  s: string | null
): Partial<Record<TalentCategory, number>> | null {
  if (!s) return null;
  const result: Partial<Record<TalentCategory, number>> = {};
  for (const pair of s.split(",")) {
    const [key, val] = pair.split(":");
    if (key && val && !isNaN(Number(val))) {
      result[key as TalentCategory] = Number(val);
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}
