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
} from "lucide-react";
import { parseScores, parseTalentScores } from "@/lib/quiz-utils";
import { NpsPrompt } from "@/components/nps-prompt";
import { GameRecommendations } from "@/components/game-recommendations";
import { AdSlot } from "@/components/ad-slot";

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

  const mode = searchParams.get("mode"); // "q" = questionnaire
  const scores = parseScores(searchParams.get("s"));
  const talentScores = parseTalentScores(searchParams.get("scores"));

  const archetype = useMemo<Archetype | null>(() => {
    if (mode === "q") {
      // Questionnaire mode: use archetype from URL or compute from scores
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
  const isQuestionnaire = mode === "q";

  const [copied, setCopied] = useState(false);

  // Detect shared view: if URL has &own=1, user just completed the quiz themselves.
  // No &own param = arrived via shared link (persists across refresh, no sessionStorage needed).
  const isSharedView = !searchParams.get("own");

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !archetype) return "";
    return isQuestionnaire
      ? `${window.location.origin}/quiz/result?mode=q&archetype=${archetype.id}${
          talentScores
            ? `&scores=${Object.entries(talentScores).map(([k, v]) => `${k}:${v}`).join(",")}`
            : ""
        }`
      : `${window.location.origin}/quiz/result?s=${(scores ?? []).join("-")}`;
  }, [archetype, isQuestionnaire, talentScores, scores]);

  const shareText = useMemo(() => {
    if (!archetype) return "";
    return isZh
      ? `我是「${archetype.name}」${archetype.icon} — ${archetype.tagline} 你是什么类型的玩家？3分钟测出你的玩家原型：gametan.ai/quiz`
      : `I'm a ${archetype.nameEn} ${archetype.icon} — ${archetype.taglineEn} What gamer archetype are you? Take the 3-min quiz: gametan.ai/quiz`;
  }, [archetype, isZh]);

  const challengeText = useMemo(() => {
    if (!archetype) return "";
    return isZh
      ? `我是${archetype.name}${archetype.icon}，你敢来测测吗？`
      : `I'm a ${archetype.nameEn} ${archetype.icon} — dare to find out yours?`;
  }, [archetype, isZh]);

  const handleShare = useCallback(async () => {
    if (!archetype) return;
    track("share_click", { page: "quiz_result", archetype: archetype.id });
    if (navigator.share) {
      try {
        await navigator.share({
          title: isZh
            ? `我的玩家原型：${archetype.name}`
            : `My Gamer Archetype: ${archetype.nameEn}`,
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
      // clipboard failed silently
    }
  }, [isZh, archetype, shareText, shareUrl]);

  // Celebration confetti + analytics on mount (skip for shared views)
  useEffect(() => {
    if (archetype && !isSharedView) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.3 },
        colors: [archetype.gradient[0], archetype.gradient[1], '#FFD700'],
      });
      track("quiz_complete", {
        archetype: archetype.id,
        mode: isQuestionnaire ? "questionnaire" : "quick",
      });
    }
  }, [archetype, isQuestionnaire, isSharedView]);

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
      {/* Hero section with gradient */}
      <div
        className="relative px-6 pt-12 pb-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${archetype.gradient[0]}22, ${archetype.gradient[1]}22)`,
        }}
      >
        {/* Archetype icon */}
        <motion.div
          className="text-6xl md:text-7xl mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          {archetype.icon}
        </motion.div>

        {/* Archetype name */}
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

        {/* Tagline */}
        <motion.p
          className="text-base md:text-lg text-foreground/80 italic max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          &ldquo;{isZh ? archetype.tagline : archetype.taglineEn}&rdquo;
        </motion.p>

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
                className="h-12 px-8 text-base gap-2"
                style={{
                  background: `linear-gradient(135deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                  color: "white",
                }}
              >
                <Target size={20} />
                {isZh ? "测测你是什么原型" : "Find your archetype"}
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
                {isZh ? "分享我的原型" : "Share My Archetype"}
              </>
            )}
          </Button>
          )}
        </motion.div>
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
            // Game mode: show 3 game scores
            scores.map((score, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
              >
                <span className="text-xs text-muted-foreground w-16 text-right">
                  {isZh ? SCORE_LABELS[i].zh : SCORE_LABELS[i].en}
                </span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.round(score)}%`,
                      background: `linear-gradient(90deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold w-8">
                  {Math.round(score)}
                </span>
              </motion.div>
            ))
          ) : null}
        </motion.div>

        {/* ── CTA card — quiz CTA for shared view, registration for own result ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.5 }}
        >
        {isSharedView ? (
        <Card className="border-primary/30 bg-primary/5 overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="text-center mb-4">
              <div className="text-sm font-semibold mb-1">
                {isZh
                  ? "想知道你是什么类型的玩家？"
                  : "Curious about your gamer archetype?"}
              </div>
              <p className="text-xs text-muted-foreground">
                {isZh
                  ? "3 分钟测出你的玩家原型 — 完全免费"
                  : "Find your gamer archetype in 3 minutes — totally free"}
              </p>
            </div>
            <Link href="/quiz" className="block">
              <Button size="lg" className="w-full h-12 text-base">
                {isZh ? "我也要测" : "Take the Quiz"}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        ) : (
        <Card className="border-primary/30 bg-primary/5 overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="text-center mb-4">
              <div className="text-sm font-semibold mb-1">
                {isZh
                  ? `${archetype.name}，这只是冰山一角`
                  : `${archetype.nameEn}, this is just the tip`}
              </div>
              <p className="text-xs text-muted-foreground">
                {isZh
                  ? "注册后解锁完整版 — 免费"
                  : "Sign up to unlock the full experience — free"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <Target size={20} className="text-primary mx-auto mb-1" />
                <div className="text-[10px] text-muted-foreground leading-tight">
                  {isZh ? "13维天赋\n精准测试" : "13-Dimension\nDeep Test"}
                </div>
              </div>
              <div className="text-center">
                <Bot size={20} className="text-primary mx-auto mb-1" />
                <div className="text-[10px] text-muted-foreground leading-tight">
                  {isZh ? "AI伙伴\n游戏解读" : "AI Partner\nGame Insights"}
                </div>
              </div>
              <div className="text-center">
                <Crown size={20} className="text-primary mx-auto mb-1" />
                <div className="text-[10px] text-muted-foreground leading-tight">
                  {isZh ? "每日挑战\n连续签到" : "Daily Challenge\nStreak System"}
                </div>
              </div>
            </div>
            <Link href="/register" className="block">
              <Button size="lg" className="w-full h-12 text-base">
                {isZh ? "免费注册，解锁完整体验" : "Sign Up Free — Unlock Full Experience"}
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
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <TrendingUp
                size={18}
                className="text-purple-400 mt-0.5 shrink-0"
              />
              <div>
                <div className="text-xs font-medium text-purple-400 mb-1">
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
                  ? "把测试链接发给朋友，看看他们是什么原型"
                  : "Send this to a friend who games — find out their archetype"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  const url = typeof window !== "undefined" ? `${window.location.origin}/quiz` : "https://gametan.ai/quiz";
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: isZh ? "测测你的玩家原型" : "Find Your Gamer Archetype", text: challengeText, url });
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
        <div className="text-center text-xs text-muted-foreground pt-4 pb-8">
          gametan.ai
        </div>
      </div>

      {/* NPS feedback — shows 3s after result reveal */}
      <NpsPrompt context="quiz_complete" isZh={isZh} delay={3000} />
    </div>
  );
}
