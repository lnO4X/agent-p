"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, UsersRound } from "lucide-react";

interface InviteInfo {
  orgId: string;
  orgName: string;
  orgSlug: string;
  email: string;
  role: "admin" | "coach" | "player";
  expiresAt: string;
  status: "valid" | "expired" | "used" | "not_found";
}

export default function InviteAcceptClient({ token }: { token: string }) {
  const router = useRouter();
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/team/invite/${token}`);
        const json = await res.json();
        if (cancelled) return;
        if (!json.success) {
          setLoadError(
            typeof json.error === "string"
              ? json.error
              : isZh
                ? "加载失败"
                : "Failed to load invite"
          );
          return;
        }
        setInfo(json.data);
      } catch (e: unknown) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Network error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isZh]);

  async function accept() {
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await fetch(`/api/team/invite/${token}`, {
        method: "POST",
      });
      if (res.status === 401) {
        // Need login first. Send them to /login then back here.
        router.push(`/login?next=${encodeURIComponent(`/team/invite/${token}`)}`);
        return;
      }
      const json = await res.json();
      if (!json.success) {
        setAcceptError(
          typeof json.error === "string"
            ? json.error
            : isZh
              ? "接受失败"
              : "Failed to accept"
        );
        setAccepting(false);
        return;
      }
      setAccepted(true);
      // Redirect to team dashboard after a brief success flash.
      setTimeout(() => {
        router.push(`/team/${json.data.orgId}`);
      }, 1200);
    } catch (e: unknown) {
      setAcceptError(e instanceof Error ? e.message : "Network error");
      setAccepting(false);
    }
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            {loadError}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {isZh ? "加载中…" : "Loading..."}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (info.status !== "valid") {
    const msg =
      info.status === "expired"
        ? isZh
          ? "该邀请链接已过期。请向团队管理员重新申请。"
          : "This invite has expired. Please ask the team admin for a new link."
        : info.status === "used"
          ? isZh
            ? "该邀请已被使用。"
            : "This invite has already been used."
          : isZh
            ? "无效邀请。"
            : "Invalid invite.";
    return (
      <div className="max-w-md mx-auto py-12">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {msg}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Check className="size-6 text-primary" />
            </div>
            <div className="text-lg font-medium">
              {isZh ? `已加入 ${info.orgName}` : `Joined ${info.orgName}`}
            </div>
            <p className="text-sm text-muted-foreground">
              {isZh ? "正在跳转…" : "Redirecting..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="size-5 text-primary" />
            {isZh ? "团队邀请" : "Team invitation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isZh ? "你被邀请加入：" : "You've been invited to join:"}
          </p>
          <div className="rounded-lg border border-border p-3">
            <div className="text-lg font-semibold">{info.orgName}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{info.role}</Badge>
              <span>
                {isZh ? "邀请至: " : "Invited as: "}
                {info.email}
              </span>
            </div>
          </div>

          {acceptError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {acceptError}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={accept}
              disabled={accepting}
              className="flex-1"
            >
              {accepting && <Loader2 className="size-4 animate-spin" />}
              {isZh ? "接受邀请" : "Accept invitation"}
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button variant="ghost" className="w-full">
                {isZh ? "稍后" : "Not now"}
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {isZh
              ? "如果你没有账号，接受时将自动跳转到登录。"
              : "If you don't have an account, you'll be redirected to log in."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
