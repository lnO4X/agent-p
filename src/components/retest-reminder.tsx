"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import { Clock, Calendar, TrendingUp, FlaskConical, ArrowRight } from "lucide-react";

interface Session {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

type RetestState =
  | { kind: "none" }
  | { kind: "recent"; daysSince: number }
  | { kind: "thirty"; daysSince: number }
  | { kind: "ninety"; daysSince: number }
  | { kind: "sixMonth"; daysSince: number };

function computeState(sessions: Session[]): RetestState {
  const completed = sessions
    .filter((s) => s.status === "completed" && s.completedAt)
    .sort(
      (a, b) =>
        new Date(b.completedAt as string).getTime() -
        new Date(a.completedAt as string).getTime()
    );

  if (completed.length === 0) return { kind: "none" };

  const last = new Date(completed[0].completedAt as string);
  const daysSince = Math.floor(
    (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince >= 180) return { kind: "sixMonth", daysSince };
  if (daysSince >= 90) return { kind: "ninety", daysSince };
  if (daysSince >= 30) return { kind: "thirty", daysSince };
  return { kind: "recent", daysSince };
}

interface CopySet {
  icon: typeof Clock;
  title: string;
  body: string;
  cta: string;
  emphasis: "gold" | "teal" | "muted";
}

function copyForState(state: RetestState, isZh: boolean): CopySet {
  switch (state.kind) {
    case "none":
      return {
        icon: FlaskConical,
        title: isZh ? "开始你的首次测试" : "Take your first assessment",
        body: isZh
          ? "3 款认知小游戏，10 分钟完成。建立你的基线，之后才能追踪进步。"
          : "3 cognitive mini-games, ~10 minutes. Establish a baseline so you can track change.",
        cta: isZh ? "开始测试" : "Start assessment",
        emphasis: "gold",
      };
    case "recent":
      return {
        icon: Clock,
        title: isZh
          ? `上次测试：${state.daysSince} 天前`
          : `Last tested ${state.daysSince} day${state.daysSince === 1 ? "" : "s"} ago`,
        body: isZh
          ? "建议在 30 / 90 / 180 天节点重测，以追踪认知变化。过早重测会被练习效应污染。"
          : "Retest recommended at 30 / 90 / 180 days to track progress. Earlier retests are confounded by practice effect.",
        cta: isZh ? "查看历史" : "View history",
        emphasis: "muted",
      };
    case "thirty":
      return {
        icon: Calendar,
        title: isZh
          ? "30 天重测已可进行"
          : "30-day retest available",
        body: isZh
          ? `距上次测试 ${state.daysSince} 天。重测后可与基线对比，看认知图谱变化。`
          : `${state.daysSince} days since last test. Compare your cognitive profile to your baseline.`,
        cta: isZh ? "重测" : "Retest now",
        emphasis: "teal",
      };
    case "ninety":
      return {
        icon: TrendingUp,
        title: isZh ? "季度重测已就绪" : "Quarterly retest ready",
        body: isZh
          ? `距上次测试 ${state.daysSince} 天。90 天窗口足以显示真实能力变化。`
          : `${state.daysSince} days since last test. A 90-day window is enough to surface real ability change.`,
        cta: isZh ? "立即重测" : "Retest now",
        emphasis: "gold",
      };
    case "sixMonth":
      return {
        icon: TrendingUp,
        title: isZh ? "6 个月重测时间到" : "Time for a 6-month retest",
        body: isZh
          ? `距上次测试 ${state.daysSince} 天。追踪长期认知变化，看训练是否见效。`
          : `${state.daysSince} days since last test. Track long-term cognitive change and see whether training is paying off.`,
        cta: isZh ? "重测并对比" : "Retest and compare",
        emphasis: "gold",
      };
  }
}

export function RetestReminder() {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res?.success && Array.isArray(res.data)) {
          setSessions(res.data as Session[]);
        } else {
          setSessions([]);
        }
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!sessions) return null;

  const state = computeState(sessions);
  const copy = copyForState(state, isZh);
  const Icon = copy.icon;

  // CTA destination: take test if none/thirty/ninety/sixMonth, else history view
  const href = state.kind === "recent" ? "/me/history" : "/quiz";

  // Visual emphasis: gold for primary retest moment, teal for soft, muted for info
  const bgClass =
    copy.emphasis === "gold"
      ? "bg-accent/5 ring-1 ring-accent/30"
      : copy.emphasis === "teal"
        ? "bg-primary/5 ring-1 ring-primary/20"
        : "";

  const iconColor =
    copy.emphasis === "gold"
      ? "text-accent"
      : copy.emphasis === "teal"
        ? "text-primary"
        : "text-muted-foreground";

  const ctaClass =
    copy.emphasis === "gold"
      ? "bg-accent text-accent-foreground"
      : copy.emphasis === "teal"
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-foreground";

  return (
    <Card className={bgClass}>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              copy.emphasis === "gold"
                ? "bg-accent/15"
                : copy.emphasis === "teal"
                  ? "bg-primary/10"
                  : "bg-muted"
            }`}
          >
            <Icon size={18} className={iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold leading-snug">
              {copy.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {copy.body}
            </p>
          </div>
        </div>
        <Link
          href={href}
          className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-medium pressable ${ctaClass}`}
        >
          {copy.cta}
          <ArrowRight size={14} />
        </Link>
      </CardContent>
    </Card>
  );
}
