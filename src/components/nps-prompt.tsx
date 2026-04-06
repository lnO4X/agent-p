"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

interface NpsPromptProps {
  context: string; // "quiz_complete" | "first_chat" | etc.
  isZh: boolean;
  delay?: number; // ms before showing (default 2000)
}

const STORAGE_KEY = "gametan-nps-dismissed";

export function NpsPrompt({ context, isZh, delay = 2000 }: NpsPromptProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Don't show if already dismissed today
    const last = localStorage.getItem(STORAGE_KEY);
    if (last) {
      const lastDate = new Date(last).toDateString();
      if (lastDate === new Date().toDateString()) return;
    }
    setDismissed(false);
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (dismissed || !visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setVisible(false);
  };

  const submit = async () => {
    if (!score) return;
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment: comment || undefined, context }),
      });
      setSubmitted(true);
      setTimeout(dismiss, 1500);
    } catch {
      dismiss();
    }
  };

  if (submitted) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl shadow-xl px-5 py-4 max-w-xs text-center animate-fade-up">
        <p className="text-sm font-medium">
          {t("nps.thanks")}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl shadow-xl px-5 py-4 max-w-sm w-[90vw] animate-fade-up">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50"
      >
        <X size={14} className="text-muted-foreground" />
      </button>

      <p className="text-sm font-medium mb-3 pr-4">
        {t("nps.question")}
      </p>

      {/* Score buttons 1-10 */}
      <div className="flex gap-1 mb-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setScore(n)}
            className={cn(
              "flex-1 h-8 rounded-lg text-xs font-medium transition-all",
              score === n
                ? n <= 6
                  ? "bg-red-500 text-white"
                  : n <= 8
                    ? "bg-yellow-500 text-white"
                    : "bg-green-500 text-white"
                : "bg-muted/50 hover:bg-muted text-muted-foreground"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
        <span>{t("nps.notLikely")}</span>
        <span>{t("nps.veryLikely")}</span>
      </div>

      {/* Comment (shows after score selected) */}
      {score !== null && (
        <div className="space-y-2 animate-fade-up">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("nps.placeholder")}
            className="w-full h-16 text-xs bg-muted/30 border border-border rounded-xl p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            maxLength={500}
          />
          <button
            onClick={submit}
            className="w-full py-2 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            {t("nps.submit")}
          </button>
        </div>
      )}
    </div>
  );
}
