"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, ArrowRight, UsersRound } from "lucide-react";

interface TeamSummary {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "pro" | "enterprise" | "beta";
  role: "admin" | "coach" | "player";
  memberCount: number;
}

function RoleBadge({ role }: { role: TeamSummary["role"] }) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const variant =
    role === "admin"
      ? "default"
      : role === "coach"
        ? "secondary"
        : "outline";
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

export default function TeamListClient() {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [teams, setTeams] = useState<TeamSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/team");
        const json = await res.json();
        if (cancelled) return;
        if (!json.success) {
          setError(json.error ?? "Failed to load teams");
          return;
        }
        setTeams(json.data.orgs);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Network error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        <h1 className="text-2xl font-semibold">
          {isZh ? "团队" : "Teams"}
        </h1>
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teams) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        <h1 className="text-2xl font-semibold">
          {isZh ? "团队" : "Teams"}
        </h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {isZh ? "加载中…" : "Loading..."}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
          <UsersRound className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {isZh ? "创建你的第一个团队" : "Create your first team"}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {isZh
              ? "把球员聚集起来，在一个地方查看他们的认知画像、对比强项、跟踪成长。"
              : "Gather your players in one place. See their cognitive profiles, compare strengths, and track growth."}
          </p>
        </div>
        <Link href="/team/create">
          <Button size="lg" variant="default">
            <Plus className="size-4" />
            {isZh ? "创建团队" : "Create team"}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {isZh ? "团队" : "Teams"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isZh
              ? `${teams.length} 个团队`
              : `${teams.length} team${teams.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link href="/team/create">
          <Button variant="default" size="sm">
            <Plus className="size-4" />
            {isZh ? "新建团队" : "New team"}
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((team) => (
          <Card key={team.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="truncate">{team.name}</span>
                <RoleBadge role={team.role} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  <span>
                    {team.memberCount}{" "}
                    {isZh
                      ? "人"
                      : team.memberCount === 1
                        ? "member"
                        : "members"}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {team.plan}
                </Badge>
              </div>
              <Link href={`/team/${team.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full">
                  {isZh ? "打开" : "Open"}
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
