"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { TALENT_LABELS } from "@/lib/constants";
import type { TalentCategory } from "@/types/talent";

interface TalentRadarProps {
  scores: Partial<Record<TalentCategory, number>>;
}

export function TalentRadar({ scores }: TalentRadarProps) {
  const data = Object.entries(scores)
    .filter(([, v]) => v != null)
    .map(([key, value]) => ({
      talent: TALENT_LABELS[key as TalentCategory]?.zh || key,
      score: value || 0,
      fullMark: 100,
    }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="talent"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
        />
        <Radar
          name="天赋"
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
