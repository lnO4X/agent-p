"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ARCHETYPES } from "@/lib/archetype";
import { TRAINABILITY } from "@/lib/trainability";
import { TALENT_CATEGORIES, type TalentCategory } from "@/types/talent";
import { ArrowLeft, BookOpen, Trophy } from "lucide-react";
import {
  buildRadarData,
  OverlaidRadar,
  SessionHeader,
  HighlightRow,
  DeltaRow,
  type HistoryEntry,
} from "./compare-parts";

export type { HistoryEntry };

interface DeltaComputed {
  category: TalentCategory;
  a: number | undefined;
  b: number | undefined;
  delta: number | null;
  trainability: number;
  aboveCeiling: boolean;
}

function computeDeltas(
  baseline: HistoryEntry,
  current: HistoryEntry
): DeltaComputed[] {
  return TALENT_CATEGORIES.map((cat) => {
    const a = baseline.talents[cat];
    const b = current.talents[cat];
    const delta =
      typeof a === "number" && typeof b === "number"
        ? Math.round((b - a) * 10) / 10
        : null;
    const trainability = TRAINABILITY[cat]?.trainabilityPct ?? 0;
    const aboveCeiling =
      delta != null &&
      typeof a === "number" &&
      a > 0 &&
      (delta / a) * 100 > trainability;
    return { category: cat, a, b, delta, trainability, aboveCeiling };
  });
}

interface CompareViewProps {
  entries: [HistoryEntry, HistoryEntry];
  onBack: () => void;
  isZh: boolean;
  locale: string;
  t: (key: string) => string;
}

export function CompareView({
  entries,
  onBack,
  isZh,
  locale,
  t,
}: CompareViewProps) {
  const [baseline, current] = entries;

  const deltas = useMemo(
    () => computeDeltas(baseline, current),
    [baseline, current]
  );

  const withDelta = deltas.filter(
    (d): d is DeltaComputed & { delta: number } => d.delta != null
  );
  const biggestGain = withDelta.slice().sort((a, b) => b.delta - a.delta)[0];
  const biggestDrop = withDelta.slice().sort((a, b) => a.delta - b.delta)[0];
  const hasHighlights =
    (biggestGain && biggestGain.delta > 0) ||
    (biggestDrop && biggestDrop.delta < 0);

  const radarData = buildRadarData(entries, (cat) => t(`talent.${cat}`));
  const baselineArch = baseline.archetypeId
    ? ARCHETYPES[baseline.archetypeId]
    : null;
  const currentArch = current.archetypeId
    ? ARCHETYPES[current.archetypeId]
    : null;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        {isZh ? "返回列表" : "Back to list"}
      </button>

      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-3">
            <SessionHeader
              label={isZh ? "基线" : "Baseline"}
              archetype={baselineArch}
              entry={baseline}
              isZh={isZh}
              locale={locale}
              emphasis="muted"
            />
            <SessionHeader
              label={isZh ? "当前" : "Current"}
              archetype={currentArch}
              entry={current}
              isZh={isZh}
              locale={locale}
              emphasis="accent"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Trophy size={14} className="text-primary" />
            {isZh ? "认知图谱对比" : "Cognitive Profile Comparison"}
          </h3>
          <OverlaidRadar data={radarData} isZh={isZh} />
        </CardContent>
      </Card>

      {hasHighlights && (
        <Card className="bg-primary/5 ring-1 ring-primary/20">
          <CardContent className="py-4 space-y-2">
            <h3 className="text-sm font-semibold">
              {isZh ? "变化重点" : "Change Highlights"}
            </h3>
            {biggestGain && biggestGain.delta > 0 && (
              <HighlightRow
                direction="up"
                value={biggestGain.delta}
                label={t(`talent.${biggestGain.category}`)}
                note={isZh ? "— 你的最大增益。" : "— your biggest gain."}
              />
            )}
            {biggestDrop && biggestDrop.delta < 0 && (
              <HighlightRow
                direction="down"
                value={biggestDrop.delta}
                label={t(`talent.${biggestDrop.category}`)}
                note={isZh ? "— 最大回落。" : "— biggest dip."}
              />
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold mb-3">
            {isZh ? "各维度变化" : "Dimension-Level Change"}
          </h3>
          <div className="space-y-1.5">
            {deltas.map(({ category, a, b, delta, aboveCeiling }) => (
              <DeltaRow
                key={category}
                label={t(`talent.${category}`)}
                a={a}
                b={b}
                delta={delta}
                aboveCeiling={aboveCeiling}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
            <BookOpen size={14} className="shrink-0 mt-0.5" />
            <p>
              {isZh
                ? "* 标记的增益超过该维度的可训练天花板，更可能反映练习效应（对游戏熟悉度）而非真实能力变化。每个维度的天花板与文献引用见 "
                : "* Marked gains exceed the published trainability ceiling for that dimension, likely reflecting practice effect (familiarity with the game format) rather than true ability change. See per-dimension ceilings and citations in "}
              <Link href="/methodology" className="text-primary hover:underline">
                {isZh ? "方法论" : "methodology"}
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
