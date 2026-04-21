"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Crown,
  UserPlus,
  FlaskConical,
  Swords,
  Bot,
  KeyRound,
  TrendingUp,
  ArrowRight,
  Gamepad2,
  Star,
  PercentCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  registeredToday: number;
  totalSessions: number;
  totalChallenges: number;
  totalPartners: number;
  unusedCodes: number;
}

interface Analytics {
  registrationTrend: Array<{ date: string; count: number }>;
  funnel: {
    totalUsers: number;
    usersWithTests: number;
    usersWithProfiles: number;
    premiumUsers: number;
  };
  dailyActivity: Array<{ date: string; tests: number; challenges: number }>;
}

interface ModelStat {
  modelId: string;
  count: number;
  avgRating: number;
  dist: number[];
}

const STAT_CARDS: Array<{
  key: keyof Stats;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href?: string;
}> = [
  { key: "totalUsers", label: "总用户 Users", icon: Users, color: "text-blue-500", href: "/admin/users" },
  { key: "premiumUsers", label: "付费 Premium", icon: Crown, color: "text-amber-500", href: "/admin/users" },
  { key: "registeredToday", label: "今日 Today", icon: UserPlus, color: "text-green-500" },
  { key: "totalSessions", label: "测试 Tests", icon: FlaskConical, color: "text-primary" },
  { key: "totalChallenges", label: "挑战 Challenges", icon: Swords, color: "text-red-500" },
  { key: "totalPartners", label: "伙伴 Partners", icon: Bot, color: "text-cyan-500" },
  { key: "unusedCodes", label: "激活码 Codes", icon: KeyRound, color: "text-orange-500", href: "/admin/codes" },
];

const FUNNEL_STEPS = [
  { key: "totalUsers", label: "注册 Registered", color: "bg-blue-500" },
  { key: "usersWithTests", label: "测试 Tested", color: "bg-primary" },
  { key: "usersWithProfiles", label: "档案 Profiled", color: "bg-green-500" },
  { key: "premiumUsers", label: "付费 Premium", color: "bg-amber-500" },
] as const;

interface EventCount {
  event: string;
  count: number;
  uniqueUsers: number;
}

interface GameFunnelRow {
  gameId: string;
  starts: number;
  completes: number;
  aborts: number;
  completionPct: number;
}

interface TierFunnelRow {
  tier: string;
  quizStarts: number;
  quizCompletes: number;
  completionPct: number;
}

interface CompletionFunnel {
  windowDays: number;
  perGame: GameFunnelRow[];
  perTier: TierFunnelRow[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [modelStats, setModelStats] = useState<ModelStat[]>([]);
  const [eventCounts, setEventCounts] = useState<EventCount[]>([]);
  const [funnel, setFunnel] = useState<CompletionFunnel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safeFetch = (url: string) =>
      fetch(url, { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({ success: false }));

    Promise.all([
      safeFetch("/api/admin/stats"),
      safeFetch("/api/admin/analytics"),
      safeFetch("/api/admin/chat-model-stats"),
      safeFetch("/api/analytics"),
      safeFetch("/api/admin/analytics/funnel"),
    ])
      .then(([statsData, analyticsData, modelData, eventsData, funnelData]) => {
        if (statsData.success) setStats(statsData.data);
        if (analyticsData.success) setAnalytics(analyticsData.data);
        if (modelData.success) setModelStats(modelData.data?.models || []);
        if (eventsData.success) setEventCounts(eventsData.data?.eventCounts || []);
        if (funnelData.success) setFunnel(funnelData.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      {/* Stats cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-muted/50 border border-foreground/5 p-4 h-24 animate-pulse"
            />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            const value = stats[card.key];
            const content = (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-4 h-4", card.color)} />
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <div className="text-2xl font-bold tabular-nums">{value}</div>
              </>
            );
            return card.href ? (
              <Link
                key={card.key}
                href={card.href}
                className="rounded-2xl bg-muted/30 border border-foreground/5 p-4 hover:bg-muted/50 transition-colors"
              >
                {content}
              </Link>
            ) : (
              <div
                key={card.key}
                className="rounded-2xl bg-muted/30 border border-foreground/5 p-4"
              >
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Failed to load stats</p>
      )}

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registration Trend */}
          <div className="rounded-2xl border border-foreground/5 bg-muted/10 p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">
                注册趋势 Registration (30d)
              </h2>
            </div>
            <BarChart
              data={analytics.registrationTrend}
              valueKey="count"
              color="bg-blue-500"
              height={120}
            />
          </div>

          {/* Conversion Funnel */}
          <div className="rounded-2xl border border-foreground/5 bg-muted/10 p-4">
            <h2 className="text-sm font-semibold mb-4">
              转化漏斗 Conversion Funnel
            </h2>
            <div className="space-y-3">
              {FUNNEL_STEPS.map((step, i) => {
                const value = analytics.funnel[step.key as keyof typeof analytics.funnel];
                const maxValue = analytics.funnel.totalUsers || 1;
                const pct = ((value / maxValue) * 100).toFixed(1);
                const prevValue =
                  i > 0
                    ? analytics.funnel[FUNNEL_STEPS[i - 1].key as keyof typeof analytics.funnel]
                    : null;
                const convRate =
                  prevValue && prevValue > 0
                    ? ((value / prevValue) * 100).toFixed(0)
                    : null;
                return (
                  <div key={step.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{step.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">{value}</span>
                        {convRate && (
                          <span className="text-xs text-muted-foreground">({convRate}%)</span>
                        )}
                      </div>
                    </div>
                    <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", step.color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Activity */}
          <div className="rounded-2xl border border-foreground/5 bg-muted/10 p-4 lg:col-span-2">
            <h2 className="text-sm font-semibold mb-3">
              每日活跃 Daily Activity (14d)
            </h2>
            <div className="flex gap-4 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                <span className="text-xs text-muted-foreground">Tests</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                <span className="text-xs text-muted-foreground">Challenges</span>
              </div>
            </div>
            <StackedBarChart data={analytics.dailyActivity} height={100} />
          </div>
        </div>
      )}

      {/* Custom Event Analytics */}
      {eventCounts.length > 0 && (
        <div className="rounded-2xl border border-foreground/5 bg-muted/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">事件追踪 Event Analytics (7d)</h2>
          </div>
          <div className="space-y-2">
            {eventCounts.map((e) => (
              <div key={e.event} className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground">{e.event}</span>
                <div className="flex items-center gap-3">
                  <span className="text-foreground font-medium">{e.count}x</span>
                  <span className="text-muted-foreground">{e.uniqueUsers} users</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Rate — per-game + per-tier funnel */}
      {funnel && (funnel.perGame.length > 0 || funnel.perTier.some((t) => t.quizStarts > 0)) && (
        <div className="rounded-2xl border border-foreground/5 bg-muted/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <PercentCircle className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">
              完成率 Completion Rate ({funnel.windowDays}d)
            </h2>
          </div>

          {/* Per-tier */}
          <div className="mb-5">
            <div className="text-xs text-muted-foreground mb-2">Per-tier</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left font-normal pb-1">Tier</th>
                    <th className="text-right font-normal pb-1">quiz_start</th>
                    <th className="text-right font-normal pb-1">quiz_complete</th>
                    <th className="text-right font-normal pb-1">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {funnel.perTier.map((t) => (
                    <tr key={t.tier} className="border-t border-foreground/5">
                      <td className="py-1.5 font-mono capitalize">{t.tier}</td>
                      <td className="py-1.5 text-right tabular-nums">{t.quizStarts}</td>
                      <td className="py-1.5 text-right tabular-nums">{t.quizCompletes}</td>
                      <td className="py-1.5 text-right tabular-nums font-medium">
                        {t.quizStarts > 0 ? `${t.completionPct.toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-game */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Per-game</div>
            {funnel.perGame.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                暂无数据 No game events yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left font-normal pb-1">Game</th>
                      <th className="text-right font-normal pb-1">Starts</th>
                      <th className="text-right font-normal pb-1">Completes</th>
                      <th className="text-right font-normal pb-1">Aborts</th>
                      <th className="text-right font-normal pb-1">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funnel.perGame.map((g) => (
                      <tr key={g.gameId} className="border-t border-foreground/5">
                        <td className="py-1.5 font-mono">{g.gameId}</td>
                        <td className="py-1.5 text-right tabular-nums">{g.starts}</td>
                        <td className="py-1.5 text-right tabular-nums">{g.completes}</td>
                        <td className="py-1.5 text-right tabular-nums text-red-400/80">
                          {g.aborts}
                        </td>
                        <td className="py-1.5 text-right tabular-nums font-medium">
                          {g.starts > 0 ? `${g.completionPct.toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Model Quality A/B Comparison */}
      {modelStats.length > 0 && (
        <div className="rounded-2xl border border-foreground/5 bg-muted/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold">AI 模型评分 Model Ratings</h2>
          </div>
          <div className="space-y-4">
            {modelStats.map((m) => {
              const shortModel = m.modelId.includes("/") ? m.modelId.split("/").pop()! : m.modelId;
              return (
                <div key={m.modelId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono text-muted-foreground truncate max-w-[60%]" title={m.modelId}>
                      {shortModel}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "w-3 h-3",
                              s <= Math.round(m.avgRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{m.avgRating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({m.count})</span>
                    </div>
                  </div>
                  {/* Rating distribution bar */}
                  <div className="flex gap-0.5 h-2">
                    {m.dist.map((cnt, i) => {
                      const pct = m.count > 0 ? (cnt / m.count) * 100 : 0;
                      const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-lime-400", "bg-green-400"];
                      return (
                        <div
                          key={i}
                          className={cn("rounded-full", colors[i])}
                          style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`, minWidth: cnt > 0 ? 4 : 0 }}
                          title={`${i+1}★: ${cnt}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink href="/admin/users" label="管理用户 Users" icon={Users} />
        <QuickLink href="/admin/games" label="管理游戏 Games" icon={Gamepad2} />
        <QuickLink href="/admin/codes" label="激活码 Codes" icon={KeyRound} />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-muted/30 border border-foreground/5 p-4 hover:bg-muted/50 transition-colors group"
    >
      <Icon className="w-5 h-5 text-muted-foreground" />
      <span className="text-sm flex-1">{label}</span>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}

/** Simple bar chart — pure CSS, no library */
function BarChart({
  data,
  valueKey,
  color,
  height,
}: {
  data: Array<Record<string, unknown>>;
  valueKey: string;
  color: string;
  height: number;
}) {
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-8">暂无数据 No data</p>;
  }

  const maxVal = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = (val / maxVal) * 100;
        const dateStr = String(d.date || "").slice(5);
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end"
            style={{ height: "100%" }}
            title={`${dateStr}: ${val}`}
          >
            <div
              className={cn("w-full rounded-t-sm", color)}
              style={{ height: `${Math.max(pct, 2)}%`, minHeight: 2 }}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Stacked bar chart for tests + challenges */
function StackedBarChart({
  data,
  height,
}: {
  data: Array<{ date: string; tests: number; challenges: number }>;
  height: number;
}) {
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-8">暂无数据 No data</p>;
  }

  const maxVal = Math.max(...data.map((d) => d.tests + d.challenges), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const total = d.tests + d.challenges;
        const totalPct = (total / maxVal) * 100;
        const testPct = total > 0 ? (d.tests / total) * 100 : 0;
        const dateStr = d.date?.toString().slice(5) || "";
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center"
            title={`${dateStr}: ${d.tests} tests, ${d.challenges} challenges`}
          >
            <div
              className="w-full rounded-t-sm overflow-hidden flex flex-col justify-end"
              style={{ height: `${Math.max(totalPct, 2)}%` }}
            >
              {d.challenges > 0 && (
                <div className="w-full bg-red-500" style={{ height: `${100 - testPct}%`, minHeight: 2 }} />
              )}
              {d.tests > 0 && (
                <div className="w-full bg-primary" style={{ height: `${testPct}%`, minHeight: 2 }} />
              )}
            </div>
            {i % 2 === 0 && (
              <span className="text-[9px] text-muted-foreground mt-1 tabular-nums">{dateStr}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
