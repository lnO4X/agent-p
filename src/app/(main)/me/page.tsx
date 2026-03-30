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
  Zap,
  FlaskConical,
  Share2,
  TrendingUp,
  Users,
  Check,
  Copy,
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

interface RecentChallenge {
  id: string;
  gameId: string;
  talentCategory: string;
  score: number;
  completedAt: string;
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
  const [challenges, setChallenges] = useState<RecentChallenge[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
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
        const [profileRes, challengeRes, sessionsRes, meRes, referralRes, talentHistoryRes] = await Promise.all([
          fetch("/api/leaderboard").then((r) => r.json()),
          fetch("/api/challenge/history?limit=5").then((r) => r.json()).catch(() => ({ success: false })),
          fetch("/api/sessions").then((r) => r.json()),
          fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ success: false })),
          fetch("/api/referral").then((r) => r.json()).catch(() => ({ success: false })),
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

        if (challengeRes.success) {
          setChallenges(challengeRes.data || []);
        }

        if (referralRes.success) {
          setReferralCode(referralRes.data?.referralCode || null);
          setReferralCount(referralRes.data?.totalReferrals || 0);
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

  const isZh = locale === "zh";

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
                  {isZh ? archetype.name : archetype.nameEn}
                </h1>
                <p className="text-xs text-muted-foreground italic line-clamp-1">
                  {isZh ? archetype.tagline : archetype.taglineEn}
                </p>
              </div>
            </div>

            {/* Evolution hint */}
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp size={12} className="text-primary shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {isZh ? archetype.evolutionHint : archetype.evolutionHintEn}
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
                  {isZh ? "查看公开档案" : "View Public Profile"}
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

      {/* Recent challenges */}
      {challenges.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <Zap size={14} className="text-primary" />
                {t("me.recentChallenges")}
              </h2>
              <Link
                href="/challenge"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t("dashboard.viewAll")} →
              </Link>
            </div>
            <div className="space-y-2">
              {challenges.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <TalentIcon
                      category={ch.talentCategory as TalentCategory}
                      size={14}
                      className="text-primary"
                    />
                    <span className="text-sm">
                      {t(`talent.${ch.talentCategory}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {Math.round(ch.score)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ch.completedAt).toLocaleDateString(
                        locale === "en" ? "en-US" : "zh-CN",
                        { month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral card */}
      {referralCode && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <Users size={14} className="text-green-500" />
                {t("me.referral")}
              </h2>
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                {t("me.referralCount").replace("{count}", String(referralCount))}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {isZh ? "邀请好友测测电竞天赋，对比职业选手" : "Invite friends to test their esports talent"}
            </p>
            {/* Code display */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2 font-mono text-sm tracking-wider text-center select-all">
                {referralCode}
              </div>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(referralCode);
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 1500);
                }}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 active:scale-95 transition-transform"
                title={isZh ? "复制邀请码" : "Copy code"}
              >
                {codeCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-muted-foreground" />}
              </button>
            </div>
            {/* Share link buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai"}/register?ref=${referralCode}`;
                  await navigator.clipboard.writeText(inviteLink);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 1500);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-medium hover:bg-green-500/20 active:scale-95 transition-transform pressable"
              >
                {linkCopied ? <Check size={13} /> : <Copy size={13} />}
                {isZh ? "复制邀请链接" : "Copy invite link"}
              </button>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  type="button"
                  onClick={async () => {
                    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai"}/register?ref=${referralCode}`;
                    await navigator.share({
                      title: isZh ? "GameTan — 测测你的电竞天赋" : "GameTan — Test Your Esports Talent",
                      text: isZh ? `用我的邀请码 ${referralCode} 注册 GameTan，测测你的电竞天赋！` : `Join me on GameTan! Use my code ${referralCode} to test your esports talent.`,
                      url: inviteLink,
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 active:scale-95 transition-transform pressable"
                >
                  <Share2 size={13} />
                  {isZh ? "分享" : "Share"}
                </button>
              )}
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
