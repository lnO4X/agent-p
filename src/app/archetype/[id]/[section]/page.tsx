"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArchetype, getAllArchetypes } from "@/lib/archetype";
import { computeCompatibility } from "@/lib/archetype-compat";
import {
  ARCHETYPE_SECTIONS,
  ARCHETYPE_GAMES,
  ARCHETYPE_CHARACTERS,
} from "@/lib/archetype-content";
import type { ArchetypeSection } from "@/lib/archetype-content";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Gamepad2,
  Heart,
  TrendingUp,
  Users,
  Star,
  Swords,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function ArchetypeSectionPage({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id, section } = use(params);
  const { t, locale } = useI18n();
  const isZh = locale === "zh";

  const archetype = getArchetype(id);
  if (!archetype || !ARCHETYPE_SECTIONS.includes(section as ArchetypeSection)) {
    notFound();
  }

  const sectionIcons: Record<string, React.ReactNode> = {
    games: <Gamepad2 className="w-5 h-5" />,
    relationships: <Heart className="w-5 h-5" />,
    growth: <TrendingUp className="w-5 h-5" />,
    characters: <Users className="w-5 h-5" />,
  };

  const sectionKeys: Record<string, string> = {
    games: "archetype.sectionGames",
    relationships: "archetype.sectionRelationships",
    growth: "archetype.sectionGrowth",
    characters: "archetype.sectionCharacters",
  };

  const name = isZh ? archetype.name : archetype.nameEn;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/archetype/${id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {name}
        </Link>
        <div className="flex gap-2">
          {ARCHETYPE_SECTIONS.filter((s) => s !== section).map((s) => (
            <Link
              key={s}
              href={`/archetype/${id}/${s}`}
              className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
            >
              {t(sectionKeys[s])}
            </Link>
          ))}
        </div>
      </div>

      {/* Header */}
      <div
        className="rounded-xl p-6"
        style={{
          background: `linear-gradient(135deg, ${archetype.gradient[0]}20, ${archetype.gradient[1]}20)`,
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{archetype.icon}</span>
          <div>
            <h1 className="text-xl font-bold">
              {name} — {t(sectionKeys[section])}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isZh ? archetype.tagline : archetype.taglineEn}
            </p>
          </div>
        </div>
      </div>

      {/* Section Content */}
      {section === "games" && <GamesSection archetypeId={id} isZh={isZh} t={t} />}
      {section === "relationships" && <RelationshipsSection archetypeId={id} isZh={isZh} t={t} />}
      {section === "growth" && <GrowthSection archetypeId={id} isZh={isZh} t={t} />}
      {section === "characters" && <CharactersSection archetypeId={id} isZh={isZh} t={t} />}

      {/* CTA */}
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {t("archetype.dontKnowYours")}
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t("archetype.threeMinQuiz")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== GAMES SECTION ====================

type TFunc = (key: string, params?: Record<string, string | number>) => string;

function GamesSection({ archetypeId, isZh, t }: { archetypeId: string; isZh: boolean; t: TFunc }) {
  const games = ARCHETYPE_GAMES[archetypeId] || [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t("archetype.gamesIntro")}
      </p>
      {games.map((game, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{isZh ? game.nameZh : game.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {game.genre}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: game.matchScore }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
                {Array.from({ length: 5 - game.matchScore }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-muted" />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {isZh ? game.reasonZh : game.reason}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ==================== RELATIONSHIPS SECTION ====================

function RelationshipsSection({ archetypeId, isZh, t }: { archetypeId: string; isZh: boolean; t: TFunc }) {
  const archetype = getArchetype(archetypeId)!;
  const allArchetypes = getAllArchetypes();

  // Group by relationship type
  const relationships = allArchetypes
    .filter((a) => a.id !== archetypeId)
    .map((other) => {
      const compat = computeCompatibility(archetypeId, other.id);
      return { archetype: other, compat };
    })
    .filter((r) => r.compat !== null)
    .sort((a, b) => (b.compat?.score || 0) - (a.compat?.score || 0));

  const nemesis = getArchetype(archetype.nemesisId);
  const ally = getArchetype(archetype.allyId);
  const evolution = getArchetype(archetype.evolutionId);

  return (
    <div className="space-y-6">
      {/* Key relationships */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ally && (
          <Link href={`/archetype/${ally.id}`}>
            <Card className="hover:border-green-500/50 transition-colors h-full">
              <CardContent className="p-4 text-center">
                <Shield className="w-5 h-5 mx-auto mb-1 text-green-500" />
                <p className="text-xs text-muted-foreground mb-1">{t("archetype.naturalAlly")}</p>
                <p className="text-2xl mb-1">{ally.icon}</p>
                <p className="font-semibold text-sm">{isZh ? ally.name : ally.nameEn}</p>
              </CardContent>
            </Card>
          </Link>
        )}
        {evolution && (
          <Link href={`/archetype/${evolution.id}`}>
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-4 text-center">
                <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground mb-1">{t("archetype.evolutionTarget")}</p>
                <p className="text-2xl mb-1">{evolution.icon}</p>
                <p className="font-semibold text-sm">{isZh ? evolution.name : evolution.nameEn}</p>
              </CardContent>
            </Card>
          </Link>
        )}
        {nemesis && (
          <Link href={`/archetype/${nemesis.id}`}>
            <Card className="hover:border-red-500/50 transition-colors h-full">
              <CardContent className="p-4 text-center">
                <Swords className="w-5 h-5 mx-auto mb-1 text-red-500" />
                <p className="text-xs text-muted-foreground mb-1">{t("archetype.naturalNemesis")}</p>
                <p className="text-2xl mb-1">{nemesis.icon}</p>
                <p className="font-semibold text-sm">{isZh ? nemesis.name : nemesis.nameEn}</p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* All compatibility */}
      <h2 className="text-lg font-semibold">{t("archetype.allCompatibility")}</h2>
      <div className="space-y-2">
        {relationships.map(({ archetype: other, compat }) => {
          if (!compat) return null;
          const score = compat.score;
          const barColor =
            score >= 80 ? "bg-green-500" : score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";

          return (
            <Link key={other.id} href={`/archetype/${other.id}`} className="block">
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{other.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">
                        {isZh ? other.name : other.nameEn}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">{score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {isZh ? compat.dynamic : compat.dynamicEn}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ==================== GROWTH SECTION ====================

function GrowthSection({ archetypeId, isZh, t }: { archetypeId: string; isZh: boolean; t: TFunc }) {
  const archetype = getArchetype(archetypeId)!;
  const evolution = getArchetype(archetype.evolutionId);

  // Get training games for the weak talent
  const TALENT_NAMES: Record<string, { zh: string; en: string }> = {
    reaction_speed: { zh: "反应速度", en: "Reaction Speed" },
    hand_eye_coord: { zh: "手眼协调", en: "Hand-Eye Coordination" },
    spatial_awareness: { zh: "空间感知", en: "Spatial Awareness" },
    memory: { zh: "记忆力", en: "Memory" },
    strategy_logic: { zh: "反应抑制", en: "Response Inhibition" },
    rhythm_sense: { zh: "节奏感", en: "Rhythm Sense" },
    pattern_recog: { zh: "模式识别", en: "Pattern Recognition" },
    multitasking: { zh: "多任务处理", en: "Multitasking" },
    decision_speed: { zh: "决策速度", en: "Decision Speed" },
    emotional_control: { zh: "干扰抑制", en: "Interference Suppression" },
    teamwork_tendency: { zh: "视角转换", en: "Perspective Taking" },
    risk_assessment: { zh: "风险评估", en: "Risk Assessment" },
    resource_mgmt: { zh: "视觉注意广度", en: "Visual Attention Breadth" },
  };

  const weakName = TALENT_NAMES[archetype.weakTalent] || { zh: "未知", en: "Unknown" };
  const strongName = TALENT_NAMES[archetype.strongTalent] || { zh: "未知", en: "Unknown" };

  return (
    <div className="space-y-6">
      {/* Strength & Weakness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold text-green-600 dark:text-green-400">
                {t("archetype.coreStrength")}
              </h3>
            </div>
            <p className="text-lg font-bold mb-1">
              {isZh ? strongName.zh : strongName.en}
            </p>
            <p className="text-sm text-muted-foreground">
              {isZh ? archetype.description.slice(0, 80) + "..." : archetype.descriptionEn.slice(0, 80) + "..."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-red-600 dark:text-red-400">
                {t("archetype.needsImprovement")}
              </h3>
            </div>
            <p className="text-lg font-bold mb-1">
              {isZh ? weakName.zh : weakName.en}
            </p>
            <p className="text-sm text-muted-foreground">
              {isZh ? archetype.weakness : archetype.weaknessEn}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Evolution Path */}
      {evolution && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t("archetype.evolutionPath")}
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-center">
                <p className="text-2xl">{archetype.icon}</p>
                <p className="text-xs font-medium">{isZh ? archetype.name : archetype.nameEn}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary" />
              <Link href={`/archetype/${evolution.id}`} className="text-center hover:opacity-80">
                <p className="text-2xl">{evolution.icon}</p>
                <p className="text-xs font-medium">{isZh ? evolution.name : evolution.nameEn}</p>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {isZh ? archetype.evolutionHint : archetype.evolutionHintEn}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Training Recommendation */}
      <h2 className="text-lg font-semibold">
        {t("archetype.trainingGamesFor", { talent: isZh ? weakName.zh : weakName.en })}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("archetype.trainingIntro")}
      </p>

      {/* Link to full test */}
      <Card className="border-primary/30">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {t("archetype.wantExactScores")}
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t("archetype.startFullTest")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== CHARACTERS SECTION ====================

function CharactersSection({ archetypeId, isZh, t }: { archetypeId: string; isZh: boolean; t: TFunc }) {
  const characters = ARCHETYPE_CHARACTERS[archetypeId] || [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t("archetype.charactersIntro")}
      </p>
      {characters.map((char, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-bold">
                {(isZh ? char.nameZh : char.name).charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{isZh ? char.nameZh : char.name}</h3>
                <p className="text-xs text-muted-foreground mb-1">{char.game}</p>
                <p className="text-sm text-muted-foreground">
                  {isZh ? char.reasonZh : char.reason}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
