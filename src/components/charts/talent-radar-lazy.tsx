"use client";

import dynamic from "next/dynamic";
import type { TalentCategory } from "@/types/talent";

const TalentRadar = dynamic(
  () =>
    import("@/components/charts/talent-radar").then((mod) => ({
      default: mod.TalentRadar,
    })),
  {
    loading: () => (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    ),
    ssr: false,
  }
);

export function LazyTalentRadar({
  scores,
}: {
  scores: Partial<Record<TalentCategory, number>>;
}) {
  return <TalentRadar scores={scores} />;
}
