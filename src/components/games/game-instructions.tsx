"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface GameInstructionsProps {
  name: string;
  icon: string;
  instructions: string;
  estimatedDuration: number;
  difficulty: string;
  onStart: () => void;
}

export function GameInstructions({
  name,
  icon,
  instructions,
  estimatedDuration,
  difficulty,
  onStart,
}: GameInstructionsProps) {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="text-4xl mb-2">{icon}</div>
        <CardTitle className="text-xl">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">{instructions}</p>
        <div className="flex gap-4 justify-center text-sm text-muted-foreground">
          <span>预计时长: ~{estimatedDuration}秒</span>
          <span>
            难度:{" "}
            {difficulty === "easy"
              ? "简单"
              : difficulty === "medium"
                ? "中等"
                : "困难"}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onStart} className="w-full" size="lg">
          开始测试
        </Button>
      </CardFooter>
    </Card>
  );
}
