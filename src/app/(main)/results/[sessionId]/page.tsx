"use client";

import { useState, useEffect, useMemo, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { LazyTalentRadar } from "@/components/charts/talent-radar-lazy";
import { RankBadge } from "@/components/charts/rank-badge";
import { AiAnalysis } from "@/components/results/ai-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TalentIcon } from "@/components/talent-icon";
import { useI18n } from "@/i18n/context";
import { scoreToRank } from "@/lib/scoring";
import { scoreToArchetype, getArchetype } from "@/lib/archetype";
import type { Archetype } from "@/lib/archetype";
import { Swords, Heart, TrendingUp, Gamepad2, Crown, MessageSquare, Users, Brain, Sparkles } from "lucide-react";
import { celebrationBurst, starBurst } from "@/lib/confetti";
import type { TalentCategory, Rank, GenreRecommendation } from "@/types/talent";
import { GameRecommendations } from "@/components/game-recommendations";

interface ProfileData {
  reactionSpeed: number | null;
  handEyeCoord: number | null;
  spatialAwareness: number | null;
  memory: number | null;
  strategyLogic: number | null;
  rhythmSense: number | null;
  patternRecog: number | null;
  multitasking: number | null;
  decisionSpeed: number | null;
  emotionalControl: number | null;
  teamworkTendency: number | null;
  riskAssessment: number | null;
  resourceMgmt: number | null;
  overallScore: number | null;
  overallRank: string | null;
  genreRecommendations: GenreRecommendation[] | null;
}

const KEY_MAP: Record<string, TalentCategory> = {
  reactionSpeed: "reaction_speed",
  handEyeCoord: "hand_eye_coord",
  spatialAwareness: "spatial_awareness",
  memory: "memory",
  strategyLogic: "strategy_logic",
  rhythmSense: "rhythm_sense",
  patternRecog: "pattern_recog",
  multitasking: "multitasking",
  decisionSpeed: "decision_speed",
  emotionalControl: "emotional_control",
  teamworkTendency: "teamwork_tendency",
  riskAssessment: "risk_assessment",
  resourceMgmt: "resource_mgmt",
};

export default function ResultDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<"free" | "premium">("free");
  const isZh = locale === "zh";

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data.profile) {
          setProfile(json.data.profile);
        }
      })
      .finally(() => setLoading(false));
    // Fetch tier for Premium CTA visibility
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.tier) setTier(res.data.tier);
      })
      .catch(() => {});
  }, [sessionId]);

  // Extract talent scores (memoized to stabilize downstream hooks)
  const talentScores = useMemo<Partial<Record<TalentCategory, number>>>(() => {
    if (!profile) return {};
    const scores: Partial<Record<TalentCategory, number>> = {};
    for (const [key, category] of Object.entries(KEY_MAP)) {
      const value = profile[key as keyof ProfileData];
      if (typeof value === "number") {
        scores[category] = value;
      }
    }
    return scores;
  }, [profile]);

  // Compute archetype from full 13-dimension talent scores
  const archetype = useMemo<Archetype | null>(() => {
    const entries = Object.entries(talentScores);
    if (entries.length < 3) return null;
    return scoreToArchetype(talentScores as Record<string, number>);
  }, [talentScores]);

  const nemesis = useMemo(
    () => (archetype ? getArchetype(archetype.nemesisId) : null),
    [archetype]
  );

  const ally = useMemo(
    () => (archetype ? getArchetype(archetype.allyId) : null),
    [archetype]
  );

  // Fire confetti when archetype is revealed
  const confettiFiredRef = useRef(false);
  useEffect(() => {
    if (!archetype || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    // S-rank gets star burst, everyone else gets celebration burst
    const rank = profile?.overallRank;
    if (rank === "S") {
      starBurst();
      setTimeout(() => celebrationBurst(), 300);
    } else {
      celebrationBurst();
    }
  }, [archetype, profile?.overallRank]);

  if (loading) {
    return (
      <div className="text-center py-20 text-muted-foreground">{t("common.loading")}</div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {t("results.notFound")}
      </div>
    );
  }

  const genres = (profile.genreRecommendations || []) as GenreRecommendation[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Archetype Identity Hero ─── */}
      {archetype ? (
        <div className="space-y-5">
          {/* Hero card */}
          <div
            className="relative rounded-2xl px-6 pt-10 pb-6 text-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${archetype.gradient[0]}22, ${archetype.gradient[1]}22)`,
            }}
          >
            <div className="text-6xl mb-3">{archetype.icon}</div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1">
              {t("sessionResult.yourArchetype")}
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold mb-1"
              style={{
                background: `linear-gradient(135deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {isZh ? archetype.name : archetype.nameEn}
            </h1>
            {isZh && (
              <div className="text-sm text-muted-foreground mb-2">
                {archetype.nameEn}
              </div>
            )}
            <p className="text-sm md:text-base text-foreground/80 italic max-w-md mx-auto">
              &ldquo;{isZh ? archetype.tagline : archetype.taglineEn}&rdquo;
            </p>

            {/* Overall score badge */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <RankBadge
                rank={(profile.overallRank as Rank) || "C"}
                size="lg"
              />
              <div className="text-left">
                <div className="text-2xl font-bold">
                  {Math.round(profile.overallScore || 0)}{t("common.score")}
                </div>
                <div className="text-xs text-muted-foreground">{t("results.overallScore")}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-sm leading-relaxed text-foreground/90">
                {isZh ? archetype.description : archetype.descriptionEn}
              </p>
            </CardContent>
          </Card>

          {/* Growth Edge (reframed from weakness — positive framing) */}
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
                  <p className="text-xs text-primary/70 mt-1.5 italic">
                    {t("sessionResult.growthHint")}
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
          </div>

          {/* Evolution path */}
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

          {/* Recommended games for this archetype */}
          <GameRecommendations
            genres={archetype.genres}
            archetypeName={archetype.name}
            archetypeNameEn={archetype.nameEn}
            gradient={archetype.gradient}
            isZh={isZh}
          />
        </div>
      ) : (
        /* No archetype — show basic score header */
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{t("results.title")}</h1>
          <div className="flex items-center justify-center gap-4">
            <RankBadge
              rank={(profile.overallRank as Rank) || "C"}
              size="lg"
            />
            <div className="text-left">
              <div className="text-3xl font-bold">
                {Math.round(profile.overallScore || 0)}{t("common.score")}
              </div>
              <div className="text-muted-foreground">{t("results.overallScore")}</div>
            </div>
          </div>
        </div>
      )}

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("results.radarChart")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LazyTalentRadar scores={talentScores} />
        </CardContent>
      </Card>

      {/* Individual Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("results.talents")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(talentScores).map(([category, score]) => {
              const cat = category as TalentCategory;
              const rank = scoreToRank(score!);
              return (
                <div
                  key={category}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                >
                  <TalentIcon category={cat} size={20} className="text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {t(`talent.${cat}`)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(score!)}{t("common.score")}
                    </div>
                  </div>
                  <RankBadge rank={rank} size="sm" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Genre Recommendations */}
      {genres.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("results.genreRecs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {genres.map((genre, i) => (
                <div
                  key={genre.genre}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <span className="text-lg font-bold text-primary w-6">
                    #{i + 1}
                  </span>
                  <div className="flex-1">
                    <span className="font-medium">{genre.nameZh}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      {genre.name}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t("results.matchScore", { score: Math.round(genre.fitScore) })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      <AiAnalysis sessionId={sessionId} />

      {/* Premium CTA removed — free model */}
    </div>
  );
}
