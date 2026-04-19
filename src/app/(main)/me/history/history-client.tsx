"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import { ARCHETYPES } from "@/lib/archetype";
import { FlaskConical, ChevronRight } from "lucide-react";
import { CompareView, type HistoryEntry } from "./compare-view";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(
    locale === "en" ? "en-US" : locale === "zh" ? "zh-CN" : locale,
    { year: "numeric", month: "short", day: "numeric" }
  );
}

interface HistoryListItemProps {
  entry: HistoryEntry;
  index: number;
  total: number;
  selected: boolean;
  selectable: boolean;
  onToggle: (id: string) => void;
  locale: string;
  isZh: boolean;
}

function HistoryListItem({
  entry,
  index,
  total,
  selected,
  selectable,
  onToggle,
  locale,
  isZh,
}: HistoryListItemProps) {
  const archetype = entry.archetypeId ? ARCHETYPES[entry.archetypeId] : null;
  const isLatest = index === 0;
  const isBaseline = index === total - 1;

  return (
    <button
      type="button"
      onClick={() => onToggle(entry.sessionId)}
      disabled={!selected && !selectable}
      className={`w-full text-left rounded-xl px-3 py-3 transition-colors ring-1 ${
        selected
          ? "bg-primary/10 ring-primary/40"
          : selectable
            ? "bg-card ring-foreground/10 hover:bg-muted/50"
            : "bg-card/50 ring-foreground/5 opacity-50 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center ${
            selected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/40"
          }`}
        >
          {selected && <span className="text-[10px] font-bold">✓</span>}
        </div>
        {archetype ? (
          <div className="text-2xl shrink-0">{archetype.icon}</div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">
              {archetype
                ? isZh
                  ? archetype.name
                  : archetype.nameEn
                : isZh
                  ? "未分型"
                  : "Unclassified"}
            </span>
            {isLatest && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium">
                {isZh ? "最新" : "Latest"}
              </span>
            )}
            {isBaseline && total > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                {isZh ? "基线" : "Baseline"}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span>{formatDate(entry.date, locale)}</span>
            {entry.overallRank && (
              <>
                <span>·</span>
                <span className="font-mono">
                  {entry.overallRank}{" "}
                  {typeof entry.overallScore === "number"
                    ? Math.round(entry.overallScore)
                    : "—"}
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronRight size={14} className="text-muted-foreground shrink-0" />
      </div>
    </button>
  );
}

export function HistoryClient() {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/talent-history")
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res?.success && res.data?.history) {
          // API returns chronological asc; reverse so newest first for the list UI.
          const rev = [...(res.data.history as HistoryEntry[])].reverse();
          setHistory(rev);
        } else {
          setHistory([]);
          if (res?.error?.message) setError(res.error.message);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistory([]);
          setError(isZh ? "加载失败" : "Failed to load");
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  // Sort selected entries chronologically (baseline first, current last).
  const selectedEntries = useMemo(() => {
    if (!history) return [];
    return history
      .filter((e) => selected.includes(e.sessionId))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [history, selected]);

  if (history === null) {
    return (
      <div className="max-w-lg mx-auto space-y-3 animate-pulse">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
      </div>
    );
  }

  if (compareMode && selectedEntries.length === 2) {
    return (
      <div className="max-w-lg mx-auto">
        <CompareView
          entries={selectedEntries as [HistoryEntry, HistoryEntry]}
          onBack={() => {
            setCompareMode(false);
            setSelected([]);
          }}
          isZh={isZh}
          locale={locale}
          t={t}
        />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Card className="bg-accent/5 ring-1 ring-accent/30">
          <CardContent className="py-8 text-center space-y-3">
            <FlaskConical size={36} className="text-accent mx-auto" />
            <h1 className="text-lg font-bold">
              {isZh ? "尚无测试记录" : "No tests yet"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isZh
                ? "完成第一次测试以开始追踪认知变化。"
                : "Complete your first assessment to start tracking cognitive change."}
            </p>
            <Link
              href="/quiz"
              className="inline-block px-6 py-2 bg-accent text-accent-foreground rounded-xl text-sm font-medium pressable"
            >
              {isZh ? "开始测试" : "Start assessment"}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-bold">
          {isZh ? "测试历史" : "Test History"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {history.length < 2
            ? isZh
              ? "至少需要 2 次测试才能对比。再测一次，查看你的变化。"
              : "Need 2+ tests to compare. Take another to see your change."
            : isZh
              ? `选择 2 次测试进行对比（${selected.length}/2 已选）`
              : `Select 2 tests to compare (${selected.length}/2 selected)`}
        </p>
      </div>

      {error && (
        <Card className="bg-red-500/5 ring-1 ring-red-500/20">
          <CardContent className="py-3">
            <p className="text-xs text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {history.length < 2 && (
        <Card className="bg-primary/5 ring-1 ring-primary/20">
          <CardContent className="py-5 text-center space-y-2">
            <p className="text-sm font-medium">
              {isZh
                ? "再测一次，查看认知变化"
                : "Take another test to see change"}
            </p>
            <Link
              href="/quiz"
              className="inline-block px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium pressable"
            >
              {isZh ? "再测一次" : "Retest now"}
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {history.map((entry, i) => (
          <HistoryListItem
            key={entry.sessionId}
            entry={entry}
            index={i}
            total={history.length}
            selected={selected.includes(entry.sessionId)}
            selectable={
              selected.length < 2 || selected.includes(entry.sessionId)
            }
            onToggle={toggle}
            locale={locale}
            isZh={isZh}
          />
        ))}
      </div>

      {history.length >= 2 && (
        <div className="sticky bottom-20 pb-2">
          <button
            type="button"
            disabled={selected.length !== 2}
            onClick={() => setCompareMode(true)}
            className="w-full py-3 rounded-xl text-sm font-semibold pressable bg-accent text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isZh
              ? `对比选中的 ${selected.length} 次测试`
              : `Compare ${selected.length} selected test${selected.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}
    </div>
  );
}
