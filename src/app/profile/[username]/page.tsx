"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { RankBadge } from "@/components/charts/rank-badge";
import { TalentIcon } from "@/components/talent-icon";
import { Crown, Zap, Share2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { TalentCategory, Rank } from "@/types/talent";

interface ProfileData {
  username: string;
  displayName: string | null;
  tier: "free" | "premium";
  createdAt: string;
  overallScore: number | null;
  overallRank: string | null;
  talents: Record<string, number | null> | null;
  recentChallenges: Array<{
    id: string;
    gameId: string;
    talentCategory: string;
    score: number;
    completedAt: string;
  }>;
}

export default function PublicProfilePage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
        } else {
          setError(json.error?.code === "PRIVATE" ? "private" : "not_found");
        }
      } catch {
        setError("network");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${username}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${username} — GameTan`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-24 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-4">
        <h1 className="text-xl font-bold">
          {error === "private"
            ? t("profile.private")
            : t("profile.notFound")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {error === "private"
            ? t("profile.privateDesc")
            : t("profile.notFoundDesc")}
        </p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft size={14} className="mr-1" />
            {t("common.back")}
          </Button>
        </Link>
      </div>
    );
  }

  // Sort talents by score desc
  const sortedTalents = profile.talents
    ? Object.entries(profile.talents)
        .filter(([, v]) => typeof v === "number")
        .sort(([, a], [, b]) => (b as number) - (a as number))
    : [];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Back */}
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        {t("common.back")}
      </Link>

      {/* Profile header */}
      <Card className="overflow-hidden">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold truncate">
                  {profile.displayName || profile.username}
                </h1>
                {profile.tier === "premium" && (
                  <Crown size={16} className="text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              {profile.overallScore !== null && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {t("me.overallRank")}
                  </span>
                  <RankBadge
                    rank={(profile.overallRank as Rank) || "C"}
                    size="sm"
                  />
                  <span className="text-sm font-semibold">
                    {Math.round(profile.overallScore)} {t("common.score")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Share button */}
          <div className="mt-4 pt-3 border-t border-border/50 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleShare}
            >
              <Share2 size={14} className="mr-1" />
              {copied ? t("profile.copied") : t("profile.share")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* All 13 talents */}
      {sortedTalents.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-2.5">
            <h2 className="text-sm font-semibold mb-3">{t("results.talents")}</h2>
            {sortedTalents.map(([cat, score]) => (
              <div key={cat} className="flex items-center gap-2.5">
                <TalentIcon
                  category={cat as TalentCategory}
                  size={14}
                  className="text-primary flex-shrink-0"
                />
                <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
                  {t(`talent.${cat}`)}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.round(score as number)}%` }}
                  />
                </div>
                <span className="text-xs font-bold w-8 text-right">
                  {Math.round(score as number)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent challenges */}
      {profile.recentChallenges.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
              <Zap size={14} className="text-primary" />
              {t("me.recentChallenges")}
            </h2>
            <div className="space-y-2">
              {profile.recentChallenges.map((ch) => (
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

      {/* No profile state */}
      {sortedTalents.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-5 pb-5 text-center">
            <p className="text-sm text-muted-foreground">
              {t("profile.noTalent")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* OG card link */}
      <div className="text-center">
        <a
          href={`/api/profile/card/${encodeURIComponent(username)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          {t("profile.viewCard")}
        </a>
      </div>
    </div>
  );
}
