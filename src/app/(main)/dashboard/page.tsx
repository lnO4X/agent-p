"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trackEvent as track } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import { scoreToArchetype } from "@/lib/archetype";
import type { Archetype } from "@/lib/archetype";
import type { TalentCategory } from "@/types/talent";
import {
  TrendingUp,
  ChevronRight,
  Target,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Sparkles,
  Compass,
  Share2,
} from "lucide-react";
import { EvolutionTracker } from "@/components/evolution-tracker";


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
  const registerMethod = searchParams.get("method");

  // Track Google OAuth registration (password registration is tracked in register-form.tsx)
  const googleTrackRef = useRef(false);
  useEffect(() => {
    if (isWelcome && registerMethod === "google" && !googleTrackRef.current) {
      googleTrackRef.current = true;
      track("register", { method: "google" });
    }
  }, [isWelcome, registerMethod]);

  const [talents, setTalents] = useState<Partial<Record<TalentCategory, number>>>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [evolutionHistory, setEvolutionHistory] = useState<
    { date: string; archetypeId: string | null; overallScore: number | null; talents: Partial<Record<TalentCategory, number>> }[]
  >([]);
  const [evolutionData, setEvolutionData] = useState<{
    firstArchetype: string | null;
    currentArchetype: string | null;
    evolved: boolean;
    overallChange: number;
  } | null>(null);

  const archetype = useMemo<Archetype | null>(() => {
    const vals = Object.values(talents).filter((v): v is number => v != null);
    if (vals.length < 3) return null;
    return scoreToArchetype(talents);
  }, [talents]);

  useEffect(() => {
    // Parallel fetch — eliminates waterfall chain (was: leaderboard → then auth/me)
    Promise.all([
      fetch("/api/leaderboard").then((r) => r.json()).catch(() => null),
      fetch("/api/auth/me").then((r) => r.json()).catch(() => null),
      fetch("/api/talent-history").then((r) => r.json()).catch(() => null),
    ]).then(([leaderboard, me, talentHistory]) => {
      // Profile: match own username in leaderboard
      if (leaderboard?.success && me?.data?.username) {
        const myEntry = leaderboard.data.find(
          (e: { username: string }) => e.username === me.data.username
        );
        if (myEntry?.talents) setTalents(myEntry.talents);
      }
      setLoadingProfile(false);

      // Talent history (evolution tracker)
      if (talentHistory?.success && talentHistory.data?.history?.length >= 2) {
        setEvolutionHistory(talentHistory.data.history);
        setEvolutionData(talentHistory.data.evolution);
      }
    });
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
            ? `训练一下${t(`talent.${archetype.weakTalent}`)}？`
            : `Train your ${t(`talent.${archetype.weakTalent}`)} today?`)
          : (isZh ? "测测你的电竞天赋" : "Test your esports talent"),
      };
    }
    if (hour >= 12 && hour < 18) {
      return {
        text: isZh ? "下午好" : "Good Afternoon",
        Icon: Sun,
        suggestion: isZh ? "继续探索你的天赋" : "Keep exploring your talents",
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
                  {isZh ? "你的天赋档案" : "Your Talent Profile"}
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
                    ? "测测你的电竞天赋，对比职业选手"
                    : "Test your esports talent against pro players"}
                </p>
              </CardContent>
            </Card>
          )}

          {!isWelcome && (
            <div className="text-center space-y-1 py-2">
              <Target size={28} className="text-primary mx-auto" />
              <h2 className="text-base font-bold">
                {isZh ? "测测你的天赋" : "Test Your Talent"}
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
                      {isZh ? "天赋测试" : "Talent Test"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isZh ? "3 个小游戏 · 对比职业选手" : "3 mini-games · vs Pro Players"}
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
                      {isZh ? "300+ 游戏等你探索" : "300+ games to explore"}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* ─── Evolution Tracker ─── */}
      {evolutionHistory.length >= 2 && (
        <EvolutionTracker history={evolutionHistory} evolution={evolutionData} />
      )}

      {/* ─── Share talent report (only if has archetype) ─── */}
      {archetype && (
        <Link href={`/archetype/${archetype.id}`}>
          <Card className="pressable">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-3">
                <Share2 size={16} className="text-primary shrink-0" />
                <span className="text-sm font-medium flex-1">
                  {isZh ? "分享你的天赋报告" : "Share your talent report"}
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
