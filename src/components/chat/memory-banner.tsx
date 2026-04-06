"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import { Lightbulb, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface MemoryBannerProps {
  memory: string;
  partnerName: string;
  partnerId?: string;
  onMemoryCleared?: () => void;
}

export function MemoryBanner({ memory, partnerName, partnerId, onMemoryCleared }: MemoryBannerProps) {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const [expanded, setExpanded] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const lines = memory
    .split("\n")
    .filter((line) => line.trim().startsWith("- "))
    .map((line) => line.trim().replace(/^-\s*/, ""));

  if (lines.length === 0) return null;

  return (
    <div
      className={cn(
        "mx-4 mt-2 rounded-xl border",
        "bg-primary/5 border-primary/10"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <Lightbulb className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span className="text-xs font-medium text-primary flex-1 truncate">
          {partnerName} {t("partners.memoryTitle")}
        </span>
        <span className="text-[10px] text-primary/70">
          {t("partners.memoryCount", { count: lines.length })}
        </span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-primary/50" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-primary/50" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-2.5 space-y-1">
          {lines.map((line, i) => (
            <p key={i} className="text-xs text-foreground/80 pl-5 relative">
              <span className="absolute left-1.5 top-[5px] w-1 h-1 rounded-full bg-primary/40" />
              {line}
            </p>
          ))}
          {partnerId && (
            <div className="pt-2 flex justify-end">
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-destructive">
                    {t("chat.memory.clearConfirm")}
                  </span>
                  <button
                    type="button"
                    disabled={clearing}
                    onClick={async () => {
                      setClearing(true);
                      try {
                        const res = await fetch(`/api/partners/${partnerId}/memory`, { method: "DELETE" });
                        if (res.ok) {
                          onMemoryCleared?.();
                        }
                      } finally {
                        setClearing(false);
                        setConfirmClear(false);
                      }
                    }}
                    className="text-[10px] text-destructive font-medium hover:underline pressable"
                  >
                    {clearing
                      ? t("chat.memory.clearing")
                      : t("common.confirm")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="text-[10px] text-muted-foreground hover:underline"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors pressable"
                >
                  <Trash2 className="w-3 h-3" />
                  {t("chat.memory.clear")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
