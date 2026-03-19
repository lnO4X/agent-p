"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { getShuffledQuestions, answersToScores } from "@/lib/questionnaire";
import { scoreToArchetype } from "@/lib/archetype";

const LIKERT_LABELS_ZH = ["非常不同意", "不同意", "一般", "同意", "非常同意"];
const LIKERT_LABELS_EN = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

export default function QuestionnairePage() {
  const router = useRouter();
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const questions = useMemo(() => getShuffledQuestions(), []);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = questions.length;
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / total) * 100);
  const q = questions[currentIndex];

  const likertLabels = isZh ? LIKERT_LABELS_ZH : LIKERT_LABELS_EN;

  const handleAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    // Auto-advance after 300ms
    if (currentIndex < total - 1) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 300);
    }
  };

  const handleSubmit = () => {
    const scores = answersToScores(answers);
    const archetype = scoreToArchetype(scores);

    // Encode all 13 talent scores into URL for result page
    const scoreStr = Object.entries(scores)
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
    router.push(`/quiz/result?mode=q&archetype=${archetype.id}&scores=${scoreStr}`);
  };

  const canSubmit = answered >= total;

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/quiz"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground pressable"
        >
          <ArrowLeft className="w-4 h-4" />
          {isZh ? "返回" : "Back"}
        </Link>
        <span className="text-xs text-muted-foreground">
          {answered}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center space-y-8">
        <div className="space-y-2 text-center">
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {total}
          </span>
          <h2 className="text-lg font-semibold leading-relaxed">
            {isZh ? q.zh : q.en}
          </h2>
        </div>

        {/* Likert scale */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((value) => {
            const isSelected = answers[q.id] === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleAnswer(value)}
                className={`pressable w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
                <span className="text-sm">{likertLabels[value - 1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          className="pressable"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {isZh ? "上一题" : "Prev"}
        </Button>

        {/* Quick nav dots */}
        <div className="flex gap-0.5 overflow-x-auto max-w-[200px]">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                answers[questions[i].id] != null
                  ? i === currentIndex
                    ? "bg-primary"
                    : "bg-primary/40"
                  : i === currentIndex
                    ? "bg-foreground"
                    : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {currentIndex < total - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
            className="pressable"
          >
            {isZh ? "下一题" : "Next"}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="pressable"
          >
            {isZh ? "查看结果" : "See Results"}
          </Button>
        )}
      </div>
    </div>
  );
}
