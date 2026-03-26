"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TalentIcon } from "@/components/talent-icon";
import { useI18n } from "@/i18n/context";
import { ARCHETYPES } from "@/lib/archetype";
import type { TalentCategory } from "@/types/talent";
import { TALENT_CATEGORIES } from "@/types/talent";
import { TrendingUp, ArrowRight, Sparkles, RotateCcw } from "lucide-react";
import Link from "next/link";

interface HistoryEntry {
  date: string;
  archetypeId: string | null;
  overallScore: number | null;
  talents: Partial<Record<TalentCategory, number>>;
}

interface Evolution {
  firstArchetype: string | null;
  currentArchetype: string | null;
  evolved: boolean;
  overallChange: number;
}

interface EvolutionTrackerProps {
  history: HistoryEntry[];
  evolution: Evolution | null;
}

// Simple SVG line chart for overall score trend
function ScoreTrendChart({
  history,
}: {
  history: HistoryEntry[];
}) {
  const scores = history
    .map((h) => h.overallScore)
    .filter((s): s is number => s != null);
  if (scores.length < 2) return null;

  const width = 280;
  const height = 60;
  const padX = 12;
  const padY = 8;

  const minScore = Math.max(0, Math.min(...scores) - 5);
  const maxScore = Math.min(100, Math.max(...scores) + 5);
  const range = maxScore - minScore || 1;

  const points = scores.map((score, i) => {
    const x = padX + (i / (scores.length - 1)) * (width - 2 * padX);
    const y = padY + (1 - (score - minScore) / range) * (height - 2 * padY);
    return { x, y, score };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ maxHeight: 60 }}
    >
      {/* Grid lines */}
      <line
        x1={padX}
        y1={padY}
        x2={width - padX}
        y2={padY}
        stroke="currentColor"
        strokeOpacity={0.08}
        strokeWidth={0.5}
      />
      <line
        x1={padX}
        y1={height - padY}
        x2={width - padX}
        y2={height - padY}
        stroke="currentColor"
        strokeOpacity={0.08}
        strokeWidth={0.5}
      />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="oklch(0.65 0.2 250)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill={i === points.length - 1 ? "oklch(0.65 0.2 250)" : "oklch(0.75 0.15 250)"}
          stroke="white"
          strokeWidth={1}
        />
      ))}
      {/* Score labels for first and last */}
      <text
        x={points[0].x}
        y={points[0].y - 6}
        textAnchor="start"
        fontSize={8}
        fill="currentColor"
        opacity={0.5}
      >
        {Math.round(scores[0])}
      </text>
      <text
        x={points[points.length - 1].x}
        y={points[points.length - 1].y - 6}
        textAnchor="end"
        fontSize={8}
        fill="currentColor"
        opacity={0.5}
      >
        {Math.round(scores[scores.length - 1])}
      </text>
    </svg>
  );
}

export function EvolutionTracker({ history, evolution }: EvolutionTrackerProps) {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";

  if (history.length < 2) return null;

  const first = history[0];
  const current = history[history.length - 1];
  const currentArchetype = current.archetypeId
    ? ARCHETYPES[current.archetypeId]
    : null;
  const firstArchetype = first.archetypeId
    ? ARCHETYPES[first.archetypeId]
    : null;

  // Check if last test was >7 days ago
  const lastTestDate = new Date(current.date);
  const daysSinceLastTest = Math.floor(
    (Date.now() - lastTestDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const showRetakeCta = daysSinceLastTest > 7;

  // Compute per-talent changes
  const talentChanges = TALENT_CATEGORIES.map((cat) => {
    const firstScore = first.talents[cat];
    const currentScore = current.talents[cat];
    const change =
      typeof firstScore === "number" && typeof currentScore === "number"
        ? Math.round((currentScore - firstScore) * 10) / 10
        : null;
    return { category: cat, current: currentScore, change };
  }).filter(
    (t) => t.current != null
  ) as { category: TalentCategory; current: number; change: number | null }[];

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-primary shrink-0" />
          <h2 className="text-sm font-semibold">
            {isZh ? "成长轨迹" : "Evolution Tracker"}
          </h2>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {isZh
              ? `${history.length} 次测试`
              : `${history.length} tests`}
          </span>
        </div>

        {/* Evolution banner */}
        {evolution?.evolved && firstArchetype && currentArchetype && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: `linear-gradient(135deg, ${currentArchetype.gradient[0]}15, ${currentArchetype.gradient[1]}15)`,
            }}
          >
            <Sparkles size={14} className="text-primary shrink-0" />
            <span className="font-medium">
              {isZh ? "你进化了！" : "You've evolved!"}
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              <span>{firstArchetype.icon}</span>
              <span className="text-muted-foreground">
                {isZh ? firstArchetype.name : firstArchetype.nameEn}
              </span>
              <ArrowRight size={12} className="text-muted-foreground" />
              <span>{currentArchetype.icon}</span>
              <span
                className="font-bold"
                style={{
                  background: `linear-gradient(135deg, ${currentArchetype.gradient[0]}, ${currentArchetype.gradient[1]})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {isZh ? currentArchetype.name : currentArchetype.nameEn}
              </span>
            </div>
          </div>
        )}

        {/* Current archetype identity */}
        {currentArchetype && !evolution?.evolved && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-lg">{currentArchetype.icon}</span>
            <span
              className="font-semibold"
              style={{
                background: `linear-gradient(135deg, ${currentArchetype.gradient[0]}, ${currentArchetype.gradient[1]})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {isZh ? currentArchetype.name : currentArchetype.nameEn}
            </span>
            {evolution && evolution.overallChange !== 0 && (
              <span
                className={`ml-auto font-bold ${
                  evolution.overallChange > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {evolution.overallChange > 0 ? "+" : ""}
                {evolution.overallChange}
              </span>
            )}
          </div>
        )}

        {/* Score trend chart */}
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">
            {isZh ? "综合评分趋势" : "Overall Score Trend"}
          </div>
          <ScoreTrendChart history={history} />
        </div>

        {/* Per-talent changes */}
        <div>
          <div className="text-[10px] text-muted-foreground mb-2">
            {isZh ? "天赋变化" : "Talent Changes"}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {talentChanges.map(({ category, current, change }) => (
              <div key={category} className="flex items-center gap-1.5">
                <TalentIcon
                  category={category}
                  size={11}
                  className="text-muted-foreground shrink-0"
                />
                <span className="text-[10px] text-muted-foreground truncate flex-1">
                  {t(`talent.${category}`)}
                </span>
                <span className="text-[10px] font-bold tabular-nums w-6 text-right">
                  {Math.round(current)}
                </span>
                {change != null && change !== 0 && (
                  <span
                    className={`text-[10px] font-medium tabular-nums w-8 text-right ${
                      change > 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {change > 0 ? `\u25B2${Math.abs(change)}` : `\u25BC${Math.abs(change)}`}
                  </span>
                )}
                {(change == null || change === 0) && (
                  <span className="text-[10px] text-muted-foreground/50 w-8 text-right">
                    —
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Retake CTA */}
        {showRetakeCta && (
          <Link href="/quiz" className="block">
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 transition-colors pressable">
              <RotateCcw size={14} className="text-primary" />
              <span className="text-xs font-medium text-primary">
                {isZh ? "重新测试，追踪进化" : "Retake test, track your evolution"}
              </span>
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
