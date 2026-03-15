"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import { getPartnerIcon } from "./partner-icons";
import { ChevronRight } from "lucide-react";

interface PartnerCardProps {
  id: string;
  name: string;
  avatar: string;
  definition: string;
  memory: string;
  onClick: () => void;
}

function countMemoryItems(memory: string): number {
  if (!memory.trim()) return 0;
  return memory
    .split("\n")
    .filter((line) => line.trim().startsWith("- ")).length;
}

function getStatusLine(memory: string, t: (key: string) => string): string {
  const lines = memory
    .split("\n")
    .filter((line) => line.trim().startsWith("- "))
    .map((line) => line.trim().replace(/^-\s*/, ""));

  if (lines.length === 0) return t("partners.noMemory");
  // Show the last memory item as preview
  return lines[lines.length - 1];
}

export function PartnerCard({
  name,
  avatar,
  definition,
  memory,
  onClick,
}: PartnerCardProps) {
  const { t } = useI18n();
  const Icon = getPartnerIcon(avatar);
  const memoryCount = countMemoryItems(memory);
  const statusLine = getStatusLine(memory, t);
  const subtitle = definition.split("\n").find((line) => line.trim() && !line.startsWith("#"))?.trim() || "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-2xl",
        "bg-card ring-1 ring-foreground/10",
        "pressable text-left",
        "hover:border-primary/30 transition-colors"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{name}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {subtitle}
        </p>
        <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
          {statusLine}
        </p>
      </div>

      {/* Right side: memory badge + chevron */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {memoryCount > 0 && (
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
            {memoryCount}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
      </div>
    </button>
  );
}
