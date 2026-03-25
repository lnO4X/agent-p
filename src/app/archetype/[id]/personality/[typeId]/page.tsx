"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArchetype } from "@/lib/archetype";
import { getPersonalityType } from "@/lib/personality-types";
import { getCombination } from "@/lib/personality-archetype-matrix";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Shield,
  Brain,
  Users,
  ArrowRight,
} from "lucide-react";

export default function PersonalityArchetypeComboPage({
  params,
}: {
  params: Promise<{ id: string; typeId: string }>;
}) {
  const { id, typeId } = use(params);
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const archetype = getArchetype(id);
  const personality = getPersonalityType(typeId);

  if (!archetype || !personality) notFound();

  const combo = getCombination(personality.code, archetype.id);
  if (!combo) notFound();

  const archetypeName = isZh ? archetype.name : archetype.nameEn;
  const personalityName = isZh ? personality.name : personality.nameEn;
  const comboTitle = `${personality.code} ${archetypeName}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/archetype/${id}/personality`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground pressable"
        >
          <ArrowLeft className="w-4 h-4" />
          {isZh ? "所有性格类型" : "All Personality Types"}
        </Link>
        <Link href="/quiz">
          <Button size="sm" variant="outline" className="pressable gap-1.5">
            <Sparkles size={14} />
            {isZh ? "测一测" : "Take Quiz"}
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
        <div className="text-5xl">{archetype.icon}</div>
        <div>
          <h1 className="text-2xl font-bold text-white">{comboTitle}</h1>
          <p className="text-sm text-white/70">
            {personality.emoji} {personalityName} × {archetypeName}
          </p>
        </div>
        <p className="text-white/90 text-sm max-w-md mx-auto">
          {isZh ? personality.gaming : personality.gamingEn}
        </p>
      </div>

      {/* Insight */}
      <Card>
        <CardContent className="pt-5 space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" style={{ color: archetype.gradient[0] }} />
            <h2 className="font-semibold text-sm">
              {isZh ? "独特洞察" : "Unique Insight"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isZh ? combo.insight : combo.insightEn}
          </p>
        </CardContent>
      </Card>

      {/* Superpower */}
      <Card>
        <CardContent className="pt-5 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: archetype.gradient[0] }} />
            <h2 className="font-semibold text-sm">
              {isZh ? "超级能力" : "Superpower"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isZh ? combo.superpower : combo.superpowerEn}
          </p>
        </CardContent>
      </Card>

      {/* Blindspot */}
      <Card>
        <CardContent className="pt-5 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-destructive" />
            <h2 className="font-semibold text-sm">
              {isZh ? "盲点" : "Blindspot"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isZh ? combo.blindspot : combo.blindspotEn}
          </p>
        </CardContent>
      </Card>

      {/* Social Score */}
      <Card>
        <CardContent className="pt-5 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: archetype.gradient[1] }} />
            <h2 className="font-semibold text-sm">
              {isZh ? "社交兼容度" : "Social Compatibility"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${combo.socialScore}%`,
                  background: `linear-gradient(90deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`,
                }}
              />
            </div>
            <span className="text-sm font-mono font-semibold">{combo.socialScore}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isZh
              ? "和随机队友的默契程度。越高代表越容易融入团队。"
              : "How well you mesh with random teammates. Higher = easier team integration."}
          </p>
        </CardContent>
      </Card>

      {/* Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/archetype/${id}`} className="pressable">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl">{archetype.icon}</span>
              <div>
                <p className="text-xs text-muted-foreground">
                  {isZh ? "查看原型" : "View Archetype"}
                </p>
                <p className="font-semibold text-sm">{archetypeName}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/archetype/${id}/personality`} className="pressable">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl">{personality.emoji}</span>
              <div>
                <p className="text-xs text-muted-foreground">
                  {isZh ? "其他性格" : "Other Types"}
                </p>
                <p className="font-semibold text-sm">
                  {isZh ? "16种性格" : "16 Types"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quiz CTA */}
      <Card
        className="overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${archetype.gradient[0]}10, ${archetype.gradient[1]}10)`,
        }}
      >
        <CardContent className="pt-5 pb-5 space-y-3 text-center">
          <p className="text-sm font-medium">
            {isZh
              ? `你是 ${personality.code} ${archetypeName} 吗？做个测试看看！`
              : `Are you the ${personality.code} ${archetype.nameEn}? Take the quiz to find out!`}
          </p>
          <Link href="/quiz">
            <Button className="pressable gap-2">
              <Sparkles size={16} />
              {isZh ? "开始测试" : "Take the Quiz"}
              <ArrowRight size={16} />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
