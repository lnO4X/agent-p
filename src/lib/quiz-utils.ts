import type { TalentCategory } from "@/types/talent";

/**
 * Parse quick-test scores from URL: "78-45-62" → [78, 45, 62]
 */
export function parseScores(s: string | null): [number, number, number] | null {
  if (!s) return null;
  const parts = s.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return parts as [number, number, number];
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
