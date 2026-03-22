"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArchetype, getAllArchetypes } from "@/lib/archetype";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Sparkles, Swords, Shield, Zap, Heart,
  ArrowUpRight, Gamepad2,
} from "lucide-react";

export default function ArchetypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t, locale } = useI18n();
  const isZh = locale === "zh";

  const archetype = getArchetype(id);
  if (!archetype) notFound();

  const nemesis = getArchetype(archetype.nemesisId);
  const ally = getArchetype(archetype.allyId);
  const evolution = getArchetype(archetype.evolutionId);
  const allTypes = getAllArchetypes();

  const name = isZh ? archetype.name : archetype.nameEn;
  const tagline = isZh ? archetype.tagline : archetype.taglineEn;
  const description = isZh ? archetype.description : archetype.descriptionEn;
  const weakness = isZh ? archetype.weakness : archetype.weaknessEn;
  const evolutionHint = isZh ? archetype.evolutionHint : archetype.evolutionHintEn;

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
        <Link href="/quiz">
          <Button size="sm" variant="outline" className="pressable gap-1.5">
            <Sparkles size={14} />
            {t("archetype.takeQuiz")}
          </Button>
        </Link>
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
