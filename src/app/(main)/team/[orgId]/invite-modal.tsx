"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Loader2, X } from "lucide-react";

type InviteRole = "player" | "coach" | "admin";

interface Props {
  orgId: string;
  onClose: () => void;
  onInvited: () => void | Promise<void>;
}

export function InviteModal({ orgId, onClose, onInvited }: Props) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("player");
  const [submitting, setSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${orgId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(
          typeof json.error === "string"
            ? json.error
            : isZh
              ? "邀请失败"
              : "Failed to invite"
        );
        return;
      }
      setInviteUrl(json.data.inviteUrl);
      await onInvited();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : isZh
            ? "网络错误"
            : "Network error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card ring-1 ring-foreground/10 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">
            {isZh ? "邀请成员" : "Invite member"}
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        {inviteUrl ? (
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {isZh
                ? "邀请已创建。复制链接并发给对方。链接 14 天内有效。"
                : "Invite created. Copy the link and send it to the invitee. Link is valid for 14 days."}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs font-mono break-all">
                {inviteUrl}
              </code>
              <Button variant="outline" size="sm" onClick={copyLink}>
                <Copy className="size-3.5" />
                {copied
                  ? isZh
                    ? "已复制"
                    : "Copied"
                  : isZh
                    ? "复制"
                    : "Copy"}
              </Button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInviteUrl(null);
                  setEmail("");
                }}
              >
                {isZh ? "再邀请一个" : "Invite another"}
              </Button>
              <Button variant="default" size="sm" onClick={onClose}>
                {isZh ? "完成" : "Done"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="invite-email" className="text-sm font-medium">
                {isZh ? "邮箱" : "Email"}
              </label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="invite-role" className="text-sm font-medium">
                {isZh ? "角色" : "Role"}
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as InviteRole)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="player">
                  {isZh ? "球员 (Player)" : "Player"}
                </option>
                <option value="coach">
                  {isZh ? "教练 (Coach)" : "Coach"}
                </option>
                <option value="admin">
                  {isZh ? "管理员 (Admin)" : "Admin"}
                </option>
              </select>
              <p className="text-xs text-muted-foreground">
                {isZh
                  ? "Coach 可查看所有成员画像；Admin 可管理团队设置。"
                  : "Coaches can view all member profiles; admins can manage team settings."}
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                {isZh ? "取消" : "Cancel"}
              </Button>
              <Button type="submit" variant="default" size="sm" disabled={submitting}>
                {submitting && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                {isZh ? "生成邀请链接" : "Generate invite link"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
