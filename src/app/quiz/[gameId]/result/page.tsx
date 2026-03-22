"use client";

import { Suspense, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import { getArchetype, scoreToArchetype } from "@/lib/archetype";
import type { Archetype } from "@/lib/archetype";
import type { TalentCategory } from "@/types/talent";
import {
  getGameQuiz,
  getCharacterForArchetype,
  getAllGameQuizzes,
} from "@/lib/game-quizzes";
import type { GameCharacter } from "@/lib/game-quizzes";
import {
  Share2,
  ArrowRight,
  RotateCcw,
  Crown,
  Target,
  Bot,
  Sparkles,
} from "lucide-react";

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

/** Parse questionnaire talent scores from URL: "reaction_speed:75,memory:60,..." */
function parseTalentScores(
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

export default function GameQuizResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <GameQuizResultContent />
    </Suspense>
  );
}

function GameQuizResultContent() {
  const params = useParams<{ gameId: string }>();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const gameId = params.gameId;
  const talentScores = parseTalentScores(searchParams.get("scores"));

  // Resolve archetype: from URL param, or computed from talent scores
  let archetypeId = searchParams.get("archetype") || "";
  if (!archetypeId && talentScores) {
    const computed = scoreToArchetype(talentScores);
    if (computed) archetypeId = computed.id;
  }

  const quiz = getGameQuiz(gameId);
  const archetype = useMemo<Archetype | null>(
    () => (archetypeId ? getArchetype(archetypeId) ?? null : null),
    [archetypeId]
  );
  const character = useMemo<GameCharacter | null>(
    () =>
      archetypeId
        ? getCharacterForArchetype(gameId, archetypeId) ?? null
        : null,
    [gameId, archetypeId]
  );

  const otherQuizzes = getAllGameQuizzes().filter((q) => q.id !== gameId);

  // Check login status via cookie
  const isLoggedIn =
    typeof document !== "undefined" &&
    document.cookie.includes("auth-token=");

  // Not found: no quiz config
  if (!quiz) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            {isZh ? "未找到该游戏测试" : "Game quiz not found"}
          </p>
          <Link href="/quiz">
            <Button>{isZh ? "返回测试" : "Back to Quiz"}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Not found: no archetype/character match
  if (!archetype || !character) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            {isZh ? "没有测试数据" : "No quiz data found"}
          </p>
          <Link href={`/quiz/${gameId}`}>
            <Button>{isZh ? "开始测试" : "Take the Quiz"}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Share URL — clean, no scores
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://gametan.ai";
  const shareUrl = `${origin}/quiz/${gameId}/result?mode=q&archetype=${archetypeId}`;

  const shareText = isZh
    ? `我是${quiz.gameName}里的「${character.name}」！${character.title}。你是哪个角色？`
    : `I am ${character.nameEn} in ${quiz.gameNameEn}! ${character.titleEn}. Which character are you?`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isZh
            ? `我的${quiz!.gameName}角色：${character!.name}`
            : `My ${quiz!.gameNameEn} Character: ${character!.nameEn}`,
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

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero section with game gradient */}
      <div
        className="relative px-6 pt-12 pb-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${quiz.gradient[0]}22, ${quiz.gradient[1]}22)`,
        }}
      >
        {/* Game branding */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xl">{quiz.icon}</span>
          <span className="text-xs text-muted-foreground tracking-widest uppercase">
            {isZh ? quiz.gameName : quiz.gameNameEn}
          </span>
        </div>

        {/* Character identity */}
        <div className="space-y-1 mb-4">
          <div
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: character.color }}
          >
            {isZh ? character.title : character.titleEn}
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{
              background: `linear-gradient(135deg, ${quiz.gradient[0]}, ${quiz.gradient[1]})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {isZh ? character.name : character.nameEn}
          </h1>
          {isZh && (
            <div className="text-sm text-muted-foreground">
              {character.nameEn}
            </div>
          )}
        </div>

        {/* Archetype icon */}
        <div className="text-5xl md:text-6xl mb-2">{archetype.icon}</div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-lg mx-auto w-full space-y-5">
        {/* Why you matched */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <Sparkles
                size={18}
                className="mt-0.5 shrink-0"
                style={{ color: character.color }}
              />
              <div>
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: character.color }}
                >
                  {isZh ? "为什么是你" : "Why You Matched"}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {isZh ? character.matchReason : character.matchReasonEn}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core gamer type link */}
        <Link href={`/archetype/${archetype.id}`} className="block">
          <Card
            className="pressable border-primary/20 hover:border-primary/40 transition-colors"
            style={{
              background: `linear-gradient(135deg, ${archetype.gradient[0]}08, ${archetype.gradient[1]}08)`,
            }}
          >
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{archetype.icon}</div>
                <div className="flex-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {isZh ? "你的核心玩家原型" : "Your Core Gamer Type"}
                  </div>
                  <div
                    className="text-base font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {isZh ? archetype.name : archetype.nameEn}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isZh ? archetype.tagline : archetype.taglineEn}
                  </div>
                </div>
                <ArrowRight size={16} className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Talent score bars (if scores provided) */}
        {talentScores && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground px-1">
              {isZh ? "天赋概览" : "Talent Overview"}
            </div>
            {Object.entries(talentScores)
              .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
              .slice(0, 5)
              .map(([talent, score]) => (
                <div key={talent} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 text-right truncate">
                    {isZh
                      ? TALENT_LABELS_ZH[talent] || talent
                      : talent.replace(/_/g, " ")}
                  </span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.round(score ?? 0)}%`,
                        background: `linear-gradient(90deg, ${quiz.gradient[0]}, ${quiz.gradient[1]})`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold w-8">
                    {Math.round(score ?? 0)}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Share button */}
        <Button
          variant="outline"
          className="w-full h-10 pressable"
          onClick={handleShare}
        >
          <Share2 size={16} className="mr-1.5" />
          {isZh ? "分享我的结果" : "Share My Result"}
        </Button>

        {/* Registration CTA (if not logged in) */}
        {!isLoggedIn && (
          <Card className="border-primary/30 bg-primary/5 overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="text-center mb-4">
                <div className="text-sm font-semibold mb-1">
                  {isZh
                    ? `${character.name}，这只是开始`
                    : `${character.nameEn}, this is just the start`}
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
                <Button size="lg" className="w-full h-12 text-base pressable">
                  {isZh
                    ? "免费注册，解锁完整体验"
                    : "Sign Up Free — Unlock Full Experience"}
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Try other game quizzes */}
        {otherQuizzes.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground text-center">
              {isZh ? "试试其他游戏测试" : "Try Other Game Quizzes"}
            </div>
            <div className="flex justify-center gap-3">
              {otherQuizzes.map((q) => (
                <Link
                  key={q.id}
                  href={`/quiz/${q.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors pressable"
                >
                  <span className="text-lg">{q.icon}</span>
                  <span className="text-sm font-medium">
                    {isZh ? q.gameName : q.gameNameEn}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* General quiz link */}
        <div className="text-center">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground pressable"
          >
            <RotateCcw size={14} />
            {isZh ? "通用玩家原型测试" : "Take the General Quiz"}
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 pb-8">
          gametan.ai
        </div>
      </div>
    </div>
  );
}
