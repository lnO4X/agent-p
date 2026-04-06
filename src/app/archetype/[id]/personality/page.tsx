"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArchetype } from "@/lib/archetype";
import { getAllPersonalityTypes } from "@/lib/personality-types";
import { getCombination } from "@/lib/personality-archetype-matrix";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, ArrowRight } from "lucide-react";

export default function PersonalityIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t, locale } = useI18n();
  const isZh = locale === "zh";

  const archetype = getArchetype(id);
  if (!archetype) notFound();

  const allTypes = getAllPersonalityTypes();
  const archetypeName = isZh ? archetype.name : archetype.nameEn;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/archetype/${id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground pressable"
        >
          <ArrowLeft className="w-4 h-4" />
          {archetypeName}
        </Link>
        <Link href="/quiz">
          <Button size="sm" variant="outline" className="pressable gap-1.5">
            <Sparkles size={14} />
            {t("archetype.takeQuizShort")}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div
        className="rounded-2xl p-6 text-center space-y-3"
        style={{
          background: `linear-gradient(135deg, ${archetype.gradient[0]}20, ${archetype.gradient[1]}20)`,
        }}
      >
        <div className="text-5xl">{archetype.icon}</div>
        <div>
          <h1 className="text-xl font-bold">
            {t("archetype.personalityCross", { name: archetypeName })}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("archetype.sameArchetypeDiffPersonality")}
          </p>
        </div>
      </div>

      {/* 16 personality type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allTypes.map((pt) => {
          const combo = getCombination(pt.code, archetype.id);
          if (!combo) return null;

          const preview = isZh
            ? combo.superpower.slice(0, 60) + (combo.superpower.length > 60 ? "..." : "")
            : combo.superpowerEn.slice(0, 60) + (combo.superpowerEn.length > 60 ? "..." : "");

          return (
            <Link
              key={pt.code}
              href={`/archetype/${id}/personality/${pt.code.toLowerCase()}`}
              className="pressable"
            >
              <Card className="hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{pt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {pt.code} {archetypeName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {isZh ? pt.name : pt.nameEn}
                      </p>
                    </div>
                    <div
                      className="text-xs font-mono px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `${archetype.gradient[0]}20`,
                        color: archetype.gradient[0],
                      }}
                    >
                      {combo.socialScore}%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {preview}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quiz CTA */}
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {t("archetype.wantToKnowType")}
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
