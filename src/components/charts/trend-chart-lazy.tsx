"use client";

import dynamic from "next/dynamic";
import type { TalentCategory } from "@/types/talent";

const TrendChart = dynamic(
  () =>
    import("@/components/charts/trend-chart").then((mod) => ({
      default: mod.TrendChart,
    })),
  {
    loading: () => (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    ),
    ssr: false,
  }
);

export function LazyTrendChart({
  history,
  talentCategory,
  trendTitle,
  talentLabel,
}: {
  history: Array<{ score: number; completedAt: string }>;
  talentCategory: TalentCategory;
  trendTitle: string;
  talentLabel: string;
}) {
  return (
    <TrendChart
      history={history}
      talentCategory={talentCategory}
      trendTitle={trendTitle}
      talentLabel={talentLabel}
    />
  );
}
