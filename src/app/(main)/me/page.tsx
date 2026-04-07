"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { RankBadge } from "@/components/charts/rank-badge";
import { TalentIcon } from "@/components/talent-icon";
import {
  BarChart3,
  Trophy,
  Settings,
  Crown,
  ChevronRight,
  FlaskConical,
  Share2,
  TrendingUp,
} from "lucide-react";
import { EvolutionTracker } from "@/components/evolution-tracker";
import { scoreToArchetype } from "@/lib/archetype";
import type { Archetype } from "@/lib/archetype";
import type { TalentCategory, Rank } from "@/types/talent";

interface ProfileData {
  username: string;
  overallScore: number | null;
  overallRank: string | null;
  sessionId: string | null;
  talents: Partial<Record<TalentCategory, number | null>>;
}

interface Session {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

const MENU_ITEMS = [
  {
    href: "/results",
    labelKey: "me.testHistory",
    icon: BarChart3,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    href: "/leaderboard",
    labelKey: "me.leaderboard",
    icon: Trophy,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  // Community link hidden — feature paused, code preserved
  // Premium link hidden — free model for now
  {
    href: "/settings",
    labelKey: "me.settings",
    icon: Settings,
    color: "text-gray-500",
    bg: "bg-gray-500/10",
  },
];

export default function MePage() {
  const { t, locale } = useI18n();
  const [username, setUsername] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [evolutionHistory, setEvolutionHistory] = useState<
    { date: string; archetypeId: string | null; overallScore: number | null; talents: Partial<Record<TalentCategory, number>> }[]
  >([]);
  const [evolutionData, setEvolutionData] = useState<{
    firstArchetype: string | null;
    currentArchetype: string | null;
    evolved: boolean;
    overallChange: number;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Fetch latest talent profile + username
        const [profileRes, sessionsRes, meRes, talentHistoryRes] = await Promise.all([
          fetch("/api/leaderboard").then((r) => r.json()),
          fetch("/api/sessions").then((r) => r.json()),
          fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ success: false })),
          fetch("/api/talent-history").then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        // Get username
        const currentUsername = meRes.success ? meRes.data?.username : null;
        if (currentUsername) setUsername(currentUsername);

        // Extract current user's profile from leaderboard
        if (profileRes.success && currentUsername) {
          const myEntry = profileRes.data.find(
            (e: { username: string }) => e.username === currentUsername
          );
          if (myEntry) {
            setProfile({
              username: myEntry.username,
              overallScore: myEntry.overallScore,
              overallRank: myEntry.overallRank,
              sessionId: myEntry.sessionId,
              talents: myEntry.talents,
            });
          }
        }

        if (sessionsRes.success) {
          setSessions(
            sessionsRes.data
              .filter((s: Session) => s.status === "completed")
              .slice(0, 5)
          );
        }

        // Talent history (evolution tracker)
        if (talentHistoryRes?.success && talentHistoryRes.data?.history?.length >= 2) {
          setEvolutionHistory(talentHistoryRes.data.history);
          setEvolutionData(talentHistoryRes.data.evolution);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Compute archetype from talent scores
  const archetype: Archetype | null = profile?.talents
    ? scoreToArchetype(
        profile.talents as Record<string, number>
      )
    : null;

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-pulse">
        <div className="h-36 bg-muted rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-16 bg-muted rounded-xl" />
        </div>
        <div className="h-40 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* ─── Archetype Identity Card ─── */}
      {archetype ? (
        <Card
          className="overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${archetype.gradient[0]}18, ${archetype.gradient[1]}18)`,
          }}
        >
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{archetype.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    @{username}
                  </div>
                  {profile && (
                    <RankBadge
                      rank={(profile.overallRank as Rank) || "C"}
                      size="sm"
                    />
                  )}
                </div>
                <h1
                  className="text-2xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {locale === "zh" ? archetype.name : archetype.nameEn}
                </h1>
                <p className="text-xs text-muted-foreground italic line-clamp-1">
                  {locale === "zh" ? archetype.tagline : archetype.taglineEn}
                </p>
              </div>
            </div>

            {/* Evolution hint */}
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp size={12} className="text-primary shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {locale === "zh" ? archetype.evolutionHint : archetype.evolutionHintEn}
                </span>
              </div>
            </div>

            {/* Top 3 talents */}
            {profile && (
              <div className="flex gap-3 mt-3 pt-3 border-t border-border/30">
                {Object.entries(profile.talents)
                  .filter(([, v]) => typeof v === "number")
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 3)
                  .map(([cat, score]) => (
                    <div key={cat} className="flex items-center gap-1.5">
                      <TalentIcon
                        category={cat as TalentCategory}
                        size={12}
                        className="text-primary"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {t(`talent.${cat}`)}
                      </span>
                      <span className="text-[10px] font-bold">
                        {Math.round(score as number)}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* Share button */}
            {username && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <Link
                  href={`/profile/${username}`}
                  className="flex items-center justify-center gap-2 text-xs text-primary hover:underline"
                >
                  <Share2 size={12} />
                  {t("me.viewPublicProfile")}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* No archetype — show basic profile */
        <Card className="overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {username?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold truncate">
                  {username || "—"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t("me.noTestHistory")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Evolution Tracker ─── */}
      {evolutionHistory.length >= 2 && (
        <EvolutionTracker history={evolutionHistory} evolution={evolutionData} />
      )}

      {/* Quick menu grid */}
      <div className="grid grid-cols-4 gap-3">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="pressable h-full">
                <CardContent className="pt-4 pb-3 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}
                  >
                    <Icon size={20} className={item.color} />
                  </div>
                  <span className="text-xs font-medium">
                    {t(item.labelKey)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent test sessions */}
      {sessions.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <FlaskConical size={14} className="text-primary" />
                {t("me.testHistory")}
              </h2>
              <Link
                href="/results"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t("dashboard.viewAll")} →
              </Link>
            </div>
            <div className="space-y-2">
              {sessions.map((session) => (
                <Link key={session.id} href={`/results/${session.id}`}>
                  <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="text-sm font-medium">
                        {new Date(session.startedAt).toLocaleDateString(
                          locale === "en" ? "en-US" : "zh-CN",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
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

      {/* No profile CTA */}
      {!profile && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-5 pb-5 text-center space-y-3">
            <FlaskConical size={36} className="text-primary mx-auto" />
            <h3 className="font-semibold">{t("dashboard.testYourTalent")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.testDescription")}
            </p>
            <Link
              href="/test"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium pressable"
            >
              {t("dashboard.startTestBtn")}
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
