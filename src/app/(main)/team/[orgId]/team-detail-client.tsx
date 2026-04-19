"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Mail, Settings, Users } from "lucide-react";
import { MemberTable } from "./member-table";
import { InviteModal } from "./invite-modal";
import { SettingsModal } from "./settings-modal";

type OrgRole = "admin" | "coach" | "player";
type OrgPlan = "beta" | "starter" | "pro" | "enterprise";

export interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  ownerId: string;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemberRow {
  memberId: string;
  userId: string;
  role: OrgRole;
  displayName: string;
  username: string;
  email: string | null;
  notes: string | null;
  addedAt: string;
  latestOverallScore: number | null;
  latestOverallRank: string | null;
  latestArchetypeId: string | null;
  latestSessionAt: string | null;
}

interface ApiTeamDetail {
  org: OrgDetail;
  viewerRole: OrgRole;
  members: MemberRow[];
}

function RoleBadge({ role }: { role: OrgRole }) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const variant: "default" | "secondary" | "outline" =
    role === "admin" ? "default" : role === "coach" ? "secondary" : "outline";
  const label =
    role === "admin"
      ? isZh
        ? "管理员"
        : "Admin"
      : role === "coach"
        ? isZh
          ? "教练"
          : "Coach"
        : isZh
          ? "球员"
          : "Player";
  return <Badge variant={variant}>{label}</Badge>;
}

export default function TeamDetailClient({ orgId }: { orgId: string }) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [data, setData] = useState<ApiTeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/team/${orgId}`);
      const json = await res.json();
      if (!json.success) {
        setError(
          typeof json.error === "string"
            ? json.error
            : isZh
              ? "加载失败"
              : "Failed to load team"
        );
        return;
      }
      setData(json.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : isZh
            ? "网络错误"
            : "Network error"
      );
    }
  }, [orgId, isZh]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleExport() {
    // Simple GET — browser handles download via Content-Disposition.
    window.location.href = `/api/team/${orgId}/export/csv?dims=all`;
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-4">
        <Link
          href="/team"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {isZh ? "返回" : "Back"}
        </Link>
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {isZh ? "加载中…" : "Loading..."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { org, viewerRole, members } = data;
  const isAdmin = viewerRole === "admin";
  const isCoachOrAdmin = viewerRole === "admin" || viewerRole === "coach";

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div>
        <Link
          href="/team"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {isZh ? "所有团队" : "All teams"}
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{org.name}</h1>
            <RoleBadge role={viewerRole} />
            <Badge variant="outline" className="text-[10px]">
              {org.plan}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-xs">{org.slug}</span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {members.length} / {org.maxMembers}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInvite(true)}
            >
              <Mail className="size-3.5" />
              {isZh ? "邀请" : "Invite"}
            </Button>
          )}
          {isCoachOrAdmin && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-3.5" />
              {isZh ? "导出 CSV" : "Export CSV"}
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="size-3.5" />
              {isZh ? "设置" : "Settings"}
            </Button>
          )}
        </div>
      </div>

      {/* Members */}
      <MemberTable
        orgId={orgId}
        members={members}
        viewerRole={viewerRole}
        onMemberChanged={load}
      />

      {showInvite && isAdmin && (
        <InviteModal
          orgId={orgId}
          onClose={() => setShowInvite(false)}
          onInvited={load}
        />
      )}

      {showSettings && isAdmin && (
        <SettingsModal
          org={org}
          onClose={() => setShowSettings(false)}
          onChanged={load}
        />
      )}
    </div>
  );
}
