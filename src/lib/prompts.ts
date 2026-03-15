import type { TalentCategory, GenreRecommendation } from "@/types/talent";
import { TALENT_LABELS } from "./constants";
import { scoreToRank } from "./scoring";

export function buildTalentAnalysisPrompt(
  scores: Partial<Record<TalentCategory, number>>,
  overallScore: number,
  overallRank: string,
  genres: GenreRecommendation[]
): string {
  const scoreLines = Object.entries(scores)
    .filter(([, v]) => v != null)
    .map(([cat, score]) => {
      const label = TALENT_LABELS[cat as TalentCategory];
      return `- ${label.zh}(${label.en}): ${score}/100 (${scoreToRank(score!)})`;
    })
    .join("\n");

  const genreLines = genres
    .map((g, i) => `${i + 1}. ${g.nameZh} (${g.name}) - 匹配度: ${g.fitScore}`)
    .join("\n");

  return `你是一位专业的游戏天赋分析师。请分析以下玩家的天赋测试结果并提供个性化建议。

## 天赋数据 (0-100分, S/A/B/C/D等级)
${scoreLines}

综合评分: ${overallScore}/100 (${overallRank})

## 推荐游戏类型
${genreLines}

## 请提供以下分析:
1. **总体评价** (2-3句话总结玩家的优势和特点)
2. **突出优势** (哪些天赋最为突出，在游戏中意味着什么)
3. **提升空间** (哪些天赋可以改善，具体的练习建议)
4. **游戏推荐** (基于天赋特征推荐具体的游戏，说明为什么适合)
5. **训练建议** (2-3个具体的练习方法来提升薄弱项)

请用鼓励但诚实的语气，给出具体有用的建议。`;
}
