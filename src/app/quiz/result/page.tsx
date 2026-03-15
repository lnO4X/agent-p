"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import {
  quickScoresToArchetype,
  getArchetype,
} from "@/lib/archetype";
import type { Archetype } from "@/lib/archetype";
import {
  Share2,
  Swords,
  Heart,
  TrendingUp,
  Gamepad2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

function parseScores(s: string | null): [number, number, number] | null {
  if (!s) return null;
  const parts = s.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return parts as [number, number, number];
}

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

  const scores = parseScores(searchParams.get("s"));

  const archetype = useMemo<Archetype | null>(() => {
    if (!scores) return null;
    return quickScoresToArchetype(scores[0], scores[1], scores[2]);
  }, [scores]);

  const nemesis = useMemo(
    () => (archetype ? getArchetype(archetype.nemesisId) : null),
    [archetype]
  );

  const ally = useMemo(
    () => (archetype ? getArchetype(archetype.allyId) : null),
    [archetype]
  );

  const isZh = locale === "zh";

  // No scores → redirect to quiz
  if (!scores || !archetype) {
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

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/quiz/result?s=${scores.join("-")}`
      : "";

  const shareText = isZh
    ? `我是「${archetype.name}」${archetype.icon}！${archetype.tagline} 你是什么类型的玩家？`
    : `I'm a ${archetype.nameEn} ${archetype.icon}! ${archetype.taglineEn} What's your gamer archetype?`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isZh
            ? `我的玩家原型：${archetype!.name}`
            : `My Gamer Archetype: ${archetype!.nameEn}`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    }
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
        <div className="text-6xl md:text-7xl mb-4">{archetype.icon}</div>

        {/* Archetype name */}
        <div className="space-y-1 mb-4">
          <div className="text-xs text-muted-foreground tracking-widest uppercase">
            {isZh ? "你的玩家原型" : "Your Gamer Archetype"}
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
        </div>

        {/* Tagline */}
        <p className="text-base md:text-lg text-foreground/80 italic max-w-md mx-auto">
          &ldquo;{isZh ? archetype.tagline : archetype.taglineEn}&rdquo;
        </p>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-lg mx-auto w-full space-y-5">
        {/* Score bars */}
        <div className="space-y-2">
          {scores.map((score, i) => (
            <div key={i} className="flex items-center gap-3">
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
            </div>
          ))}
        </div>

        {/* Description */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-sm leading-relaxed text-foreground/90">
              {isZh ? archetype.description : archetype.descriptionEn}
            </p>
          </CardContent>
        </Card>

        {/* Weakness */}
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <TrendingUp
                size={18}
                className="text-red-400 mt-0.5 shrink-0"
              />
              <div>
                <div className="text-xs font-medium text-red-400 mb-1">
                  {isZh ? "致命弱点" : "Fatal Weakness"}
                </div>
                <p className="text-sm text-foreground/80">
                  {isZh ? archetype.weakness : archetype.weaknessEn}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nemesis & Ally */}
        <div className="grid grid-cols-2 gap-3">
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
        </div>

        {/* Evolution hint */}
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

        {/* Recommended genres */}
        <div>
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Gamepad2 size={12} />
            {isZh ? "推荐游戏类型" : "Recommended Genres"}
          </div>
          <div className="flex flex-wrap gap-2">
            {archetype.genres.map((genre) => (
              <span
                key={genre}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium"
              >
                {genre.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <Button
            size="lg"
            className="w-full h-12"
            onClick={handleShare}
          >
            <Share2 size={18} className="mr-2" />
            {isZh ? "分享我的原型" : "Share My Archetype"}
          </Button>

          <Link href="/register" className="block">
            <Button
              size="lg"
              variant="outline"
              className="w-full h-12"
            >
              {isZh
                ? "注册解锁完整13维测试 + AI角色对话"
                : "Sign up for full 13-dimension test + AI characters"}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>

          <Link href="/quiz" className="block">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              <RotateCcw size={14} className="mr-2" />
              {isZh ? "重新测试" : "Retake Quiz"}
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 pb-8">
          game.weda.ai
        </div>
      </div>
    </div>
  );
}
