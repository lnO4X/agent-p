"use client";

import { Suspense, useMemo, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { trackEvent as track } from "@/lib/analytics";
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
import { NpsPrompt } from "@/components/nps-prompt";
import { GameRecommendations } from "@/components/game-recommendations";
import { AdSlot } from "@/components/ad-slot";
import { ResultCardDownload } from "@/components/result-card-download";
import { getTalentTier, getProGapAnalysis, getSimulatedRank, getTalentInsight, PRO_BENCHMARKS } from "@/lib/pro-benchmarks";
import { HALL_OF_FAME } from "@/lib/hall-of-fame";
import { DistributionBar } from "@/components/distribution-bar";

const TALENT_LABELS_ZH: Record<string, string> = {
  reaction_speed: "反应速度",
  hand_eye_coord: "手眼协调",
  spatial_awareness: "空间感知",
  memory: "记忆力",
  strategy_logic: "策略逻辑",
  rhythm_sense: "节奏感",
  pattern_recog: "图案识别",
  multitasking: "多任务",
  decision_speed: "决策速度",
  emotional_control: "情绪控制",
  teamwork_tendency: "团队协作",
  risk_assessment: "风险评估",
  resource_mgmt: "资源管理",
};

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
  const { locale } = useI18n();

  const mode = searchParams.get("mode"); // "q" = questionnaire, "scenario" = scenario quiz
  const scores = parseScores(searchParams.get("s"));
  const talentScores = parseTalentScores(searchParams.get("scores"));

  const archetype = useMemo<Archetype | null>(() => {
    if (mode === "q" || mode === "scenario") {
      // Questionnaire or scenario mode: use archetype from URL or compute from scores
      const aId = searchParams.get("archetype");
      if (aId) return getArchetype(aId) ?? null;
      if (talentScores) return scoreToArchetype(talentScores);
      return null;
    }
    if (!scores) return null;
    return quickScoresToArchetype(scores[0], scores[1], scores[2]);
  }, [scores, mode, searchParams, talentScores]);

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

  // Detect shared view: if URL has &own=1, user just completed the quiz themselves.
  // No &own param = arrived via shared link (persists across refresh, no sessionStorage needed).
  const isSharedView = !searchParams.get("own");

  // Pro benchmark comparison (for quick-test game mode)
  const tierInfo = useMemo(
    () => (scores ? getTalentTier(scores) : null),
    [scores]
  );
  const proGap = useMemo(
    () => (scores ? getProGapAnalysis(scores, isZh) : null),
    [scores, isZh]
  );
  const avgScore = useMemo(
    () => (scores ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null),
    [scores]
  );

  // Pro player from same archetype (for display)
  const proPlayer = useMemo(() => {
    if (!archetype) return null;
    return HALL_OF_FAME.find((p) => p.archetypeId === archetype.id && p.role === "pro") ?? null;
  }, [archetype]);

  // Simulated rank & talent insight (game mode only)
  const simulatedRank = useMemo(
    () => (scores ? getSimulatedRank(scores) : null),
    [scores]
  );
  const talentInsight = useMemo(
    () => (scores ? getTalentInsight(scores) : null),
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
      // Provocative tier-based share text
      const r = simulatedRank;
      const shareMap: Record<string, { zh: string; en: string }> = {
        "pro-elite": {
          zh: `我测到了职业精英级天赋 🏆 ${r.totalPopulation.toLocaleString()} 人中排前 ${r.rank}。你排第几？`,
          en: `I scored Pro Elite 🏆 Top ${r.rank} out of ${r.totalPopulation.toLocaleString()}. Where do you rank?`,
        },
        "pro-level": {
          zh: `我的天赋达到职业水平 💪 ${r.totalPopulation.toLocaleString()} 人中排前 ${r.rank}。你呢？`,
          en: `I'm at Pro Level 💪 Top ${r.rank} of ${r.totalPopulation.toLocaleString()}. What about you?`,
        },
        "pro-potential": {
          zh: `测了电竞天赋，有职业潜力但还差一截 😤 你能超过我吗？`,
          en: `I have pro potential but not quite there 😤 Can you beat me?`,
        },
        "above-average": {
          zh: `测了电竞天赋，比大多数人强但离职业还很远... 你试试？`,
          en: `Better than most, but far from pro... Can you do better?`,
        },
        developing: {
          zh: `测了电竞天赋，被现实打击了 😂 测测你是不是比我强`,
          en: `Reality check: I'm far from pro 😂 Are you any better?`,
        },
      };
      const t = shareMap[tierInfo.tier] ?? shareMap["developing"]!;
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
        : `I tested my esports talent (${tierInfo.labelEn}), ranked #${simulatedRank.rank} of ${simulatedRank.totalPopulation.toLocaleString()} — dare to test yours?`;
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
          title: isZh
            ? `我的电竞天赋${tierInfo ? `: ${tierInfo.labelZh}` : ""}`
            : `My Esports Talent${tierInfo ? `: ${tierInfo.labelEn}` : ""}`,
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
        alert(isZh ? "复制失败，请手动复制链接" : "Copy failed — please copy the link manually");
      }
    }
  }, [isZh, archetype, shareText, shareUrl]);

  // Celebration confetti + analytics on mount (skip for shared views)
  useEffect(() => {
    if (archetype && !isSharedView) {
      // Only confetti for pro-potential or above (or always for questionnaire mode)
      const shouldConfetti = isQuestionnaire || (tierInfo && ["pro-elite", "pro-level", "pro-potential"].includes(tierInfo.tier));
      if (shouldConfetti) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.3 },
          colors: [archetype.gradient[0], archetype.gradient[1], '#FFD700'],
        });
      }
      track("quiz_complete", {
        archetype: archetype.id,
        tier: tierInfo?.tier ?? "unknown",
        mode: mode === "scenario" ? "scenario" : isQuestionnaire ? "questionnaire" : "quick",
      });
    }
  }, [archetype, isQuestionnaire, isSharedView, tierInfo]);

  // No data → redirect to quiz
  if ((!scores && !isQuestionnaire) || !archetype) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            {isZh ? "没有测试数据" : "No quiz data found"}
          </p>
          <Link href="/quiz">
            <Button>{isZh ? "开始测试" : "Take the Quiz"}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const SCORE_LABELS = [
    { zh: "反应速度", en: "Reaction" },
    { zh: "模式识别", en: "Pattern" },
    { zh: "风险决策", en: "Risk" },
  ];

  return (
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
            <motion.div
              className="mb-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              <Trophy size={48} className="mx-auto text-primary" />
            </motion.div>

            <motion.div
              className="space-y-2 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="text-xs text-muted-foreground tracking-widest uppercase">
                {isSharedView
                  ? (isZh ? "一位朋友的天赋测试" : "A friend's talent test")
                  : (isZh ? "你的电竞天赋等级" : "Your Esports Talent Tier")}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                {isZh ? tierInfo.labelZh : tierInfo.labelEn}
              </h1>
              {avgScore !== null && (
                <div className="text-lg text-muted-foreground font-mono">
                  {avgScore}/100
                </div>
              )}
            </motion.div>

            {/* Archetype as secondary label */}
            <motion.div
              className="flex items-center justify-center gap-2 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <span className="text-2xl">{archetype.icon}</span>
              <span className="text-sm text-muted-foreground">
                {isZh ? `玩家原型: ${archetype.name}` : `Archetype: ${archetype.nameEn}`}
              </span>
            </motion.div>
          </>
        ) : (
          <>
            {/* Questionnaire/scenario mode: archetype-focused (no pro benchmarks) */}
            <motion.div
              className="text-6xl md:text-7xl mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              {archetype.icon}
            </motion.div>

            <motion.div
              className="space-y-1 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="text-xs text-muted-foreground tracking-widest uppercase">
                {isSharedView
                  ? (isZh ? "一位朋友的测试结果" : "A friend's result")
                  : (isZh ? "你的玩家原型" : "Your Gamer Archetype")}
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
            </motion.div>

            <motion.p
              className="text-base md:text-lg text-foreground/80 italic max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              &ldquo;{isZh ? archetype.tagline : archetype.taglineEn}&rdquo;
            </motion.p>
          </>
        )}

        {/* Primary CTA — share (own result) or take quiz (shared view) */}
        <motion.div
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
                {isZh ? "测测你的天赋" : "Test your talent"}
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
                {isZh ? "已复制" : "Copied!"}
              </>
            ) : (
              <>
                <Share2 size={20} />
                {isZh ? "分享天赋报告" : "Share Talent Report"}
              </>
            )}
          </Button>
          )}
        </motion.div>

        {/* Result card download — own results only */}
        {!isSharedView && (
          <motion.div
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
          </motion.div>
        )}
      </div>

      {/* Ad slot — after archetype reveal */}
      <AdSlot slot="result-top" className="px-6 pt-4 max-w-lg mx-auto w-full" />

      {/* Content */}
      <div className="px-6 py-6 max-w-lg mx-auto w-full space-y-5">
        {/* Score bars */}
        <motion.div
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
                <motion.div
                  key={talent}
                  className="flex items-center gap-3"
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                >
                  <span className="text-xs text-muted-foreground w-20 text-right truncate">
                    {isZh ? TALENT_LABELS_ZH[talent] || talent : talent.replace(/_/g, " ")}
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
                </motion.div>
              ))
          ) : scores ? (
            // Game mode: show 3 game scores with pro benchmark markers
            scores.map((score, i) => {
              const benchmark = PRO_BENCHMARKS[i];
              const isAbovePro = score >= (benchmark?.proAvg ?? 100);
              return (
              <motion.div
                key={i}
                className="space-y-1"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {isZh ? SCORE_LABELS[i].zh : SCORE_LABELS[i].en}
                  </span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.round(score)}%`,
                        background: isAbovePro
                          ? `linear-gradient(90deg, oklch(0.80 0.17 85), oklch(0.85 0.15 60))`
                          : `linear-gradient(90deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                      }}
                    />
                    {/* Pro average marker */}
                    {benchmark && (
                      <div
                        className="absolute top-0 h-full w-0.5 bg-white/40"
                        style={{ left: `${benchmark.proAvg}%` }}
                        title={isZh ? `职业平均: ${benchmark.proAvg}` : `Pro Avg: ${benchmark.proAvg}`}
                      />
                    )}
                  </div>
                  <span className={`text-xs font-bold w-8 ${isAbovePro ? "text-accent" : ""}`}>
                    {Math.round(score)}
                  </span>
                </div>
                {/* Pro label under the bar */}
                {benchmark && (
                  <div className="flex items-center gap-3">
                    <span className="w-16" />
                    <div className="flex-1 flex justify-between text-[10px] text-muted-foreground/60 px-0.5">
                      <span />
                      <span style={{ marginRight: `${100 - benchmark.proAvg}%` }}>
                        Pro {benchmark.proAvg}
                      </span>
                    </div>
                    <span className="w-8" />
                  </div>
                )}
              </motion.div>
              );
            })
          ) : null}
        </motion.div>

        {/* ── Reality Check Card (game mode only) — D6: macro impact first ── */}
        {simulatedRank && avgScore !== null && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.3 }}
          >
            <Card className="border-border">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="text-sm font-semibold text-center">
                  {isZh ? "如果 1 万人参加职业选拔..." : "If 10,000 players tried out for pro..."}
                </div>

                {/* Rank visualization */}
                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold font-mono">
                    #{simulatedRank.rank.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isZh
                      ? `${simulatedRank.totalPopulation.toLocaleString()} 人中排第 ${simulatedRank.rank.toLocaleString()} 名`
                      : `Rank ${simulatedRank.rank.toLocaleString()} of ${simulatedRank.totalPopulation.toLocaleString()}`}
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
                    {isZh ? "入选名额: 前 50 名 (0.5%)" : "Pro spots: Top 50 (0.5%)"}
                  </span>
                  <span className="text-muted-foreground">
                    {isZh
                      ? `还需超越 ${Math.max(0, simulatedRank.rank - 50).toLocaleString()} 人`
                      : `${Math.max(0, simulatedRank.rank - 50).toLocaleString()} more to pass`}
                  </span>
                </div>

                {/* Distribution visualization — D9: ARIA, D10: disclaimer */}
                <DistributionBar
                  userScore={avgScore}
                  proAvg={Math.round(PRO_BENCHMARKS.reduce((a, b) => a + b.proAvg, 0) / PRO_BENCHMARKS.length)}
                  isZh={isZh}
                />

                {/* D8: Pro reality — narrative style instead of grid */}
                <div className="border-t border-border/50 pt-3">
                  <div className="text-[10px] text-muted-foreground/70 text-center uppercase tracking-wider mb-2">
                    {isZh ? "职业选手的现实" : "The Pro Reality"}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isZh
                      ? "职业选手每天训练 8-12 小时，平均职业生涯只有 3-5 年。即使天赋达到职业水平，也需要 1-2 年全职训练才能上场。"
                      : "Pro players train 8-12 hours daily. The average career lasts just 3-5 years. Even with pro-level talent, it takes 1-2 years of full-time training to compete."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── D7: Highlight Card — emotional turnaround ── */}
        {scores && proGap && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.38 }}
          >
            {(() => {
              const best = proGap.reduce((a, b) => (a.userScore > b.userScore ? a : b));
              const bestPct = Math.round(best.userScore);
              return (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-4 pb-4 text-center space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {isZh ? "但你最强的一项" : "But your strongest skill"}
                    </div>
                    <div className="text-base font-semibold text-primary">
                      {best.label} — {isZh ? `超过了 ${bestPct}% 的玩家` : `beats ${bestPct}% of players`}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {isZh ? "每个人的天赋组合都是独特的" : "Everyone has a unique talent mix"}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>
        )}

        {/* ── Pro Comparison Card (game mode only) ── */}
        {proGap && tierInfo && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.45 }}
          >
            <Card className="border-primary/20">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="text-sm font-semibold text-center">
                  {isZh ? "你的天赋 vs 职业选手" : "Your Talent vs Pro Players"}
                </div>

                {/* D9: Per-dimension comparison — responsive stack on mobile */}
                <div className="space-y-2">
                  {proGap.map((item) => {
                    const pct = item.percentOfPro;
                    return (
                    <div key={item.dimension}>
                      {/* Desktop: single row */}
                      <div className="hidden sm:flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-16 text-right truncate">
                          {item.label}
                        </span>
                        <span className="font-mono w-7 text-right">{item.userScore}</span>
                        <span className="text-muted-foreground/50">vs</span>
                        <span className="font-mono w-7 text-muted-foreground">{item.proAvg}</span>
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
                          {item.userScore} <span className="text-muted-foreground/50">vs</span> {item.proAvg}
                          <span className={`ml-1 ${item.delta >= 0 ? "text-accent" : "text-muted-foreground"}`}>
                            ({item.delta >= 0 ? "+" : ""}{item.delta})
                          </span>
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* D11: Talent insight — use accent token instead of amber-500 */}
                {talentInsight && (
                  <div className={`text-xs text-center px-2 py-2 rounded-lg ${
                    talentInsight.tone === "positive"
                      ? "bg-accent/10 text-accent"
                      : talentInsight.tone === "harsh"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                  }`}>
                    {isZh ? talentInsight.messageZh : talentInsight.messageEn}
                  </div>
                )}

                {/* Pro player reference */}
                {proPlayer && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <span className="text-lg">{archetype.icon}</span>
                    <div className="text-xs">
                      <div className="text-muted-foreground">
                        {isZh ? "同类型职业选手" : "Pro with same archetype"}
                      </div>
                      <div className="font-medium">
                        {isZh ? proPlayer.name : proPlayer.nameEn} · {proPlayer.game}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Deep Report Upsell (own result, not shared) ── */}
        {!isSharedView && !isQuestionnaire && scores && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.48 }}
          >
            <Card className="border-accent/30 bg-accent/5 overflow-hidden">
              <CardContent className="pt-5 pb-5">
                <div className="text-center mb-3">
                  <div className="text-sm font-semibold mb-1">
                    {isZh ? "想看完整 13 维天赋分析？" : "Want your full 13-dimension analysis?"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isZh
                      ? "深度报告包含：13 维天赋分数、职业匹配度、个性化训练建议"
                      : "Deep Report: 13 talent dimensions, pro match score, personalized training plan"}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={async () => {
                    track("deep_report_click", { page: "quiz_result", tier: tierInfo?.tier ?? "unknown" });
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
                  {isZh ? "获取深度报告 — $3.99" : "Get Deep Report — $3.99"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {isZh ? "一次性购买 · 无需订阅 · 即时生成" : "One-time purchase · No subscription · Instant"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── CTA card — quiz CTA for shared view, registration for own result ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.5 }}
        >
        {isSharedView ? (
        <Card className="border-accent/30 bg-accent/5 overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="text-center mb-4">
              <div className="text-sm font-semibold mb-1">
                {isZh
                  ? `你的朋友是 ${tierInfo?.labelZh ?? archetype.name}。你呢？`
                  : `Your friend is ${tierInfo?.labelEn ?? archetype.nameEn}. What about you?`}
              </div>
              <p className="text-xs text-muted-foreground">
                {isZh
                  ? "3 分钟，3 个小游戏，对比职业选手 — 免费"
                  : "3 minutes, 3 mini-games, compared to pro players — free"}
              </p>
            </div>
            <Link href="/quiz" className="block">
              <Button size="lg" className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-accent/90">
                {isZh ? "我也要测" : "I Want to Test Too"}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        ) : (
        <Card className="border-primary/30 bg-primary/5 overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="text-center mb-3">
              <div className="text-sm font-semibold mb-1">
                {isZh
                  ? "你的快速测试只测了 3 个维度"
                  : "Your quick test measured 3 dimensions"}
              </div>
              <p className="text-xs text-muted-foreground">
                {isZh
                  ? "注册解锁完整 13 维��赋分析 + AI 天赋教练 — 免费"
                  : "Sign up for full 13-dimension analysis + AI talent coach — free"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="px-2 py-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-primary">13</div>
                <div className="text-[10px] text-muted-foreground">{isZh ? "天赋维度" : "Dimensions"}</div>
              </div>
              <div className="px-2 py-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-primary">AI</div>
                <div className="text-[10px] text-muted-foreground">{isZh ? "天赋教练" : "Coach"}</div>
              </div>
              <div className="px-2 py-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-primary">Pro</div>
                <div className="text-[10px] text-muted-foreground">{isZh ? "深度对比" : "Deep Compare"}</div>
              </div>
            </div>
            <Link href="/register" className="block">
              <Button size="lg" className="w-full h-12 text-base">
                {isZh ? "免费注册，解锁 13 维分析" : "Sign Up Free — Unlock 13D Analysis"}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        )}
        </motion.div>

        {/* Description */}
        <motion.div
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
        </motion.div>

        {/* Growth Edge (positive framing, matching main results page) */}
        <motion.div
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
                  {isZh ? "成长突破口" : "Growth Edge"}
                </div>
                <p className="text-sm text-foreground/80">
                  {isZh ? archetype.weakness : archetype.weaknessEn}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Nemesis & Ally */}
        <motion.div
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
                  {isZh ? "天敌" : "Nemesis"}
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
                  {isZh ? "最佳搭档" : "Best Ally"}
                </div>
                <div className="text-lg mb-0.5">{ally.icon}</div>
                <div className="text-xs font-medium">
                  {isZh ? ally.name : ally.nameEn}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Evolution hint */}
        <motion.div
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
                  {isZh ? "进化路径" : "Evolution Path"}
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
        </motion.div>

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
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 2.25 }}
        >
          <Card className="border-dashed border-primary/30">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users size={16} className="text-primary" />
                <span className="text-sm font-medium">
                  {isZh ? "邀请好友来测" : "Challenge a Friend"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {isZh
                  ? "把测试链接发给朋友，看看他们的天赋水平"
                  : "Send this to a friend — find out their talent level"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  const url = typeof window !== "undefined" ? `${window.location.origin}/quiz` : "https://gametan.ai/quiz";
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: isZh ? "测测你的电竞天赋" : "Test Your Esports Talent", text: challengeText, url });
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
                {isZh ? "复制邀请链接" : "Copy Invite Link"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Secondary actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-10"
            onClick={handleShare}
          >
            <Share2 size={16} className="mr-1.5" />
            {isZh ? "分享" : "Share"}
          </Button>
          <Link href="/quiz" className="flex-1">
            <Button
              variant="ghost"
              className="w-full h-10 text-muted-foreground"
            >
              <RotateCcw size={14} className="mr-1.5" />
              {isZh ? "重测" : "Retake"}
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 pb-8 space-y-1">
          <p>{isZh ? "分享此报告获得客观天赋评估" : "Share for an objective talent assessment"}</p>
          <p>gametan.ai</p>
        </div>
      </div>

      {/* NPS feedback — shows 3s after result reveal */}
      <NpsPrompt context="quiz_complete" isZh={isZh} delay={3000} />
    </div>
  );
}
