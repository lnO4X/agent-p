"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, UserX } from "lucide-react";
import type { MemberRow } from "./team-detail-client";
import { MemberDetailPanel } from "./member-detail-panel";

function formatDate(d: string | Date | null): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function initial(name: string): string {
  return name?.trim()?.charAt(0)?.toUpperCase() || "?";
}

interface Props {
  orgId: string;
  members: MemberRow[];
  viewerRole: "admin" | "coach" | "player";
  onMemberChanged: () => void | Promise<void>;
}

export function MemberTable({
  orgId,
  members,
  viewerRole,
  onMemberChanged,
}: Props) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [expanded, setExpanded] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isAdmin = viewerRole === "admin";

  async function handleRemove(userId: string) {
    if (
      !confirm(
        isZh
          ? "确认从团队移除该成员？不可撤销。"
          : "Remove this member from the team? This cannot be undone."
      )
    ) {
      return;
    }
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/team/${orgId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(
          typeof json.error === "string"
            ? json.error
            : isZh
              ? "移除失败"
              : "Failed to remove"
        );
        return;
      }
      await onMemberChanged();
    } finally {
      setRemovingId(null);
    }
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {isZh
            ? "还没有成员。使用邀请按钮把球员加入团队。"
            : "No members yet. Use the Invite button to add your first player."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y divide-border">
        {members.map((m) => {
          const isOpen = expanded === m.userId;
          const testedAt = formatDate(m.latestSessionAt);
          return (
            <div key={m.memberId}>
              <div className="flex items-center gap-3 p-4">
                <div className="size-9 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {initial(m.displayName)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">
                      {m.displayName}
                    </span>
                    <Badge
                      variant={
                        m.role === "admin"
                          ? "default"
                          : m.role === "coach"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {m.role}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap mt-0.5">
                    <span>@{m.username}</span>
                    {testedAt ? (
                      <span>
                        {isZh ? "最近测试: " : "Tested: "}
                        {testedAt}
                      </span>
                    ) : (
                      <span className="italic">
                        {isZh ? "未测试" : "Never tested"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {m.latestOverallScore != null && (
                    <div className="text-right">
                      <div className="text-lg font-semibold leading-none">
                        {Math.round(m.latestOverallScore)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {m.latestOverallRank ?? ""}
                      </div>
                    </div>
                  )}
                  {m.latestArchetypeId && (
                    <Badge variant="outline" className="text-[10px]">
                      {m.latestArchetypeId}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setExpanded(isOpen ? null : m.userId)
                    }
                    aria-label={isOpen ? "Collapse" : "Expand"}
                  >
                    {isOpen ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={removingId === m.userId}
                      onClick={() => handleRemove(m.userId)}
                      aria-label={isZh ? "移除成员" : "Remove member"}
                      className="text-destructive"
                    >
                      <UserX className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              {isOpen && (
                <MemberDetailPanel
                  orgId={orgId}
                  userId={m.userId}
                  viewerRole={viewerRole}
                  onChanged={onMemberChanged}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

