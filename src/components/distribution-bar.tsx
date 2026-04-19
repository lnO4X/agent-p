"use client";

import { DISTRIBUTION_BINS } from "@/lib/literature-norms";
import { useI18n } from "@/i18n/context";

interface DistributionBarProps {
  userScore: number;
  /** Literature top-5%-of-gamers reference value (published studies) */
  referenceScore: number;
  isZh: boolean;
  className?: string;
}

/**
 * Mini distribution chart — 10 vertical bars representing score bins.
 * Marks the user's position and a literature-based reference position
 * (top 5% of gamers in published research).
 */
export function DistributionBar({
  userScore,
  referenceScore,
  isZh,
  className,
}: DistributionBarProps) {
  const { t } = useI18n();
  const maxBin = Math.max(...DISTRIBUTION_BINS);
  const userBin = Math.min(Math.floor(userScore / 10), 9);
  const refBin = Math.min(Math.floor(referenceScore / 10), 9);

  return (
    <div
      className={className}
      role="img"
      aria-label={t("distribution.ariaLabel", {
        score: Math.round(userScore),
        proAvg: referenceScore,
      })}
    >
      {/* Bars */}
      <div className="flex items-end gap-[3px] h-16">
        {DISTRIBUTION_BINS.map((pct, i) => {
          const height = Math.max(4, (pct / maxBin) * 100);
          const isUser = i === userBin;
          const isRef = i === refBin;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-t-sm transition-all ${
                  isUser
                    ? "bg-primary"
                    : isRef
                      ? "bg-accent/60"
                      : "bg-muted-foreground/20"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex items-center gap-[3px] mt-1">
        {DISTRIBUTION_BINS.map((_, i) => {
          const isUser = i === userBin;
          const isRef = i === refBin;
          return (
            <div key={i} className="flex-1 text-center">
              {isUser && (
                <div className="text-[9px] text-primary font-bold leading-tight">
                  {t("distribution.you")}
                </div>
              )}
              {isRef && !isUser && (
                <div className="text-[9px] text-accent font-bold leading-tight">
                  {isZh ? "前 5%" : "Top 5%"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-primary inline-block" />
          {t("distribution.youScore", { score: Math.round(userScore) })}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-accent/60 inline-block" />
          {isZh
            ? `文献前 5% (${referenceScore})`
            : `Literature top 5% (${referenceScore})`}
        </span>
      </div>
      {/* Data disclaimer — literature-sourced, not pro data */}
      <div className="text-[10px] text-muted-foreground/50 text-center mt-1">
        {isZh
          ? "基于已发表的玩家认知研究（Dale & Green 2017; Kowal et al. 2018）"
          : "Based on published gamer cognitive research (Dale & Green 2017; Kowal et al. 2018)"}
      </div>
    </div>
  );
}
