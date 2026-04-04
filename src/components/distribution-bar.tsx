"use client";

import { DISTRIBUTION_BINS } from "@/lib/pro-benchmarks";

interface DistributionBarProps {
  userScore: number;
  proAvg: number;
  isZh: boolean;
  className?: string;
}

/**
 * Mini bell-curve distribution chart — 10 vertical bars representing score bins.
 * Marks the user's position and the pro average line.
 */
export function DistributionBar({ userScore, proAvg, isZh, className }: DistributionBarProps) {
  const maxBin = Math.max(...DISTRIBUTION_BINS);
  const userBin = Math.min(Math.floor(userScore / 10), 9);
  const proBin = Math.min(Math.floor(proAvg / 10), 9);

  return (
    <div className={className}>
      {/* Bars */}
      <div className="flex items-end gap-[3px] h-16">
        {DISTRIBUTION_BINS.map((pct, i) => {
          const height = Math.max(4, (pct / maxBin) * 100);
          const isUser = i === userBin;
          const isPro = i === proBin;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-t-sm transition-all ${
                  isUser
                    ? "bg-primary"
                    : isPro
                      ? "bg-amber-400/60"
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
          const isPro = i === proBin;
          return (
            <div key={i} className="flex-1 text-center">
              {isUser && (
                <div className="text-[9px] text-primary font-bold leading-tight">
                  {isZh ? "你" : "You"}
                </div>
              )}
              {isPro && !isUser && (
                <div className="text-[9px] text-amber-400 font-bold leading-tight">
                  Pro
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
          {isZh ? `你 (${Math.round(userScore)})` : `You (${Math.round(userScore)})`}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-400/60 inline-block" />
          {isZh ? `职业平均 (${proAvg})` : `Pro Avg (${proAvg})`}
        </span>
      </div>
    </div>
  );
}
