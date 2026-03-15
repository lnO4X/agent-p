import type { Rank } from "@/types/talent";
import { RANK_COLORS } from "@/lib/scoring";

interface RankBadgeProps {
  rank: Rank;
  size?: "sm" | "md" | "lg";
}

export function RankBadge({ rank, size = "md" }: RankBadgeProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-20 h-20 text-3xl",
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full border-2 font-bold ${RANK_COLORS[rank]} ${sizeClasses[size]}`}
    >
      {rank}
    </div>
  );
}
