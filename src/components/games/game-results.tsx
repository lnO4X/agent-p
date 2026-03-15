"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { scoreToRank, RANK_COLORS } from "@/lib/scoring";

interface GameResultsProps {
  gameName: string;
  normalizedScore: number;
  onNext: () => void;
  nextLabel?: string;
}

export function GameResults({
  gameName,
  normalizedScore,
  onNext,
  nextLabel = "下一个",
}: GameResultsProps) {
  const rank = scoreToRank(normalizedScore);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>{gameName} - 完成</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full border-2 text-3xl font-bold ${RANK_COLORS[rank]}`}
        >
          {rank}
        </div>
        <div className="text-2xl font-bold">
          {Math.round(normalizedScore)} 分
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onNext} className="w-full">
          {nextLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
