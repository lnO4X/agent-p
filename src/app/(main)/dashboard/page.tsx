"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import { scoreToArchetype } from "@/lib/archetype";
import type { Archetype } from "@/lib/archetype";
import type { TalentCategory } from "@/types/talent";
import {
  Flame,
  Zap,
  Bot,
  TrendingUp,
  ChevronRight,
  Swords,
  Target,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Sparkles,
  ClipboardList,
  Compass,
  Share2,
} from "lucide-react";

interface PartnerPreview {
  id: string;
  name: string;
  avatar: string;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto"><div className="h-36 bg-muted/60 rounded-2xl animate-pulse" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";

  const [talents, setTalents] = useState<Partial<Record<TalentCategory, number>>>({});
  const [partners, setPartners] = useState<PartnerPreview[]>([]);
  const [challengeStreak, setChallengeStreak] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [challengeTalent, setChallengeTalent] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const archetype = useMemo<Archetype | null>(() => {
    const vals = Object.values(talents).filter((v): v is number => v != null);
    if (vals.length < 3) return null;
    return scoreToArchetype(talents);
  }, [talents]);

  useEffect(() => {
    // Fetch leaderboard to get own talent profile
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then(async (json) => {
        if (!json.success) return;
        const meRes = await fetch("/api/auth/me").then((r) => r.json()).catch(() => null);
        const myUsername = meRes?.data?.username;
        if (!myUsername) return;
        const myEntry = json.data.find(
          (e: { username: string }) => e.username === myUsername
        );
        if (myEntry?.talents) {
          setTalents(myEntry.talents);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));

    // Fetch partners
    fetch("/api/partners")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setPartners(
            json.data.slice(0, 3).map((p: { id: string; name: string; avatar: string }) => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
            }))
          );
        }
      })
      .catch(() => {});

    // Fetch challenge info
    fetch("/api/challenge")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setChallengeStreak(json.data.streak);
          setChallengeCompleted(json.data.completedToday);
          setChallengeTalent(json.data.talentCategory);
        }
      })
      .catch(() => {});
  }, []);

  // Time-aware greeting
  const hour = new Date().getHours();
  const getGreeting = () => {
    if (hour >= 5 && hour < 12) {
      return {
        text: isZh ? "早上好" : "Good Morning",
        Icon: Sunrise,
        suggestion: archetype
          ? (isZh
            ? `今天挑战一下${t(`talent.${archetype.weakTalent}`)}？`
            : `Challenge your ${t(`talent.${archetype.weakTalent}`)} today?`)
          : (isZh ? "新的一天，新的挑战" : "New day, new challenge"),
      };
    }
    if (hour >= 12 && hour < 18) {
      return {
        text: isZh ? "下午好" : "Good Afternoon",
        Icon: Sun,
        suggestion: challengeCompleted
          ? (isZh ? "今日挑战已完成，和伙伴聊聊？" : "Challenge done! Chat with a partner?")
          : (isZh ? "别忘了今天的训练" : "Don't forget today's training"),
      };
    }
    if (hour >= 18 && hour < 22) {
      return {
        text: isZh ? "晚上好" : "Good Evening",
        Icon: Sunset,
        suggestion: isZh ? "放松时间，来几局游戏" : "Relaxation time — play some games",
      };
    }
    return {
      text: isZh ? "夜深了" : "Late Night",
      Icon: Moon,
      suggestion: isZh ? "注意休息，明天继续" : "Rest well, continue tomorrow",
    };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.Icon;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* ─── Time-aware greeting ─── */}
      <div className="flex items-center gap-3 animate-fade-up">
        <GreetingIcon size={20} className="text-primary shrink-0" />
        <div>
          <h2 className="text-lg font-bold">
            {greeting.text}{archetype ? `，${isZh ? archetype.name : archetype.nameEn}` : ""}
          </h2>
          <p className="text-xs text-muted-foreground">{greeting.suggestion}</p>
        </div>
      </div>

      {/* ─── Archetype Identity Card ─── */}
      {loadingProfile ? (
        <div className="h-36 bg-muted/60 rounded-2xl animate-pulse" />
      ) : archetype ? (
        <Card
          className="overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${archetype.gradient[0]}15, ${archetype.gradient[1]}15)`,
          }}
        >
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{archetype.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">
                  {isZh ? "你的玩家原型" : "Your Archetype"}
                </div>
                <h1
                  className="text-xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {isZh ? archetype.name : archetype.nameEn}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                  {isZh ? archetype.tagline : archetype.taglineEn}
                </p>
              </div>
              <Link href="/me">
                <ChevronRight size={20} className="text-muted-foreground" />
              </Link>
            </div>

            {/* Evolution hint */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp size={12} className="text-primary shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {isZh ? archetype.evolutionHint : archetype.evolutionHintEn}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* No profile — three paths to discover archetype */
        <div className="space-y-3">
          {isWelcome && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4 pb-4 text-center">
                <h2 className="text-lg font-bold">
                  {isZh ? "🎉 欢迎加入 GameTan！" : "🎉 Welcome to GameTan!"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isZh
                    ? "选择一种方式发现你的玩家原型"
                    : "Choose a way to discover your gamer archetype"}
                </p>
              </CardContent>
            </Card>
          )}

          {!isWelcome && (
            <div className="text-center space-y-1 py-2">
              <Target size={28} className="text-primary mx-auto" />
              <h2 className="text-base font-bold">
                {isZh ? "发现你的玩家原型" : "Discover Your Archetype"}
              </h2>
            </div>
          )}

          {/* Quick Quiz — 3 games, 3 min */}
          <Link href="/quiz" className="block">
            <Card className="pressable card-hover border-primary/20 hover:border-primary/40 transition-colors shadow-glow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">
                      {isZh ? "快速测试" : "Quick Quiz"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isZh ? "3 个小游戏 · 3 分钟" : "3 mini games · 3 min"}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Questionnaire — 39 questions, 5 min */}
          <Link href="/quiz/questions" className="block">
            <Card className="pressable card-hover hover:border-primary/30 transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <ClipboardList size={20} className="text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">
                      {isZh ? "问卷测试" : "Questionnaire"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isZh ? "39 道题 · 5 分钟" : "39 questions · 5 min"}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Explore first */}
          <Link href="/explore" className="block">
            <Card className="pressable card-hover hover:border-primary/30 transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <Compass size={20} className="text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">
                      {isZh ? "先逛逛" : "Explore First"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isZh ? "300+ 游戏 · 16 种原型" : "300+ games · 16 archetypes"}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* ─── Daily Challenge ─── */}
      <Link href="/challenge">
        <Card
          className={`pressable card-hover ${
            challengeCompleted
              ? "border-green-500/30 bg-green-500/5"
              : "border-primary/30 bg-primary/5 shadow-glow"
          }`}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                  challengeCompleted ? "bg-green-500/10" : "bg-primary/10"
                }`}
              >
                <Zap
                  size={20}
                  className={
                    challengeCompleted ? "text-green-500" : "text-primary"
                  }
                />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {challengeCompleted
                    ? t("dashboard.challengeDone")
                    : isZh
                      ? "今日训练"
                      : "Today's Training"}
                </div>
                {challengeTalent && (
                  <div className="text-xs text-muted-foreground">
                    {t(`talent.${challengeTalent}`)}
                    {archetype && !challengeCompleted && (
                      <span className="ml-1">
                        ·{" "}
                        {isZh ? "进化路径相关" : "Evolution path"}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {challengeStreak > 0 && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame size={16} />
                  <span className="text-sm font-bold">{challengeStreak}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* ─── AI Characters ─── */}
      {partners.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <Bot size={14} className="text-primary" />
                {isZh ? "你的角色" : "Your Characters"}
              </h2>
              <Link
                href="/chat"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t("dashboard.viewAll")} →
              </Link>
            </div>
            <div className="space-y-2">
              {partners.map((p) => (
                <Link key={p.id} href={`/chat/${p.id}`}>
                  <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors pressable">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {p.name}
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-muted-foreground"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Quick actions ─── */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <Link href="/chat">
          <Card className="pressable card-hover h-full">
            <CardContent className="pt-4 pb-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Bot size={20} className="text-purple-500" />
              </div>
              <span className="text-xs font-medium">
                {isZh ? "AI 角色" : "AI Characters"}
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ─── Share archetype (only if has one) ─── */}
      {archetype && (
        <Link href={`/archetype/${archetype.id}`}>
          <Card className="pressable">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-3">
                <Share2 size={16} className="text-primary shrink-0" />
                <span className="text-sm font-medium flex-1">
                  {isZh ? "分享你的原型给朋友" : "Share your archetype with friends"}
                </span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
