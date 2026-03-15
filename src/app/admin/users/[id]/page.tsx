"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Shield,
  FlaskConical,
  Bot,
  Swords,
  KeyRound,
  Brain,
  Calendar,
  Mail,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserDetail {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  emailVerifiedAt: string | null;
  isProfilePublic: boolean;
  isAdmin: boolean;
  tier: "free" | "premium";
  tierExpiresAt: string | null;
  referralCode: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

interface TalentProfile {
  id: string;
  overallScore: number | null;
  overallRank: string | null;
  archetypeId: string | null;
  reactionSpeed: number | null;
  handEyeCoord: number | null;
  spatialAwareness: number | null;
  memory: number | null;
  strategyLogic: number | null;
  rhythmSense: number | null;
  patternRecog: number | null;
  multitasking: number | null;
  decisionSpeed: number | null;
  emotionalControl: number | null;
  teamworkTendency: number | null;
  riskAssessment: number | null;
  resourceMgmt: number | null;
  createdAt: string;
}

interface PartnerInfo {
  id: string;
  slot: number;
  name: string;
  avatar: string;
  memory: string;
  definition: string;
  createdAt: string;
}

interface Challenge {
  id: string;
  gameId: string;
  talentCategory: string;
  score: number;
  completedAt: string;
}

interface CodeUsed {
  id: string;
  code: string;
  durationDays: number;
  usedAt: string | null;
}

interface KnowledgeEntry {
  id: string;
  category: string;
  key: string;
  value: string;
  confidence: number;
  updatedAt: string;
}

const TALENT_LABELS: Record<string, string> = {
  reactionSpeed: "反应速度 Reaction",
  handEyeCoord: "手眼协调 Coordination",
  spatialAwareness: "空间感知 Spatial",
  memory: "记忆力 Memory",
  strategyLogic: "策略逻辑 Strategy",
  rhythmSense: "节奏感 Rhythm",
  patternRecog: "模式识别 Pattern",
  multitasking: "多线程 Multitask",
  decisionSpeed: "决策速度 Decision",
  emotionalControl: "情绪控制 Emotion",
  teamworkTendency: "团队倾向 Teamwork",
  riskAssessment: "风险评估 Risk",
  resourceMgmt: "资源管理 Resource",
};

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [partnersList, setPartnersList] = useState<PartnerInfo[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [codesUsed, setCodesUsed] = useState<CodeUsed[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.data.user);
          setSessions(data.data.sessions);
          setProfile(data.data.talentProfile);
          setPartnersList(data.data.partners);
          setChallenges(data.data.challenges);
          setCodesUsed(data.data.codesUsed);
          setKnowledge(data.data.knowledge);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const toggleTier = async () => {
    if (!user) return;
    const newTier = user.tier === "premium" ? "free" : "premium";
    await fetch("/api/admin/users", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, tier: newTier }),
    });
    setUser({ ...user, tier: newTier });
  };

  const toggleAdmin = async () => {
    if (!user) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, isAdmin: !user.isAdmin }),
    });
    setUser({ ...user, isAdmin: !user.isAdmin });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-muted/50 rounded animate-pulse w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        User not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{user.username}</h1>
            {user.isAdmin && <Shield className="w-4 h-4 text-primary" />}
            {user.tier === "premium" && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                <Crown className="w-3 h-3" />
                Premium
              </span>
            )}
          </div>
          {user.displayName && (
            <p className="text-sm text-muted-foreground">{user.displayName}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTier}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg transition-colors",
              user.tier === "premium"
                ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {user.tier === "premium" ? "Downgrade" : "Upgrade"}
          </button>
          <button
            type="button"
            onClick={toggleAdmin}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg transition-colors",
              user.isAdmin
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {user.isAdmin ? "Admin ✓" : "Admin"}
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard icon={Mail} label="Email" value={user.email || "—"} />
        <InfoCard
          icon={Calendar}
          label="注册 Joined"
          value={new Date(user.createdAt).toLocaleDateString()}
        />
        <InfoCard
          icon={Crown}
          label="Premium 到期"
          value={user.tierExpiresAt ? new Date(user.tierExpiresAt).toLocaleDateString() : "—"}
        />
        <InfoCard
          icon={User}
          label="Profile"
          value={user.isProfilePublic ? "公开 Public" : "私密 Private"}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Talent Profile */}
        <Section title="天赋档案 Talent Profile" icon={Brain} count={profile ? 1 : 0}>
          {profile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl font-bold tabular-nums">
                  {profile.overallScore?.toFixed(0) ?? "—"}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Rank: <span className="font-medium text-foreground">{profile.overallRank ?? "—"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Archetype: <span className="font-medium text-foreground">{profile.archetypeId ?? "—"}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                {Object.entries(TALENT_LABELS).map(([key, label]) => {
                  const value = profile[key as keyof TalentProfile] as number | null;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-32 flex-shrink-0 truncate">
                        {label}
                      </span>
                      <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${value ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums w-8 text-right">
                        {value?.toFixed(0) ?? "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">尚未完成测试 No test completed</p>
          )}
        </Section>

        {/* Test Sessions */}
        <Section title="测试记录 Test Sessions" icon={FlaskConical} count={sessions.length}>
          {sessions.length > 0 ? (
            <div className="space-y-1.5">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-sm py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        s.status === "completed"
                          ? "bg-green-500/10 text-green-600"
                          : s.status === "in_progress"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {s.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.startedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">暂无记录 No sessions</p>
          )}
        </Section>

        {/* Partners */}
        <Section title="AI 伙伴 Partners" icon={Bot} count={partnersList.length}>
          {partnersList.length > 0 ? (
            <div className="space-y-2">
              {partnersList.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl bg-muted/20 border border-foreground/5 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Slot {p.slot}
                      </span>
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {p.definition && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {p.definition.slice(0, 120)}
                      {p.definition.length > 120 ? "…" : ""}
                    </p>
                  )}
                  {p.memory && (
                    <p className="text-xs text-primary/70 mt-1">
                      💾 Memory: {p.memory.slice(0, 80)}
                      {p.memory.length > 80 ? "…" : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">暂无伙伴 No partners</p>
          )}
        </Section>

        {/* Challenges */}
        <Section title="每日挑战 Challenges" icon={Swords} count={challenges.length}>
          {challenges.length > 0 ? (
            <div className="space-y-1.5">
              {challenges.slice(0, 15).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 truncate">
                      {c.talentCategory.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-medium tabular-nums">
                      {c.score.toFixed(0)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.completedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {challenges.length > 15 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{challenges.length - 15} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">暂无挑战 No challenges</p>
          )}
        </Section>

        {/* Codes Used */}
        <Section title="激活码 Codes Used" icon={KeyRound} count={codesUsed.length}>
          {codesUsed.length > 0 ? (
            <div className="space-y-1.5">
              {codesUsed.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                    {c.code}
                  </code>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{c.durationDays}d</span>
                    <span>{c.usedAt ? new Date(c.usedAt).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">未使用激活码 No codes</p>
          )}
        </Section>

        {/* Knowledge Graph */}
        <Section title="知识图谱 Knowledge" icon={Brain} count={knowledge.length}>
          {knowledge.length > 0 ? (
            <div className="space-y-1.5">
              {knowledge.slice(0, 15).map((k) => (
                <div
                  key={k.id}
                  className="flex items-center gap-2 text-xs py-0.5"
                >
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded flex-shrink-0",
                      k.category === "preference"
                        ? "bg-blue-500/10 text-blue-600"
                        : k.category === "skill"
                          ? "bg-green-500/10 text-green-600"
                          : k.category === "behavior"
                            ? "bg-purple-500/10 text-purple-600"
                            : "bg-muted text-muted-foreground"
                    )}
                  >
                    {k.category}
                  </span>
                  <span className="text-muted-foreground">{k.key}:</span>
                  <span className="font-medium truncate">{k.value}</span>
                  <span className="text-muted-foreground ml-auto flex-shrink-0">
                    {(k.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              {knowledge.length > 15 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{knowledge.length - 15} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">暂无数据 No entries</p>
          )}
        </Section>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/30 border border-foreground/5 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-foreground/5 bg-muted/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold flex-1">{title}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}
