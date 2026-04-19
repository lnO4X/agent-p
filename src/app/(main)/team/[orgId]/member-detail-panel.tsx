"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { TALENT_LABELS } from "@/lib/constants";
import { TALENT_CATEGORIES, type TalentCategory } from "@/types/talent";
import { getTopRoleFits } from "@/lib/role-cognitive-fit";

// Lazy-load the heavy Recharts radar (reused from existing component).
const TalentRadar = dynamic(
  () =>
    import("@/components/charts/talent-radar").then((m) => ({
      default: m.TalentRadar,
    })),
  { ssr: false, loading: () => <div className="h-80" /> }
);

interface ProfileDetail {
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
  overallScore: number | null;
  overallRank: string | null;
  archetypeId: string | null;
  createdAt: string;
}

interface MemberDetailResponse {
  member: {
    memberId: string;
    userId: string;
    role: "admin" | "coach" | "player";
    displayName: string | null;
    notes: string | null;
    addedAt: string;
  };
  profile: ProfileDetail | null;
  viewerRole: "admin" | "coach" | "player";
}

interface Props {
  orgId: string;
  userId: string;
  viewerRole: "admin" | "coach" | "player";
  onChanged: () => void | Promise<void>;
}

/** DB column name (camelCase) → snake_case TalentCategory */
const PROFILE_KEY_TO_CAT: Array<[keyof ProfileDetail, TalentCategory]> = [
  ["reactionSpeed", "reaction_speed"],
  ["handEyeCoord", "hand_eye_coord"],
  ["spatialAwareness", "spatial_awareness"],
  ["memory", "memory"],
  ["strategyLogic", "strategy_logic"],
  ["rhythmSense", "rhythm_sense"],
  ["patternRecog", "pattern_recog"],
  ["multitasking", "multitasking"],
  ["decisionSpeed", "decision_speed"],
  ["emotionalControl", "emotional_control"],
  ["teamworkTendency", "teamwork_tendency"],
  ["riskAssessment", "risk_assessment"],
  ["resourceMgmt", "resource_mgmt"],
];

function profileToScores(
  profile: ProfileDetail
): Record<TalentCategory, number> {
  const scores = {} as Record<TalentCategory, number>;
  for (const [key, cat] of PROFILE_KEY_TO_CAT) {
    const v = profile[key] as number | null;
    scores[cat] = v == null ? 50 : v;
  }
  return scores;
}

export function MemberDetailPanel({
  orgId,
  userId,
  viewerRole,
  onChanged,
}: Props) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const canEditNotes = viewerRole === "admin" || viewerRole === "coach";

  const [data, setData] = useState<MemberDetailResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/team/${orgId}/members/${userId}`);
        const json = await res.json();
        if (cancelled) return;
        if (!json.success) {
          setErr(typeof json.error === "string" ? json.error : "Failed");
          return;
        }
        setData(json.data);
        setNotes(json.data.member.notes ?? "");
      } catch (e: unknown) {
        if (!cancelled)
          setErr(e instanceof Error ? e.message : "Network error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, userId]);

  const scores = useMemo<Record<TalentCategory, number> | null>(() => {
    if (!data?.profile) return null;
    return profileToScores(data.profile);
  }, [data]);

  const topRoles = useMemo(() => {
    if (!scores) return [];
    return getTopRoleFits(
      {
        scores,
        overallScore: data?.profile?.overallScore ?? 0,
        overallRank: (data?.profile?.overallRank ?? "C") as
          | "S"
          | "A"
          | "B"
          | "C"
          | "D",
      },
      3
    );
  }, [scores, data]);

  const topStrengths = useMemo(() => {
    if (!scores) return [];
    return TALENT_CATEGORIES.map((cat) => ({
      cat,
      score: scores[cat] ?? 0,
    }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  }, [scores]);

  async function saveNotes() {
    if (!canEditNotes) return;
    setSavingNotes(true);
    try {
      const res = await fetch(
        `/api/team/${orgId}/members/${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notes.trim() || null }),
        }
      );
      const json = await res.json();
      if (!json.success) {
        alert(
          typeof json.error === "string"
            ? json.error
            : isZh
              ? "保存失败"
              : "Failed to save"
        );
        return;
      }
      setSavedAt(Date.now());
      await onChanged();
    } finally {
      setSavingNotes(false);
    }
  }

  if (err) {
    return (
      <div className="px-4 pb-4 text-sm text-destructive">{err}</div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 pb-4 text-sm text-muted-foreground">
        {isZh ? "加载中…" : "Loading..."}
      </div>
    );
  }

  if (!data.profile) {
    return (
      <div className="px-4 pb-4 text-sm text-muted-foreground">
        {isZh
          ? "该成员尚未完成测试。"
          : "This member has not completed a test yet."}
      </div>
    );
  }

  return (
    <div className="bg-muted/30 px-4 py-5 space-y-5 border-t border-border">
      <div className="grid gap-5 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">
              {isZh ? "最佳角色匹配" : "Top role fit"}
            </h3>
            <div className="space-y-2">
              {topRoles.map((r) => (
                <div
                  key={r.role.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-background p-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {isZh ? r.role.nameZh : r.role.nameEn}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">
                      {r.role.genreId}
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {r.fitScore}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">
              {isZh ? "前 2 强项" : "Top 2 strengths"}
            </h3>
            <div className="grid gap-2 grid-cols-2">
              {topStrengths.map((s) => (
                <div
                  key={s.cat}
                  className="rounded-lg bg-background p-2.5 text-center"
                >
                  <div className="text-xs text-muted-foreground mb-0.5">
                    {isZh ? TALENT_LABELS[s.cat].zh : TALENT_LABELS[s.cat].en}
                  </div>
                  <div className="text-lg font-semibold">
                    {Math.round(s.score)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canEditNotes && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                {isZh ? "教练笔记 (私有)" : "Coach notes (private)"}
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={4000}
                rows={4}
                placeholder={
                  isZh
                    ? "记录观察、目标、调整…"
                    : "Record observations, goals, adjustments..."
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  {isZh ? "保存笔记" : "Save notes"}
                </Button>
                {savedAt && (
                  <span className="text-xs text-muted-foreground">
                    {isZh ? "已保存" : "Saved"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Radar chart */}
        <div className="rounded-lg bg-background p-3">
          {scores && <TalentRadar scores={scores} />}
        </div>
      </div>
    </div>
  );
}
