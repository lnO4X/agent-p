"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

interface MemoryBannerProps {
  memory: string;
  partnerName: string;
}

export function MemoryBanner({ memory, partnerName }: MemoryBannerProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

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
        </div>
      )}
    </div>
  );
}
