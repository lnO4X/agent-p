import { getArchetype, type Archetype } from "./archetype";

export interface CompatResult {
  score: number; // 0-100
  labelKey: string; // i18n key for the label
  dynamic: string; // zh
  dynamicEn: string; // en
  strengths: string[];
  strengthsEn: string[];
  challenges: string[];
  challengesEn: string[];
}

/**
 * Compute compatibility between two archetypes.
 * Score 0-100 based on relationship (nemesis/ally), talent overlap,
 * and genre intersection.
 */
export function computeCompatibility(
  aId: string,
  bId: string
): CompatResult | null {
  const a = getArchetype(aId);
  const b = getArchetype(bId);
  if (!a || !b) return null;

  // Same type
  if (a.id === b.id) {
    return {
      score: 75,
      labelKey: "compat.mirror",
      dynamic: `两个${a.name}在一起，默契满分但容易陷入相同的盲区。你们能完美配合，但也会放大对方的弱点。`,
      dynamicEn: `Two ${a.nameEn}s together — perfect sync but identical blind spots. You amplify each other's strengths AND weaknesses.`,
      strengths: ["完美理解对方的思路", "无需沟通的默契配合"],
      strengthsEn: ["Perfect understanding of each other's mindset", "Wordless coordination"],
      challenges: [`共同弱点：${a.weakness.slice(0, 20)}...`, "缺少互补性"],
      challengesEn: [`Shared weakness: ${a.weaknessEn.slice(0, 30)}...`, "No complementary balance"],
    };
  }

  let score = 50; // Base score

  // Relationship bonus/penalty
  if (a.nemesisId === b.id) score -= 20; // Nemesis pair
  if (a.allyId === b.id) score += 25; // Ally pair
  if (b.allyId === a.id) score += 10; // Mutual ally bonus

  // Evolution connection
  if (a.evolutionId === b.id || b.evolutionId === a.id) score += 10;

  // Genre overlap (shared genres = more common ground)
  const sharedGenres = a.genres.filter((g) => b.genres.includes(g));
  score += sharedGenres.length * 5;

  // Talent complementarity (different strong talents = more complementary)
  if (a.strongTalent !== b.strongTalent) score += 8;
  // If one's strength covers the other's weakness
  if (a.strongTalent === b.weakTalent) score += 5;
  if (b.strongTalent === a.weakTalent) score += 5;

  // Clamp
  score = Math.max(10, Math.min(98, score));

  // Generate dynamic text based on relationship
  const { dynamic, dynamicEn, strengths, strengthsEn, challenges, challengesEn } =
    generateDynamicText(a, b, score, sharedGenres);

  // Label key
  let labelKey: string;
  if (score >= 85) labelKey = "compat.soulmate";
  else if (score >= 70) labelKey = "compat.great";
  else if (score >= 55) labelKey = "compat.good";
  else if (score >= 40) labelKey = "compat.neutral";
  else if (score >= 25) labelKey = "compat.challenging";
  else labelKey = "compat.rival";

  return { score, labelKey, dynamic, dynamicEn, strengths, strengthsEn, challenges, challengesEn };
}

function generateDynamicText(
  a: Archetype,
  b: Archetype,
  score: number,
  sharedGenres: string[]
): {
  dynamic: string;
  dynamicEn: string;
  strengths: string[];
  strengthsEn: string[];
  challenges: string[];
  challengesEn: string[];
} {
  const isNemesis = a.nemesisId === b.id;
  const isAlly = a.allyId === b.id || b.allyId === a.id;
  const coversWeakness = a.strongTalent === b.weakTalent || b.strongTalent === a.weakTalent;

  const strengths: string[] = [];
  const strengthsEn: string[] = [];
  const challenges: string[] = [];
  const challengesEn: string[] = [];

  if (isAlly) {
    strengths.push("天然的默契搭档");
    strengthsEn.push("Natural synergy between these types");
  }
  if (coversWeakness) {
    strengths.push("互补弱点，覆盖对方的盲区");
    strengthsEn.push("Complementary talents — each covers the other's blind spot");
  }
  if (sharedGenres.length >= 2) {
    strengths.push("共同热爱多种游戏类型");
    strengthsEn.push("Shared love for multiple game genres");
  }
  if (a.strongTalent !== b.strongTalent) {
    strengths.push("各有专长，分工明确");
    strengthsEn.push("Different specialties enable clear role division");
  }

  if (isNemesis) {
    challenges.push("天敌关系——游戏风格根本性冲突");
    challengesEn.push("Nemesis pair — fundamentally opposing playstyles");
  }
  if (a.weakTalent === b.weakTalent) {
    challenges.push("共同弱点，关键时刻可能同时掉链子");
    challengesEn.push("Shared weakness — both may fail at the same critical moments");
  }
  if (sharedGenres.length === 0) {
    challenges.push("游戏偏好完全不同");
    challengesEn.push("Completely different game preferences");
  }

  // Ensure at least one strength and challenge
  if (strengths.length === 0) {
    strengths.push("能从对方身上学到新的游戏视角");
    strengthsEn.push("Can learn new gaming perspectives from each other");
  }
  if (challenges.length === 0) {
    challenges.push("需要主动沟通游戏偏好的差异");
    challengesEn.push("Need to actively communicate about preference differences");
  }

  // Dynamic summary
  let dynamic: string;
  let dynamicEn: string;

  if (isNemesis) {
    dynamic = `${a.name}和${b.name}是经典的天敌配对。${a.name}的${a.strongTalent === "reaction_speed" ? "极速" : "策略"}与${b.name}的${b.strongTalent === "reaction_speed" ? "极速" : "策略"}形成根本性对抗。但正因如此，你们能从对方身上学到最多。`;
    dynamicEn = `${a.nameEn} and ${b.nameEn} are classic rivals. Their opposing strengths create fundamental tension — but that's exactly why you can learn the most from each other.`;
  } else if (isAlly) {
    dynamic = `${a.name}和${b.name}是天作之合！你们的游戏风格高度互补，在组队时能产生 1+1>2 的化学反应。`;
    dynamicEn = `${a.nameEn} and ${b.nameEn} are a perfect match! Your playstyles complement each other beautifully, creating chemistry that's greater than the sum of its parts.`;
  } else if (score >= 70) {
    dynamic = `${a.name}和${b.name}有很高的默契度。共同的游戏偏好和互补的天赋让你们成为出色的搭档。`;
    dynamicEn = `${a.nameEn} and ${b.nameEn} have great synergy. Shared gaming preferences and complementary talents make you excellent partners.`;
  } else if (score >= 45) {
    dynamic = `${a.name}和${b.name}的配对充满可能性。不同的优势意味着你们需要更多沟通，但也能带来意想不到的组合效果。`;
    dynamicEn = `${a.nameEn} and ${b.nameEn} have interesting potential. Different strengths mean you'll need more communication, but can produce surprising synergies.`;
  } else {
    dynamic = `${a.name}和${b.name}是充满挑战的配对。风格差异巨大，但如果能跨越这道鸿沟，你们将成为最强的组合。`;
    dynamicEn = `${a.nameEn} and ${b.nameEn} are a challenging pair. Vast style differences exist, but bridging that gap creates the strongest possible combination.`;
  }

  return { dynamic, dynamicEn, strengths, strengthsEn, challenges, challengesEn };
}
