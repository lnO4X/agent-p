"use client";

import { useState, useCallback, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { gameRegistry } from "@/games";
import { GameInstructions } from "@/components/games/game-instructions";
import { GameResults } from "@/components/games/game-results";
import { useIsMobile } from "@/hooks/use-device";
import { useI18n } from "@/i18n/context";
import type { GameRawResult } from "@/types/game";

type Phase = "instructions" | "playing" | "result" | "completing";

export default function TestSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { locale } = useI18n();
  const isMobile = useIsMobile();
  const isZh = locale === "zh";
  const games = useMemo(
    () => gameRegistry.getFullTestSet(isMobile),
    [isMobile]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("instructions");
  const [lastScore, setLastScore] = useState(0);

  const currentGame = games[currentIndex];

  const handleComplete = useCallback(
    async (result: GameRawResult) => {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          gameId: currentGame.id,
          rawScore: result.rawScore,
          durationMs: result.durationMs,
          metadata: result.metadata,
        }),
      });
      const json = await res.json();
      setLastScore(json.data?.normalizedScore || 0);
      setPhase("result");
    },
    [sessionId, currentGame]
  );

  const handleNext = useCallback(async () => {
    if (currentIndex + 1 >= games.length) {
      setPhase("completing");
      await fetch(`/api/sessions/${sessionId}/complete`, {
        method: "POST",
      });
      router.push(`/results/${sessionId}`);
    } else {
      setCurrentIndex((i) => i + 1);
      setPhase("instructions");
    }
  }, [currentIndex, games.length, sessionId, router]);

  const handleAbort = useCallback(() => {
    router.push("/test");
  }, [router]);

  if (!currentGame) return null;

  const GameComponent = currentGame.component;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
          <span>
            {currentIndex + 1} / {games.length}
          </span>
          <span>{currentGame.name}</span>
        </div>
        <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{
              width: `${((currentIndex + (phase === "result" ? 1 : 0)) / games.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Mobile skip notice */}
      {isMobile && (
        <div className="text-xs text-center text-muted-foreground">
          {isZh ? "手机模式：已跳过需要鼠标/键盘的游戏" : "Mobile mode: skipped games requiring mouse/keyboard"}
        </div>
      )}

      {/* Game area */}
      {phase === "instructions" && (
        <GameInstructions
          name={currentGame.name}
          icon={currentGame.icon}
          instructions={currentGame.instructions}
          estimatedDuration={currentGame.estimatedDurationSec}
          difficulty={currentGame.difficulty}
          onStart={() => setPhase("playing")}
        />
      )}

      {phase === "playing" && (
        <GameComponent onComplete={handleComplete} onAbort={handleAbort} />
      )}

      {phase === "result" && (
        <GameResults
          gameName={currentGame.name}
          normalizedScore={lastScore}
          onNext={handleNext}
          nextLabel={
            currentIndex + 1 >= games.length
              ? (isZh ? "查看结果" : "View Results")
              : (isZh ? "下一个测试" : "Next Test")
          }
        />
      )}

      {phase === "completing" && (
        <div className="text-center py-20">
          <div className="text-lg text-muted-foreground">
            {isZh ? "正在生成测试报告..." : "Generating your report..."}
          </div>
        </div>
      )}
    </div>
  );
}
