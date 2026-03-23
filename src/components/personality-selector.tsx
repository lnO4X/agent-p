"use client";

import { useState, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { getAllPersonalityTypes, type PersonalityType } from "@/lib/personality-types";

interface PersonalitySelectorProps {
  /** Currently selected personality type code (e.g. "INTJ"), or null */
  value?: string | null;
  /** Called after successful save to DB */
  onSelect?: (code: string) => void;
  /** If true, saves to /api/auth/personality on click */
  autoSave?: boolean;
}

export function PersonalitySelector({
  value,
  onSelect,
  autoSave = true,
}: PersonalitySelectorProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [selected, setSelected] = useState<string | null>(value ?? null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const types = getAllPersonalityTypes();

  const handleSelect = useCallback(
    async (type: PersonalityType) => {
      setError("");

      if (autoSave) {
        setSaving(type.code);
        try {
          const res = await fetch("/api/auth/personality", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ personalityType: type.code }),
          });
          const json = await res.json();
          if (!json.success) {
            setError(
              isZh
                ? "保存失败，请重试"
                : "Failed to save, please try again"
            );
            setSaving(null);
            return;
          }
        } catch {
          setError(
            isZh ? "网络错误，请重试" : "Network error, please try again"
          );
          setSaving(null);
          return;
        }
        setSaving(null);
      }

      setSelected(type.code);
      onSelect?.(type.code);
    },
    [autoSave, isZh, onSelect]
  );

  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">
          {isZh ? "选择你的性格类型" : "Choose Your Personality Type"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isZh
            ? "玩家性格分析 · 16种性格类型"
            : "Player Personality Profile · 16 Types"}
        </p>
      </div>

      {/* Grid: 4-col desktop, 2-col mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {types.map((type) => {
          const isSelected = selected === type.code;
          const isSaving = saving === type.code;

          return (
            <button
              key={type.code}
              onClick={() => handleSelect(type)}
              disabled={!!saving}
              className={`
                pressable relative flex flex-col items-start gap-1
                rounded-xl border p-3 text-left transition-all
                ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-accent/50"
                }
                ${saving && !isSaving ? "opacity-50" : ""}
              `}
            >
              {/* Top row: emoji + code */}
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-lg">{type.emoji}</span>
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  {type.code}
                </span>
                {isSelected && !isSaving && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
                {isSaving && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />
                )}
              </div>

              {/* Name */}
              <div className="text-sm font-medium leading-tight">
                {isZh ? type.name : type.nameEn}
              </div>

              {/* 1-line gaming description */}
              <div className="text-xs text-muted-foreground leading-snug line-clamp-2">
                {isZh ? type.gaming : type.gamingEn}
              </div>
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
