"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import type { TalentCategory } from "@/types/talent";
import { TALENT_CATEGORIES } from "@/types/talent";
import { getDimensionCI95, formatScoreCI } from "@/lib/confidence-intervals";
import { getTrainability, projectScoreAfterTraining } from "@/lib/trainability";
import { computeGenreFit } from "@/lib/genre-cognitive-fit";
import { getTopRoleFits } from "@/lib/role-cognitive-fit";
import { DownloadPDFButton } from "@/components/result/download-pdf-button";

/**
 * Deep Analysis Section — only rendered for Pro/Deep users.
 *
 * Shows 4 evidence-based sections:
 *  1. Per-dimension scores with 95% CI (based on test-retest reliability)
 *  2. Trainability estimates (per published meta-analyses)
 *  3. Genre fit (vs published gamer cognitive profiles)
 *  4. Role fit (within-genre cognitive role match)
 *
 * Every claim links to /methodology for citation detail.
 */
interface DeepAnalysisSectionProps {
  talentScores: Record<string, number>; // partial TalentCategory → score
  archetype?: { id: string; name: string; nameEn: string } | null;
  overallScore?: number;
  tier?: string;
}

export function DeepAnalysisSection({
  talentScores,
  archetype = null,
  overallScore,
  tier = "pro",
}: DeepAnalysisSectionProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  // Reconstitute full TalentProfile for genre/role fit
  const profile = useMemo(() => {
    const scores = {} as Record<TalentCategory, number>;
    for (const cat of TALENT_CATEGORIES) {
      scores[cat] = talentScores[cat] ?? 50;
    }
    const vals = Object.values(scores);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { scores, overallScore: avg, overallRank: "B" as const };
  }, [talentScores]);

  const genreFits = useMemo(() => computeGenreFit(profile).slice(0, 3), [profile]);
  const roleFits = useMemo(() => getTopRoleFits(profile, 3), [profile]);

  // Dimensions to show — only those the user actually tested
  const testedDims = useMemo(() => {
    return (Object.keys(talentScores) as TalentCategory[])
      .filter((cat) => TALENT_CATEGORIES.includes(cat))
      .map((cat) => {
        const score = talentScores[cat] ?? 50;
        const ci = getDimensionCI95(cat, score);
        const train = getTrainability(cat);
        return { cat, score, ci, train };
      })
      .sort((a, b) => b.score - a.score);
  }, [talentScores]);

  const resolvedOverall = overallScore ?? profile.overallScore;

  return (
    <div className="space-y-6">
      {/* Header with methodology link */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">
            {isZh ? "深度分析" : "Deep Analysis"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isZh
              ? "基于已发表认知科学文献的深入解读"
              : "Interpretation grounded in published cognitive science"}
          </p>
        </div>
        <Link
          href="/methodology"
          className="text-xs text-primary hover:underline shrink-0"
        >
          {isZh ? "查看方法论 →" : "Methodology →"}
        </Link>
      </div>

      {/* PDF download action — Pro only (parent gates this section on Pro) */}
      <DownloadPDFButton
        talentScores={talentScores}
        archetype={archetype}
        overallScore={resolvedOverall}
        tier={tier}
      />

      {/* Section 1: Scores with CI95 */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              {isZh ? "分数 + 95% 置信区间" : "Scores + 95% Confidence Interval"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isZh
                ? "单次测试有噪声。置信区间反映文献 test-retest 信度（例：Stroop r≈0.85 → 窄区间；BART r≈0.55 → 宽区间）"
                : "A single test is noisy. CI width reflects published test-retest reliability (e.g., Stroop r≈0.85 → narrow; BART r≈0.55 → wide)."}
            </p>
          </div>
          <div className="space-y-2">
            {testedDims.slice(0, 13).map(({ cat, score, ci }) => {
              const label = isZh
                ? dimensionNameZh(cat)
                : dimensionNameEn(cat);
              const width = ((ci[1] - ci[0]) / 100) * 100;
              const leftPct = (ci[0] / 100) * 100;
              return (
                <div key={cat} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono">{formatScoreCI(score, ci)}</span>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full relative overflow-hidden">
                    <div
                      className="absolute h-full bg-primary/30 rounded-full"
                      style={{ left: `${leftPct}%`, width: `${width}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"
                      style={{ left: `calc(${score}% - 4px)` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Trainability */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              {isZh ? "可训练性分析" : "Trainability"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isZh
                ? "基于认知训练 meta 分析文献。估计不是承诺 — 遗传、动机、方法都影响实际进步。"
                : "From cognitive training meta-analyses. Estimates, not guarantees — genes, motivation, method all affect actual gains."}
            </p>
          </div>
          <div className="space-y-2">
            {testedDims.slice(0, 5).map(({ cat, score, train }) => {
              const projected = projectScoreAfterTraining(
                score,
                cat,
                train.practiceHours
              );
              const gain = Math.round(projected - score);
              const label = isZh
                ? dimensionNameZh(cat)
                : dimensionNameEn(cat);
              return (
                <div
                  key={cat}
                  className="p-2 bg-muted/20 rounded-md text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">
                      {train.trainabilityPct}% {isZh ? "上限" : "ceiling"} ·{" "}
                      {train.practiceHours}h
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {isZh
                      ? `当前 ${Math.round(score)} → 训练后 ~${Math.round(projected)} (+${gain})`
                      : `Current ${Math.round(score)} → projected ~${Math.round(projected)} (+${gain})`}
                  </div>
                  <div className="text-[11px] text-muted-foreground/80">
                    {isZh ? train.methodZh : train.methodEn}
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 italic">
                    {train.source} ·{" "}
                    {isZh ? "证据强度" : "Evidence"}: {train.evidenceStrength}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Genre fit */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              {isZh ? "游戏类型适配" : "Game Genre Fit"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isZh
                ? "基于 Dale 2017 / Green 2003 / Kowal 2018 / Thompson 2013 的文献玩家认知特征"
                : "Based on published gamer cognitive profiles (Dale & Green 2017; Kowal et al. 2018; Thompson 2013)"}
            </p>
          </div>
          <div className="space-y-2">
            {genreFits.map(({ genre, fitScore, why }) => (
              <div key={genre.id} className="p-2 bg-muted/20 rounded-md text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">
                    {isZh ? genre.nameZh : genre.nameEn}
                  </span>
                  <span className="font-mono text-primary">
                    {fitScore}/100
                  </span>
                </div>
                <div className="text-muted-foreground space-y-0.5">
                  {why.slice(0, 2).map((w, i) => (
                    <div key={i}>· {w}</div>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground/60 mt-1">
                  {isZh ? "代表作：" : "Examples: "}
                  {genre.exampleGames.slice(0, 3).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Role fit */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              {isZh ? "角色适配 (Top 3)" : "Role Fit (Top 3)"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isZh
                ? "在不同游戏中你的认知档案最适合哪种角色"
                : "Which in-game roles your cognitive profile best matches across genres"}
            </p>
          </div>
          <div className="space-y-2">
            {roleFits.map(({ role, fitScore, why }) => (
              <div key={role.id} className="p-2 bg-muted/20 rounded-md text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">
                    {isZh ? role.nameZh : role.nameEn}
                    <span className="text-muted-foreground/70 ml-1">
                      ({role.genreId.toUpperCase()})
                    </span>
                  </span>
                  <span className="font-mono text-primary">
                    {fitScore}/100
                  </span>
                </div>
                <div className="text-muted-foreground mb-1">
                  {isZh ? role.descriptionZh : role.descriptionEn}
                </div>
                <div className="text-muted-foreground/80 space-y-0.5">
                  {why.slice(0, 2).map((w, i) => (
                    <div key={i}>· {w}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Limitations */}
      <Card className="border-muted-foreground/20 bg-muted/10">
        <CardContent className="pt-3 pb-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {isZh ? "诚实声明" : "Honest Disclosure"}
          </h4>
          <ul className="text-[11px] text-muted-foreground/80 space-y-1 list-disc pl-4">
            <li>
              {isZh
                ? "这是认知评估，不是职业选手预测。成功涉及练习、战术、心态、机会等多因素。"
                : "This is a cognitive assessment, not a pro-player predictor. Success involves practice, tactics, mindset, opportunity."}
            </li>
            <li>
              {isZh
                ? "文献引用的 gamer norm 来自研究样本，不是 GameTan 自己的职业选手数据库。"
                : "Gamer norms cited are from research samples, not GameTan's own pro database."}
            </li>
            <li>
              {isZh
                ? "Trainability 上限是群体估计，个体差异大。"
                : "Trainability ceilings are group estimates; individual variance is large."}
            </li>
            <li>
              {isZh
                ? "认知测试不测游戏特定技能（英雄池、地图、意识）。"
                : "Cognitive tests do not measure game-specific skill (champions, maps, meta awareness)."}
            </li>
          </ul>
          <Link
            href="/methodology"
            className="text-[11px] text-primary hover:underline mt-2 inline-block"
          >
            {isZh ? "查看完整方法论 →" : "Read full methodology →"}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

/** Bilingual dimension labels — falls back to category key if unknown. */
function dimensionNameEn(cat: TalentCategory): string {
  const map: Record<TalentCategory, string> = {
    reaction_speed: "Reaction Speed",
    hand_eye_coord: "Hand-Eye Coordination",
    spatial_awareness: "Spatial Awareness",
    memory: "Memory",
    strategy_logic: "Response Inhibition",
    rhythm_sense: "Rhythm / Timing",
    pattern_recog: "Attention Orienting",
    multitasking: "Multitasking",
    decision_speed: "Decision-Making",
    emotional_control: "Interference Suppression",
    teamwork_tendency: "Perspective Taking",
    risk_assessment: "Risk Sensitivity",
    resource_mgmt: "Visual Attention Breadth",
  };
  return map[cat] ?? cat;
}

function dimensionNameZh(cat: TalentCategory): string {
  const map: Record<TalentCategory, string> = {
    reaction_speed: "反应速度",
    hand_eye_coord: "手眼协调",
    spatial_awareness: "空间意识",
    memory: "记忆",
    strategy_logic: "反应抑制",
    rhythm_sense: "节奏/时序",
    pattern_recog: "注意定向",
    multitasking: "多任务处理",
    decision_speed: "决策能力",
    emotional_control: "干扰抑制",
    teamwork_tendency: "视角转换",
    risk_assessment: "风险感知",
    resource_mgmt: "视觉注意广度",
  };
  return map[cat] ?? cat;
}
