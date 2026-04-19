"use client";

import { Suspense, useMemo, useEffect, useState, useCallback, useRef } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import confetti from "canvas-confetti";
import { trackEvent as track } from "@/lib/analytics";
import { TIER_CONFIGS } from "@/lib/test-tiers";
import { gameRegistry } from "@/games";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import {
  quickScoresToArchetype,
  scoreToArchetype,
  getArchetype,
} from "@/lib/archetype";
import type { Archetype } from "@/lib/archetype";
import {
  Share2,
  Swords,
  Heart,
  TrendingUp,
  ArrowRight,
  RotateCcw,
  Bot,
  Crown,
  Target,
  Copy,
  Check,
  Users,
  Trophy,
} from "lucide-react";
import { parseScores, parseTalentScores } from "@/lib/quiz-utils";
import { GameRecommendations } from "@/components/game-recommendations";
import { AdSlot } from "@/components/ad-slot";
import { ResultCardDownload } from "@/components/result-card-download";
import {
  getTierForScores,
  getLiteratureGapAnalysis,
  getSimulatedRank,
  getLiteratureInsight,
  LITERATURE_REFERENCES,
  GAMER_TOP5_AVG,
} from "@/lib/literature-norms";
import { HALL_OF_FAME } from "@/lib/hall-of-fame";
import { DistributionBar } from "@/components/distribution-bar";
import { DeepAnalysisSection } from "@/components/result/deep-analysis-section";


export default function QuizResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <QuizResultContent />
    </Suspense>
  );
}

function QuizResultContent() {
  const searchParams = useSearchParams();
  const { locale, t } = useI18n();

  const mode = searchParams.get("mode"); // "q" = questionnaire, "scenario" = scenario quiz
  const scores = parseScores(searchParams.get("s"));
  const talentScores = parseTalentScores(searchParams.get("scores"));

  const tier = (searchParams.get("tier") ?? "quick") as "quick" | "standard" | "pro";

  const archetype = useMemo<Archetype | null>(() => {
    if (mode === "q" || mode === "scenario") {
      const aId = searchParams.get("archetype");
      if (aId) return getArchetype(aId) ?? null;
      if (talentScores) return scoreToArchetype(talentScores);
      return null;
    }
    if (!scores) return null;

    // Quick test (3 scores) → use the 2-axis mapping
    if (scores.length <= 3) {
      return quickScoresToArchetype(scores[0], scores[1], scores[2]);
    }

    // Standard/Pro (7+ scores) → map scores to talent categories via tier config
    const tierConfig = TIER_CONFIGS[tier as keyof typeof TIER_CONFIGS] ?? TIER_CONFIGS.quick;
    const talentMap: Record<string, number> = {};
    tierConfig.gameIds.forEach((gameId: string, i: number) => {
      if (i < scores.length) {
        const plugin = gameRegistry.get(gameId);
        if (plugin) talentMap[plugin.primaryTalent] = scores[i];
      }
    });
    return scoreToArchetype(talentMap as Record<string, number>);
  }, [scores, mode, searchParams, talentScores, tier]);

  const nemesis = useMemo(
    () => (archetype ? getArchetype(archetype.nemesisId) : null),
    [archetype]
  );

  const ally = useMemo(
    () => (archetype ? getArchetype(archetype.allyId) : null),
    [archetype]
  );

  const isZh = locale === "zh";
  const isQuestionnaire = mode === "q" || mode === "scenario";

  const [copied, setCopied] = useState(false);
  const hasTrackedComplete = useRef(false);

  // Detect shared view: if URL has &own=1, user just completed the quiz themselves.
  // No &own param = arrived via shared link (persists across refresh, no sessionStorage needed).
  const isSharedView = !searchParams.get("own");

  // Literature-based comparison (for quick-test game mode)
  const tierInfo = useMemo(
    () => (scores ? getTierForScores(scores) : null),
    [scores]
  );
  const literatureGap = useMemo(
    () => (scores ? getLiteratureGapAnalysis(scores, isZh) : null),
    [scores, isZh]
  );
  const avgScore = useMemo(
    () => (scores ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null),
    [scores]
  );

  // Pro player from same archetype (for display reference — Hall of Fame is curated external data)
  const proPlayer = useMemo(() => {
    if (!archetype) return null;
    return HALL_OF_FAME.find((p) => p.archetypeId === archetype.id && p.role === "pro") ?? null;
  }, [archetype]);

  // Simulated rank & literature insight (game mode only)
  const simulatedRank = useMemo(
    () => (scores ? getSimulatedRank(scores) : null),
    [scores]
  );
  const literatureInsight = useMemo(
    () => (scores ? getLiteratureInsight(scores) : null),
    [scores]
  );

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !archetype) return "";
    return isQuestionnaire
      ? `${window.location.origin}/quiz/result?mode=${mode ?? "q"}&archetype=${archetype.id}${
          talentScores
            ? `&scores=${Object.entries(talentScores).map(([k, v]) => `${k}:${v}`).join(",")}`
            : ""
        }`
      : `${window.location.origin}/quiz/result?s=${(scores ?? []).join("-")}`;
  }, [archetype, isQuestionnaire, talentScores, scores]);

  const shareText = useMemo(() => {
    if (!archetype) return "";
    if (tierInfo && simulatedRank) {
      // Literature-tier share text
      const r = simulatedRank;
      const shareMap: Record<string, { zh: string; en: string }> = {
        "top-gamer-5pct": {
          zh: `我的认知档案在文献研究的前 5% 🏆 ${r.totalPopulation.toLocaleString()} 人中排前 ${r.rank}。你排第几？`,
          en: `My cognitive profile is in the top 5% of gamer research 🏆 Top ${r.rank} out of ${r.totalPopulation.toLocaleString()}. Where do you rank?`,
        },
        "top-gamer-15pct": {
          zh: `我的认知档案处于文献前 15% 💪 ${r.totalPopulation.toLocaleString()} 人中排前 ${r.rank}。你呢？`,
          en: `My cognitive profile is in the top 15% of gamer research 💪 Top ${r.rank} of ${r.totalPopulation.toLocaleString()}. What about you?`,
        },
        "top-gamer-30pct": {
          zh: `我的认知档案高于一般玩家 😤 你能超过我吗？`,
          en: `My cognitive profile is above the average gamer 😤 Can you beat me?`,
        },
        "avg-gamer": {
          zh: `测了电竞天赋，处于平均水平 — 你试试？`,
          en: `Took the esports talent test — I'm at the average. Can you do better?`,
        },
        "below-avg": {
          zh: `测了电竞天赋，大部分维度可以训练 😂 测测你是不是比我强`,
          en: `Took the test — most dimensions can be trained 😂 Are you any better?`,
        },
      };
      const t = shareMap[tierInfo.id] ?? shareMap["below-avg"]!;
      return isZh ? t.zh : t.en;
    }
    return isZh
      ? `我是「${archetype.name}」${archetype.icon} — ${archetype.tagline} 测测你的电竞天赋：gametan.ai/quiz`
      : `I'm a ${archetype.nameEn} ${archetype.icon} — ${archetype.taglineEn} Test your esports talent: gametan.ai/quiz`;
  }, [archetype, isZh, tierInfo, simulatedRank]);

  const challengeText = useMemo(() => {
    if (!archetype) return "";
    if (tierInfo && simulatedRank) {
      return isZh
        ? `我测了电竞天赋 (${tierInfo.labelZh})，${simulatedRank.totalPopulation.toLocaleString()} 人中排第 ${simulatedRank.rank}，你敢来测测吗？`
        : `I tested my esports talent (${tierInfo.label}), ranked #${simulatedRank.rank} of ${simulatedRank.totalPopulation.toLocaleString()} — dare to test yours?`;
    }
    return isZh
      ? `我测了电竞天赋，你敢来测测吗？`
      : `I tested my esports talent — dare to test yours?`;
  }, [archetype, isZh, tierInfo, simulatedRank]);

  const handleShare = useCallback(async () => {
    if (!archetype) return;
    track("share_click", { page: "quiz_result", archetype: archetype.id });
    if (navigator.share) {
      try {
        await navigator.share({
          title: tierInfo
            ? t("result.share.titleWithTier", { tier: isZh ? tierInfo.labelZh : tierInfo.label })
            : t("result.share.title"),
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share API failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // D12: clipboard failure feedback
      if (typeof window !== "undefined") {
        alert(t("result.share.copyFailed"));
      }
    }
  }, [isZh, archetype, shareText, shareUrl, t, tierInfo]);

  // Celebration confetti + analytics on mount (skip for shared views)
  useEffect(() => {
    if (archetype && !isSharedView) {
      // Celebrate top-30% and above (or always for questionnaire mode)
      const shouldConfetti =
        isQuestionnaire ||
        (tierInfo &&
          ["top-gamer-5pct", "top-gamer-15pct", "top-gamer-30pct"].includes(
            tierInfo.id
          ));
      if (shouldConfetti) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.3 },
          colors: [archetype.gradient[0], archetype.gradient[1], '#FFD700'],
        });
      }
      // Track quiz_complete only once per page mount to prevent funnel inflation
      if (!hasTrackedComplete.current) {
        hasTrackedComplete.current = true;
        track("quiz_complete", {
          archetype: archetype.id,
          tier: tierInfo?.id ?? "unknown",
          mode: mode === "scenario" ? "scenario" : isQuestionnaire ? "questionnaire" : "quick",
        });
      }
    }
  }, [archetype, isQuestionnaire, isSharedView, tierInfo, mode]);

  // No data → redirect to quiz
  if ((!scores && !isQuestionnaire) || !archetype) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t("result.noData")}
          </p>
          <Link href="/quiz">
            <Button>{t("result.startQuiz")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const SCORE_LABELS = [
    "result.score.reaction",
    "result.score.pattern",
    "result.score.risk",
  ] as const;

  return (
    <LazyMotion features={domAnimation}>
    <div className="flex-1 flex flex-col">
      {/* Hero section — talent tier primary, archetype secondary */}
      <div
        className="relative px-6 pt-12 pb-8 text-center"
        style={{
          background: tierInfo
            ? `linear-gradient(135deg, oklch(0.78 0.17 170 / 0.08), oklch(0.80 0.17 85 / 0.08))`
            : `linear-gradient(135deg, ${archetype.gradient[0]}22, ${archetype.gradient[1]}22)`,
        }}
      >
        {/* Talent Tier Badge — the main reveal */}
        {tierInfo ? (
          <>
            <m.div
              className="mb-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              <Trophy size={48} className="mx-auto text-primary" />
            </m.div>

            <m.div
              className="space-y-2 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="text-xs text-muted-foreground tracking-widest uppercase">
                {isSharedView
                  ? t("result.hero.sharedTier")
                  : t("result.hero.yourTier")}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                {isZh ? tierInfo.labelZh : tierInfo.label}
              </h1>
              {avgScore !== null && (
                <div className="text-lg text-muted-foreground font-mono">
                  {avgScore}/100
                </div>
              )}
            </m.div>

            {/* Archetype as secondary label */}
            <m.div
              className="flex items-center justify-center gap-2 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <span className="text-2xl">{archetype.icon}</span>
              <span className="text-sm text-muted-foreground">
                {t("quizResult.archetypeLabel", { name: isZh ? archetype.name : archetype.nameEn })}
              </span>
            </m.div>
          </>
        ) : (
          <>
            {/* Questionnaire/scenario mode: archetype-focused (no pro benchmarks) */}
            <m.div
              className="text-6xl md:text-7xl mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              {archetype.icon}
            </m.div>

            <m.div
              className="space-y-1 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="text-xs text-muted-foreground tracking-widest uppercase">
                {isSharedView
                  ? t("result.hero.sharedArchetype")
                  : t("result.hero.yourArchetype")}
              </div>
              <h1
                className="text-3xl md:text-4xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {isZh ? archetype.name : archetype.nameEn}
              </h1>
              {isZh && (
                <div className="text-sm text-muted-foreground">
                  {archetype.nameEn}
                </div>
              )}
            </m.div>

            <m.p
              className="text-base md:text-lg text-foreground/80 italic max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              &ldquo;{isZh ? archetype.tagline : archetype.taglineEn}&rdquo;
            </m.p>
          </>
        )}

        {/* Primary CTA — share (own result) or take quiz (shared view) */}
        <m.div
          className="pt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.0 }}
        >
          {isSharedView ? (
            <Link href="/quiz">
              <Button
                size="lg"
                className="h-12 px-8 text-base gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Target size={20} />
                {t("result.hero.testYourTalent")}
              </Button>
            </Link>
          ) : (
          <Button
            size="lg"
            className="h-12 px-8 text-base gap-2"
            style={{
              background: `linear-gradient(135deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
              color: "white",
            }}
            onClick={handleShare}
          >
            {copied ? (
              <>
                <Check size={20} />
                {t("result.share.copied")}
              </>
            ) : (
              <>
                <Share2 size={20} />
                {t("result.share.report")}
              </>
            )}
          </Button>
          )}
        </m.div>

        {/* Result card download — own results only */}
        {!isSharedView && (
          <m.div
            className="pt-3 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.1 }}
          >
            <ResultCardDownload
              archetype={archetype}
              talentScores={talentScores}
              scores={scores}
              isZh={isZh}
            />
          </m.div>
        )}
      </div>

      {/* Ad slot — after archetype reveal */}
      <AdSlot slot="result-top" className="px-6 pt-4 max-w-lg mx-auto w-full" />

      {/* Content */}
      <div className="px-6 py-6 max-w-lg mx-auto w-full space-y-5">
        {/* Score bars */}
        <m.div
          className="space-y-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 1.0 } }
          }}
        >
          {isQuestionnaire && talentScores ? (
            // Questionnaire mode: show top 5 talents
            Object.entries(talentScores)
              .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
              .slice(0, 5)
              .map(([talent, score]) => (
                <m.div
                  key={talent}
                  className="flex items-center gap-3"
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                >
                  <span className="text-xs text-muted-foreground w-20 text-right truncate">
                    {t(`talent.${talent}`)}
                  </span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.round(score ?? 0)}%`,
                        background: `linear-gradient(90deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold w-8">
                    {Math.round(score ?? 0)}
                  </span>
                </m.div>
              ))
          ) : scores ? (
            // Game mode: show 3 game scores with literature top-5% markers
            scores.map((score, i) => {
              const reference = LITERATURE_REFERENCES[i];
              const isAboveReference = score >= (reference?.gamerTop5Pct ?? 100);
              return (
              <m.div
                key={i}
                className="space-y-1"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {t(SCORE_LABELS[i])}
                  </span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.round(score)}%`,
                        background: isAboveReference
                          ? `linear-gradient(90deg, oklch(0.80 0.17 85), oklch(0.85 0.15 60))`
                          : `linear-gradient(90deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                      }}
                    />
                    {/* Literature top-5% marker */}
                    {reference && (
                      <div
                        className="absolute top-0 h-full w-0.5 bg-white/40"
                        style={{ left: `${reference.gamerTop5Pct}%` }}
                        title={
                          isZh
                            ? `文献前 5%: ${reference.gamerTop5Pct}`
                            : `Literature top 5%: ${reference.gamerTop5Pct}`
                        }
                      />
                    )}
                  </div>
                  <span className={`text-xs font-bold w-8 ${isAboveReference ? "text-accent" : ""}`}>
                    {Math.round(score)}
                  </span>
                </div>
                {/* Literature reference label under the bar */}
                {reference && (
                  <div className="flex items-center gap-3">
                    <span className="w-16" />
                    <div className="flex-1 flex justify-between text-[10px] text-muted-foreground/60 px-0.5">
                      <span />
                      <span style={{ marginRight: `${100 - reference.gamerTop5Pct}%` }}>
                        {isZh ? "前 5%" : "Top 5%"} {reference.gamerTop5Pct}
                      </span>
                    </div>
                    <span className="w-8" />
                  </div>
                )}
              </m.div>
              );
            })
          ) : null}
        </m.div>

        {/* ── Reality Check Card (game mode only) — D6: macro impact first ── */}
        {simulatedRank && avgScore !== null && (
          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.3 }}
          >
            <Card className="border-border">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="text-sm font-semibold text-center">
                  {t("result.reality.title")}
                </div>

                {/* Rank visualization */}
                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold font-mono">
                    #{simulatedRank.rank.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("result.reality.rankOf", { rank: simulatedRank.rank.toLocaleString(), total: simulatedRank.totalPopulation.toLocaleString() })}
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden mx-8 mt-2">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-1000"
                      style={{ width: `${simulatedRank.percentile}%` }}
                    />
                  </div>
                </div>

                {/* Pro cutoff */}
                <div className="flex items-center justify-between text-xs px-2">
                  <span className="text-muted-foreground">
                    {t("result.reality.proSpots")}
                  </span>
                  <span className="text-muted-foreground">
                    {t("result.reality.moreToPass", { count: Math.max(0, simulatedRank.rank - 50).toLocaleString() })}
                  </span>
                </div>

                {/* Distribution visualization — D9: ARIA, D10: literature disclaimer */}
                <DistributionBar
                  userScore={avgScore}
                  referenceScore={GAMER_TOP5_AVG}
                  isZh={isZh}
                />

                {/* D8: Pro reality — narrative style instead of grid */}
                <div className="border-t border-border/50 pt-3">
                  <div className="text-[10px] text-muted-foreground/70 text-center uppercase tracking-wider mb-2">
                    {t("result.reality.proReality")}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("result.reality.proDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </m.div>
        )}

        {/* ── D7: Highlight Card — emotional turnaround ── */}
        {scores && literatureGap && (
          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.38 }}
          >
            {(() => {
              const best = literatureGap.reduce((a, b) => (a.userScore > b.userScore ? a : b));
              const bestPct = Math.round(best.userScore);
              return (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-4 pb-4 text-center space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {t("result.highlight.strongest")}
                    </div>
                    <div className="text-base font-semibold text-primary">
                      {best.label} — {t("result.highlight.beats", { pct: String(bestPct) })}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t("result.highlight.unique")}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </m.div>
        )}

        {/* ── Literature Comparison Card (game mode only) ── */}
        {literatureGap && tierInfo && (
          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.45 }}
          >
            <Card className="border-primary/20">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="text-center space-y-1">
                  <div className="text-sm font-semibold">
                    {isZh ? "文献对比" : "Literature Comparison"}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {isZh
                      ? "基于已发表的玩家认知档案研究（Dale & Green 2017；Kowal et al. 2018）。这不是职业选手原始数据。"
                      : "Based on published cognitive profile studies of gamer populations (Dale & Green 2017; Kowal et al. 2018). These are not professional player data."}
                  </p>
                  <Link
                    href="/methodology"
                    className="inline-block text-[10px] text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                  >
                    {isZh ? "查看方法学 →" : "View methodology →"}
                  </Link>
                </div>

                {/* Per-dimension comparison vs literature top-5% — responsive stack on mobile */}
                <div className="space-y-2">
                  {literatureGap.map((item) => {
                    const pct = item.percentOfReference;
                    return (
                    <div key={item.dimension}>
                      {/* Desktop: single row */}
                      <div className="hidden sm:flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-16 text-right truncate">
                          {item.label}
                        </span>
                        <span className="font-mono w-7 text-right">{item.userScore}</span>
                        <span className="text-muted-foreground/50">vs</span>
                        <span className="font-mono w-7 text-muted-foreground">{item.reference}</span>
                        <span className={`font-mono w-10 text-right ${item.delta >= 0 ? "text-accent" : "text-muted-foreground"}`}>
                          {item.delta >= 0 ? "+" : ""}{item.delta}
                        </span>
                        <span className="text-muted-foreground/50 w-10 text-right">
                          {pct}%
                        </span>
                      </div>
                      {/* Mobile: stacked */}
                      <div className="flex sm:hidden items-center justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-mono">
                          {item.userScore} <span className="text-muted-foreground/50">vs</span> {item.reference}
                          <span className={`ml-1 ${item.delta >= 0 ? "text-accent" : "text-muted-foreground"}`}>
                            ({item.delta >= 0 ? "+" : ""}{item.delta})
                          </span>
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* Column legend */}
                <div className="text-[10px] text-muted-foreground/70 text-center">
                  {isZh
                    ? "你 vs 文献前 5%（玩家研究样本）"
                    : "You vs literature top 5% (gamer research samples)"}
                </div>

                {/* Literature-based insight */}
                {literatureInsight && (
                  <div className={`text-xs text-center px-2 py-2 rounded-lg ${
                    literatureInsight.tone === "positive"
                      ? "bg-accent/10 text-accent"
                      : literatureInsight.tone === "harsh"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                  }`}>
                    {isZh ? literatureInsight.messageZh : literatureInsight.messageEn}
                  </div>
                )}

                {/* Archetype-matched pro player (curated external roster for reference only) */}
                {proPlayer && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <span className="text-lg">{archetype.icon}</span>
                    <div className="text-xs">
                      <div className="text-muted-foreground">
                        {t("result.pro.sameArchetype")}
                      </div>
                      <div className="font-medium">
                        {isZh ? proPlayer.name : proPlayer.nameEn} · {proPlayer.game}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </m.div>
        )}

        {/* ── Deep Analysis (Pro/Deep tier only — evidence-based depth sections) ── */}
        {tier === "pro" && talentScores && !isSharedView && (
          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.5 }}
          >
            <DeepAnalysisSection
              talentScores={talentScores}
              archetype={
                archetype
                  ? {
                      id: archetype.id,
                      name: archetype.name,
                      nameEn: archetype.nameEn,
                    }
                  : null
              }
              tier={tier}
            />
          </m.div>
        )}

        {/* ── Deep Report Upsell (own result, not shared) ── */}
        {!isSharedView && !isQuestionnaire && scores && (
          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.48 }}
          >
            <Card className="border-accent/30 bg-accent/5 overflow-hidden">
              <CardContent className="pt-5 pb-5">
                <div className="text-center mb-3">
                  <div className="text-sm font-semibold mb-1">
                    {t("result.report.title")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("result.report.desc")}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={async () => {
                    track("deep_report_click", { page: "quiz_result", tier: tierInfo?.id ?? "unknown" });
                    try {
                      const res = await fetch("/api/billing/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productType: "deep_report" }),
                      });
                      const data = await res.json();
                      if (data.success && data.data?.url) {
                        window.location.href = data.data.url;
                      } else {
                        // Not logged in or payment not configured — redirect to register
                        window.location.href = "/register?next=premium";
                      }
                    } catch {
                      window.location.href = "/register?next=premium";
                    }
                  }}
                >
                  {t("result.report.cta")}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {t("result.report.note")}
                </p>
              </CardContent>
            </Card>
          </m.div>
        )}

        {/* ── CTA card — quiz CTA for shared view, registration for own result ── */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: isSharedView ? 0.3 : 1.5 }}
        >
        {isSharedView ? (
        <Card className="border-accent/30 bg-accent/5 overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="text-center mb-4">
              <div className="text-sm font-semibold mb-1">
                {t("result.cta.friendIs", { tier: isZh ? (tierInfo?.labelZh ?? archetype.name) : (tierInfo?.label ?? archetype.nameEn) })}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("result.cta.sharedDesc")}
              </p>
            </div>
            <Link href="/quiz" className="block">
              <Button size="lg" className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-accent/90">
                {t("result.cta.sharedButton")}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        ) : (
        <div className="space-y-3">
          {/* Standard upgrade — free registration */}
          <Card className="border-primary/30 bg-primary/5 overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="text-center mb-3">
                <div className="text-sm font-semibold mb-1">
                  {t("result.cta.quickOnly")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("result.cta.registerDesc")}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="px-2 py-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold text-primary">7</div>
                  <div className="text-[10px] text-muted-foreground">{t("result.cta.dimensions")}</div>
                </div>
                <div className="px-2 py-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold text-primary">AI</div>
                  <div className="text-[10px] text-muted-foreground">{t("result.cta.coach")}</div>
                </div>
                <div className="px-2 py-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold text-primary">Pro</div>
                  <div className="text-[10px] text-muted-foreground">{t("result.cta.deepCompare")}</div>
                </div>
              </div>
              <Link href="/register" className="block">
                <Button size="lg" className="w-full h-12 text-base">
                  {t("result.cta.registerButton")}
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro upgrade — paid assessment */}
          <Card className="border-accent/30 bg-accent/5 overflow-hidden">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={16} className="text-accent" />
                <span className="text-sm font-semibold">{t("result.cta.proTitle")}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">$3.99</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {t("result.cta.proDesc")}
              </p>
              <Link href="/quiz?tier=pro" className="block">
                <Button variant="outline" size="sm" className="w-full border-accent/30 text-accent hover:bg-accent/10">
                  {t("result.cta.proButton")}
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        )}
        </m.div>

        {/* Description */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.65 }}
        >
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-sm leading-relaxed text-foreground/90">
              {isZh ? archetype.description : archetype.descriptionEn}
            </p>
          </CardContent>
        </Card>
        </m.div>

        {/* Growth Edge (positive framing, matching main results page) */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.8 }}
        >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <TrendingUp
                size={18}
                className="text-primary mt-0.5 shrink-0"
              />
              <div>
                <div className="text-xs font-medium text-primary mb-1">
                  {t("result.growth.title")}
                </div>
                <p className="text-sm text-foreground/80">
                  {isZh ? archetype.weakness : archetype.weaknessEn}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </m.div>

        {/* Nemesis & Ally */}
        <m.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.95 }}
        >
          {nemesis && (
            <Card className="border-red-500/15">
              <CardContent className="pt-4 pb-4 text-center">
                <Swords size={16} className="text-red-400 mx-auto mb-1" />
                <div className="text-[10px] text-red-400 mb-1">
                  {t("result.nemesis.label")}
                </div>
                <div className="text-lg mb-0.5">{nemesis.icon}</div>
                <div className="text-xs font-medium">
                  {isZh ? nemesis.name : nemesis.nameEn}
                </div>
              </CardContent>
            </Card>
          )}
          {ally && (
            <Card className="border-green-500/15">
              <CardContent className="pt-4 pb-4 text-center">
                <Heart size={16} className="text-green-400 mx-auto mb-1" />
                <div className="text-[10px] text-green-400 mb-1">
                  {t("result.ally.label")}
                </div>
                <div className="text-lg mb-0.5">{ally.icon}</div>
                <div className="text-xs font-medium">
                  {isZh ? ally.name : ally.nameEn}
                </div>
              </CardContent>
            </Card>
          )}
        </m.div>

        {/* Evolution hint */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 2.1 }}
        >
        <Card
          className="border-primary/20"
          style={{
            background: `linear-gradient(135deg, ${archetype.gradient[0]}08, ${archetype.gradient[1]}08)`,
          }}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <TrendingUp
                size={18}
                className="text-primary mt-0.5 shrink-0"
              />
              <div>
                <div className="text-xs font-medium text-primary mb-1">
                  {t("result.evolution.title")}
                </div>
                <p className="text-sm text-foreground/80">
                  {isZh
                    ? archetype.evolutionHint
                    : archetype.evolutionHintEn}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </m.div>

        {/* Recommended games for this archetype */}
        <GameRecommendations
          genres={archetype.genres}
          archetypeName={archetype.name}
          archetypeNameEn={archetype.nameEn}
          gradient={archetype.gradient}
          isZh={isZh}
        />

        {/* PK Challenge CTA — hidden, feature paused */}

        {/* Challenge a friend */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 2.25 }}
        >
          <Card className="border-dashed border-primary/30">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users size={16} className="text-primary" />
                <span className="text-sm font-medium">
                  {t("result.challenge.title")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {t("result.challenge.desc")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  const url = typeof window !== "undefined" ? `${window.location.origin}/quiz` : "https://gametan.ai/quiz";
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: t("result.challenge.shareTitle"), text: challengeText, url });
                      return;
                    } catch { /* cancelled */ }
                  }
                  try {
                    await navigator.clipboard.writeText(`${challengeText}\n${url}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch { /* failed */ }
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {t("result.challenge.copyLink")}
              </Button>
            </CardContent>
          </Card>
        </m.div>

        {/* Secondary actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-10"
            onClick={handleShare}
          >
            <Share2 size={16} className="mr-1.5" />
            {t("result.share.button")}
          </Button>
          <Link href="/quiz" className="flex-1">
            <Button
              variant="ghost"
              className="w-full h-10 text-muted-foreground"
            >
              <RotateCcw size={14} className="mr-1.5" />
              {t("result.retake")}
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 pb-8 space-y-1">
          <p>{t("result.footer.sharePrompt")}</p>
          <p>gametan.ai</p>
        </div>
      </div>

    </div>
    </LazyMotion>
  );
}
