"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { trackGameEvent } from "@/lib/analytics";
import { getGameQuiz, getAllGameQuizzes } from "@/lib/game-quizzes";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Gamepad2 } from "lucide-react";

export default function GameQuizIntroPage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const { locale, t } = useI18n();
  const isZh = locale === "zh";

  const gameId = params.gameId;
  const quiz = getGameQuiz(gameId);

  // Not found
  if (!quiz) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t("quiz.gameQuizNotFound")}
          </p>
          <Link href="/quiz">
            <Button>{t("quiz.backToQuiz")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const allQuizzes = getAllGameQuizzes().filter((q) => q.id !== gameId);
  const sampleCharacters = quiz.characters.slice(0, 6);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Hero section with game gradient */}
        <div
          className="rounded-2xl p-6 text-center space-y-3"
          style={{
            background: `linear-gradient(135deg, ${quiz.gradient[0]}22, ${quiz.gradient[1]}22)`,
          }}
        >
          <div className="text-5xl md:text-6xl mb-2">{quiz.icon}</div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {t("quiz.whichCharacterAreYou", { game: isZh ? quiz.gameName : quiz.gameNameEn })}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {isZh ? quiz.description : quiz.descriptionEn}
          </p>
        </div>

        {/* Character preview grid */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
            <Gamepad2 size={12} />
            {t("quiz.possibleResults")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sampleCharacters.map((char) => (
              <div
                key={char.id}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: char.color }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {isZh ? char.name : char.nameEn}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {isZh ? char.title : char.titleEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start quiz button — redirects to main talent test */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-14 text-lg bg-accent hover:bg-accent/90 text-accent-foreground pressable"
            onClick={() => {
              trackGameEvent("quiz_start", { mode: "game", gameId });
              router.push("/quiz");
            }}
          >
            <Gamepad2 size={20} className="mr-2" />
            {t("quiz.testYourTalent")}
            <ArrowRight size={20} className="ml-2" />
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t("quiz.threeGamesSubtitle")}
          </p>
        </div>

        {/* Back to general quiz */}
        <div className="text-center">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground pressable"
          >
            <ArrowLeft size={14} />
            {t("quiz.generalQuiz")}
          </Link>
        </div>

        {/* Other game quizzes */}
        {allQuizzes.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs text-muted-foreground text-center">
              {t("quiz.tryOtherQuizzes")}
            </div>
            <div className="flex justify-center gap-3">
              {allQuizzes.map((q) => (
                <Link
                  key={q.id}
                  href={`/quiz/${q.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors pressable"
                >
                  <span className="text-lg">{q.icon}</span>
                  <span className="text-sm font-medium">
                    {isZh ? q.gameName : q.gameNameEn}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
