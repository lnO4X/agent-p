"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { TALENT_CATEGORIES, type TalentCategory } from "@/types/talent";
import { ARCHETYPES } from "@/lib/archetype";

export interface HistoryEntry {
  sessionId: string;
  date: string;
  archetypeId: string | null;
  overallScore: number | null;
  overallRank: string | null;
  talents: Partial<Record<TalentCategory, number>>;
}

export function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(
    locale === "en" ? "en-US" : locale === "zh" ? "zh-CN" : locale,
    { year: "numeric", month: "short", day: "numeric" }
  );
}

export function buildRadarData(
  entries: HistoryEntry[],
  talentLabel: (cat: TalentCategory) => string
) {
  return TALENT_CATEGORIES.map((cat) => {
    const row: Record<string, number | string> = {
      talent: talentLabel(cat),
      fullMark: 100,
    };
    entries.forEach((e, i) => {
      row[`session${i}`] = e.talents[cat] ?? 0;
    });
    return row;
  });
}

export function OverlaidRadar({
  data,
  isZh,
}: {
  data: ReturnType<typeof buildRadarData>;
  isZh: boolean;
}) {
  return (
    <>
      <div className="w-full" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="talent"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
            />
            <Radar
              name={isZh ? "基线" : "Baseline"}
              dataKey="session0"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.15}
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
            <Radar
              name={isZh ? "当前" : "Current"}
              dataKey="session1"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 justify-center text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 border-t border-dashed border-muted-foreground" />
          {isZh ? "基线" : "Baseline"}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-primary" />
          {isZh ? "当前" : "Current"}
        </span>
      </div>
    </>
  );
}

export function SessionHeader({
  label,
  archetype,
  entry,
  isZh,
  locale,
  emphasis,
}: {
  label: string;
  archetype: (typeof ARCHETYPES)[string] | null;
  entry: HistoryEntry;
  isZh: boolean;
  locale: string;
  emphasis: "accent" | "muted";
}) {
  return (
    <div className="text-center">
      <div
        className={`text-[10px] uppercase tracking-wide ${
          emphasis === "accent" ? "text-accent" : "text-muted-foreground"
        }`}
      >
        {label}
      </div>
      <div className="text-3xl mt-1">{archetype?.icon ?? "—"}</div>
      <div className="text-xs font-semibold mt-1">
        {archetype ? (isZh ? archetype.name : archetype.nameEn) : "—"}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        {formatDate(entry.date, locale)}
      </div>
      <div className="text-xs font-mono mt-0.5">
        {entry.overallRank ?? "—"}{" "}
        {typeof entry.overallScore === "number"
          ? Math.round(entry.overallScore)
          : "—"}
      </div>
    </div>
  );
}

export function HighlightRow({
  direction,
  value,
  label,
  note,
}: {
  direction: "up" | "down";
  value: number;
  label: string;
  note: string;
}) {
  const Icon = direction === "up" ? TrendingUp : TrendingDown;
  const colorClass = direction === "up" ? "text-green-500" : "text-red-500";
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon size={14} className={`${colorClass} shrink-0 mt-0.5`} />
      <div>
        <span className={`font-semibold ${colorClass}`}>
          {value > 0 ? `+${value}` : value}
        </span>{" "}
        <span className="font-medium">{label}</span>{" "}
        <span className="text-muted-foreground">{note}</span>
      </div>
    </div>
  );
}

export function DeltaRow({
  label,
  a,
  b,
  delta,
  aboveCeiling,
}: {
  label: string;
  a: number | undefined;
  b: number | undefined;
  delta: number | null;
  aboveCeiling: boolean;
}) {
  const deltaColor =
    delta == null
      ? "text-muted-foreground/50"
      : delta > 0
        ? "text-green-500"
        : delta < 0
          ? "text-red-500"
          : "text-muted-foreground";
  return (
    <div className="flex items-center gap-3 text-xs py-1">
      <span className="flex-1 min-w-0 truncate">{label}</span>
      <span className="font-mono tabular-nums text-muted-foreground w-10 text-right">
        {typeof a === "number" ? Math.round(a) : "—"}
      </span>
      <ChevronRight size={10} className="text-muted-foreground shrink-0" />
      <span className="font-mono tabular-nums font-semibold w-10 text-right">
        {typeof b === "number" ? Math.round(b) : "—"}
      </span>
      <span className={`font-mono tabular-nums w-14 text-right ${deltaColor}`}>
        {delta == null ? "—" : delta > 0 ? `+${delta}` : `${delta}`}
        {aboveCeiling && "*"}
      </span>
    </div>
  );
}
