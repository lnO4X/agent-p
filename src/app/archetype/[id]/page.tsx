"use client";

import { use, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trackEvent as track } from "@/lib/analytics";
import { getArchetype, getAllArchetypes } from "@/lib/archetype";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Sparkles, Swords, Shield, Zap, Heart,
  ArrowUpRight, Gamepad2, Brain, Users, Eye, TrendingUp,
  Share2, Check,
} from "lucide-react";
import { ARCHETYPE_NARRATIVES } from "@/lib/archetype-narratives";
import { AdSlot } from "@/components/ad-slot";
import { getPlayersForArchetype } from "@/lib/hall-of-fame";
import { Trophy } from "lucide-react";

export default function ArchetypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t, locale, region } = useI18n();
  const isZh = locale === "zh";

  const archetype = getArchetype(id);
  if (!archetype) notFound();

  const nemesis = getArchetype(archetype.nemesisId);
  const ally = getArchetype(archetype.allyId);
  const evolution = getArchetype(archetype.evolutionId);
  const allTypes = getAllArchetypes();

  const narrative = ARCHETYPE_NARRATIVES[id];
  const hallOfFamePlayers = getPlayersForArchetype(id, region).slice(0, 5);
  const name = isZh ? archetype.name : archetype.nameEn;
  const tagline = isZh ? archetype.tagline : archetype.taglineEn;
  const description = isZh ? archetype.description : archetype.descriptionEn;
  const weakness = isZh ? archetype.weakness : archetype.weaknessEn;
  const evolutionHint = isZh ? archetype.evolutionHint : archetype.evolutionHintEn;

  const [copied, setCopied] = useState(false);

  // Track archetype page view
  useEffect(() => {
    track("archetype_view", { archetype: id });
  }, [id]);

  const handleShare = useCallback(async () => {
    track("share_click", { page: "archetype_detail", archetype: id });
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/archetype/${id}`
      : `https://gametan.ai/archetype/${id}`;
    const shareText = isZh
      ? `${archetype.name}${archetype.icon} — ${archetype.tagline} 你是什么类型的玩家？测测看：gametan.ai/quiz`
      : `${archetype.nameEn} ${archetype.icon} — ${archetype.taglineEn} What gamer archetype are you? gametan.ai/quiz`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isZh ? archetype.name : archetype.nameEn,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* failed */ }
  }, [id, isZh, archetype]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/archetype"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground pressable"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("archetype.exploreAll")}
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="pressable gap-1.5"
            onClick={handleShare}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied
              ? (isZh ? "已复制" : "Copied!")
              : (isZh ? "分享" : "Share")}
          </Button>
          <Link href="/quiz">
            <Button size="sm" variant="outline" className="pressable gap-1.5">
              <Sparkles size={14} />
              {t("archetype.takeQuiz")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div
        className="rounded-2xl p-6 text-center space-y-3"
        style={{
          background: `linear-gradient(135deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
        }}
      >
        <div className="text-6xl">{archetype.icon}</div>
        <div>
          <h1 className="text-2xl font-bold text-white">{name}</h1>
          {isZh && archetype.nameEn && (
            <p className="text-sm text-white/70">{archetype.nameEn}</p>
          )}
        </div>
        <p className="text-white/90 text-sm italic max-w-md mx-auto">
          &ldquo;{tagline}&rdquo;
        </p>
      </div>

      {/* Description */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>

      {/* Ad slot — between description and narrative */}
      <AdSlot slot="archetype-mid" />

      {/* Deep narrative — "this is me" content */}
      {narrative && (
        <div className="space-y-4">
          {[
            {
              icon: <Brain className="w-4 h-4" />,
              titleZh: "你的游戏本能",
              titleEn: "Your Gaming Instinct",
              content: isZh ? narrative.instinct : narrative.instinctEn,
              color: archetype.gradient[0],
            },
            {
              icon: <Eye className="w-4 h-4" />,
              titleZh: "你的典型行为",
              titleEn: "Your Typical Behaviors",
              content: isZh ? narrative.behaviors : narrative.behaviorsEn,
              color: archetype.gradient[1],
            },
            {
              icon: <Users className="w-4 h-4" />,
              titleZh: "队友眼中的你",
              titleEn: "How Teammates See You",
              content: isZh ? narrative.teamView : narrative.teamViewEn,
              color: archetype.gradient[0],
            },
            {
              icon: <TrendingUp className="w-4 h-4" />,
              titleZh: "你的进化之路",
              titleEn: "Your Growth Path",
              content: isZh ? narrative.growthPath : narrative.growthPathEn,
              color: archetype.gradient[1],
            },
          ].map(({ icon, titleZh, titleEn, content, color }) => (
            <Card key={titleEn}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div style={{ color }}>{icon}</div>
                  <h3 className="font-semibold text-sm">
                    {isZh ? titleZh : titleEn}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hall of Fame */}
      {hallOfFamePlayers.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">
                {isZh ? "殿堂选手" : "Hall of Fame"}
              </h3>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {region === "cn" ? "🇨🇳 中国" : "🌍 Global"}
              </span>
            </div>
            <div className="space-y-2">
              {hallOfFamePlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-start gap-3 p-2 rounded-xl bg-muted/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">
                        {isZh ? player.name : player.nameEn}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {player.game}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {isZh ? player.signature : player.signatureEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deep dive sections */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { section: "games", icon: "🎮", zh: "推荐游戏", en: "Games" },
          { section: "relationships", icon: "💞", zh: "关系图谱", en: "Relationships" },
          { section: "growth", icon: "📈", zh: "进化之路", en: "Growth" },
          { section: "characters", icon: "🎭", zh: "角色匹配", en: "Characters" },
        ].map(({ section, icon, zh, en }) => (
          <Link
            key={section}
            href={`/archetype/${id}/${section}`}
            className="pressable flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:bg-muted/50 transition-colors"
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-medium">{isZh ? zh : en}</span>
          </Link>
        ))}
      </div>

      {/* Strength & Weakness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">{t("archetype.strength")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t(`talent.${archetype.strongTalent}`)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-destructive" />
              <h3 className="font-semibold text-sm">{t("archetype.weakness")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{weakness}</p>
          </CardContent>
        </Card>
      </div>

      {/* Relationships */}
      <div className="grid grid-cols-2 gap-3">
        {/* Nemesis */}
        {nemesis && (
          <Link href={`/archetype/${nemesis.id}`} className="pressable">
            <Card className="hover:border-destructive/30 transition-colors">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-destructive" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("archetype.nemesis")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{nemesis.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">
                      {isZh ? nemesis.name : nemesis.nameEn}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Ally */}
        {ally && (
          <Link href={`/archetype/${ally.id}`} className="pressable">
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("archetype.ally")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{ally.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">
                      {isZh ? ally.name : ally.nameEn}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Evolution */}
      {evolution && (
        <Link href={`/archetype/${evolution.id}`} className="pressable block">
          <Card
            className="hover:shadow-md transition-all"
            style={{
              borderColor: `${evolution.gradient[0]}40`,
            }}
          >
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">{t("archetype.evolution")}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{archetype.icon}</span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-3xl">{evolution.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {isZh ? evolution.name : evolution.nameEn}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{evolutionHint}</p>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Recommended genres */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">{t("archetype.recGenres")}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {archetype.genres.map((g) => (
              <Link
                key={g}
                href={`/explore?genre=${g}`}
                className="pressable"
              >
                <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  {t(`genre.${g}`)}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compatibility CTA */}
      <Card
        className="overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${archetype.gradient[0]}10, ${archetype.gradient[1]}10)`,
        }}
      >
        <CardContent className="pt-4 space-y-3 text-center">
          <p className="text-sm font-medium">
            {isZh
              ? `看看${archetype.name}和其他原型的兼容性`
              : `Check ${archetype.nameEn}'s compatibility with other archetypes`}
          </p>
          <Link href={`/archetype/compatibility?a=${archetype.id}`}>
            <Button variant="outline" size="sm" className="pressable">
              {t("archetype.compatibility")}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Other archetypes (compact grid) */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("archetype.exploreAll")}
        </h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {allTypes
            .filter((a) => a.id !== archetype.id)
            .map((a) => (
              <Link
                key={a.id}
                href={`/archetype/${a.id}`}
                className="pressable flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors"
                title={isZh ? a.name : a.nameEn}
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-[10px] text-muted-foreground text-center line-clamp-1">
                  {isZh ? a.name : a.nameEn}
                </span>
              </Link>
            ))}
        </div>
      </div>

      {/* Quiz CTA */}
      <div className="text-center py-4">
        <Link href="/quiz">
          <Button size="lg" className="pressable gap-2">
            <Sparkles size={18} />
            {t("archetype.takeQuiz")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
