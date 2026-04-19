"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Key, Loader2, Trash2, X } from "lucide-react";
import type { OrgDetail } from "./team-detail-client";

type OrgPlan = "beta" | "starter" | "pro" | "enterprise";

interface ApiTokenSummary {
  id: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

interface Props {
  org: OrgDetail;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}

type Tab = "general" | "tokens" | "danger";

export function SettingsModal({ org, onClose, onChanged }: Props) {
  const router = useRouter();
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card ring-1 ring-foreground/10 rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold">
            {isZh ? "团队设置" : "Team settings"}
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

        <div className="flex border-b border-border flex-shrink-0">
          {(
            [
              ["general", isZh ? "通用" : "General"],
              ["tokens", isZh ? "API 令牌" : "API tokens"],
              ["danger", isZh ? "危险区" : "Danger zone"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm transition-colors ${
                tab === key
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "general" && (
            <GeneralTab
              org={org}
              onChanged={onChanged}
              isZh={isZh}
            />
          )}
          {tab === "tokens" && <TokensTab orgId={org.id} isZh={isZh} />}
          {tab === "danger" && (
            <DangerTab
              org={org}
              onDeleted={() => {
                router.push("/team");
              }}
              isZh={isZh}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralTab({
  org,
  onChanged,
  isZh,
}: {
  org: OrgDetail;
  onChanged: () => void | Promise<void>;
  isZh: boolean;
}) {
  const [name, setName] = useState(org.name);
  const [plan, setPlan] = useState<OrgPlan>(org.plan);
  const [maxMembers, setMaxMembers] = useState(org.maxMembers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, plan, maxMembers }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(
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
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="settings-name" className="text-sm font-medium">
          {isZh ? "团队名称" : "Team name"}
        </label>
        <Input
          id="settings-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="settings-plan" className="text-sm font-medium">
          {isZh ? "套餐" : "Plan"}
        </label>
        <select
          id="settings-plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value as OrgPlan)}
          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="beta">Beta</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="settings-max" className="text-sm font-medium">
          {isZh ? "成员上限" : "Max members"}
        </label>
        <Input
          id="settings-max"
          type="number"
          min={1}
          max={10000}
          value={maxMembers}
          onChange={(e) =>
            setMaxMembers(Math.max(1, parseInt(e.target.value, 10) || 1))
          }
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="default" size="sm" disabled={saving}>
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          {isZh ? "保存" : "Save"}
        </Button>
        {savedAt && (
          <span className="text-xs text-muted-foreground">
            {isZh ? "已保存" : "Saved"}
          </span>
        )}
      </div>
    </form>
  );
}

function TokensTab({ orgId, isZh }: { orgId: string; isZh: boolean }) {
  const [tokens, setTokens] = useState<ApiTokenSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExpiry, setNewExpiry] = useState<number | "">(90);
  const [justCreatedRaw, setJustCreatedRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/team/${orgId}/tokens`);
      const json = await res.json();
      if (!json.success) {
        setLoadError(
          typeof json.error === "string"
            ? json.error
            : isZh
              ? "加载失败"
              : "Failed to load"
        );
        return;
      }
      setTokens(json.data.tokens);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Network error");
    }
  }, [orgId, isZh]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const body: { name: string; expiresInDays?: number } = {
        name: newName.trim(),
      };
      if (typeof newExpiry === "number" && newExpiry > 0) {
        body.expiresInDays = newExpiry;
      }
      const res = await fetch(`/api/team/${orgId}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        setCreateError(
          typeof json.error === "string"
            ? json.error
            : isZh
              ? "创建失败"
              : "Failed to create"
        );
        return;
      }
      setJustCreatedRaw(json.data.rawToken);
      setNewName("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(tokenId: string) {
    if (
      !confirm(
        isZh
          ? "确认撤销此令牌？调用此令牌的服务将立即失败。"
          : "Revoke this token? Any service using it will fail immediately."
      )
    ) {
      return;
    }
    const res = await fetch(`/api/team/${orgId}/tokens`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId }),
    });
    const json = await res.json();
    if (!json.success) {
      alert(
        typeof json.error === "string"
          ? json.error
          : isZh
            ? "撤销失败"
            : "Failed to revoke"
      );
      return;
    }
    await load();
  }

  async function copyRaw() {
    if (!justCreatedRaw) return;
    try {
      await navigator.clipboard.writeText(justCreatedRaw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        {isZh
          ? "API 令牌用于程序化访问你的团队数据（例如导出 CSV、同步到 BI 工具）。创建的令牌仅展示一次，请立即保存。"
          : "API tokens grant programmatic access to your team data (e.g. CSV export, BI sync). Tokens are shown only once at creation — save them immediately."}
      </p>

      {justCreatedRaw && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2">
          <div className="text-sm font-medium text-primary flex items-center gap-1.5">
            <Key className="size-3.5" />
            {isZh
              ? "令牌创建成功 — 立即复制"
              : "Token created — copy it now"}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-background px-2 py-1.5 text-xs font-mono break-all">
              {justCreatedRaw}
            </code>
            <Button variant="outline" size="sm" onClick={copyRaw}>
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
          <p className="text-xs text-muted-foreground">
            {isZh
              ? "关闭后将无法再次查看。如果丢失请撤销并重新创建。"
              : "You will not be able to view it again. If lost, revoke and recreate."}
          </p>
          <div className="pt-1">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setJustCreatedRaw(null)}
            >
              {isZh ? "关闭" : "Dismiss"}
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-2">
        <div className="text-sm font-medium">
          {isZh ? "创建新令牌" : "Create token"}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder={
              isZh ? "令牌名称（如：CI 机器人）" : "Token name (e.g. CI bot)"
            }
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 min-w-[200px]"
            maxLength={80}
          />
          <select
            value={newExpiry}
            onChange={(e) =>
              setNewExpiry(
                e.target.value === "" ? "" : parseInt(e.target.value, 10)
              )
            }
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value={30}>30d</option>
            <option value={90}>90d</option>
            <option value={180}>180d</option>
            <option value={365}>365d</option>
            <option value="">{isZh ? "永不过期" : "Never"}</option>
          </select>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={!newName.trim() || creating}
          >
            {creating && <Loader2 className="size-3.5 animate-spin" />}
            {isZh ? "创建" : "Create"}
          </Button>
        </div>
        {createError && (
          <div className="text-xs text-destructive">{createError}</div>
        )}
      </form>

      <div>
        <div className="text-sm font-medium mb-2">
          {isZh ? "现有令牌" : "Existing tokens"}
        </div>
        {loadError ? (
          <div className="text-sm text-destructive">{loadError}</div>
        ) : !tokens ? (
          <div className="text-sm text-muted-foreground">
            {isZh ? "加载中…" : "Loading..."}
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {isZh ? "尚未创建任何令牌。" : "No tokens yet."}
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {tokens.map((t) => {
              const revoked = !!t.revokedAt;
              const expired = t.expiresAt && new Date(t.expiresAt) < new Date();
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 p-3 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {t.name}
                      {revoked && (
                        <span className="ml-2 text-xs text-destructive">
                          {isZh ? "已撤销" : "revoked"}
                        </span>
                      )}
                      {!revoked && expired && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {isZh ? "已过期" : "expired"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isZh ? "创建: " : "Created: "}
                      {new Date(t.createdAt).toISOString().slice(0, 10)}
                      {" · "}
                      {t.lastUsedAt
                        ? `${isZh ? "最近使用: " : "Last used: "}${new Date(
                            t.lastUsedAt
                          )
                            .toISOString()
                            .slice(0, 10)}`
                        : isZh
                          ? "从未使用"
                          : "Never used"}
                      {t.expiresAt
                        ? ` · ${
                            isZh ? "过期: " : "Expires: "
                          }${new Date(t.expiresAt).toISOString().slice(0, 10)}`
                        : ""}
                    </div>
                  </div>
                  {!revoked && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRevoke(t.id)}
                      aria-label={isZh ? "撤销" : "Revoke"}
                      className="text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function DangerTab({
  org,
  onDeleted,
  isZh,
}: {
  org: OrgDetail;
  onDeleted: () => void;
  isZh: boolean;
}) {
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmName !== org.name) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${org.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(
          typeof json.error === "string"
            ? json.error
            : isZh
              ? "删除失败"
              : "Failed to delete"
        );
        setDeleting(false);
        return;
      }
      onDeleted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <div>
          <div className="text-sm font-semibold text-destructive">
            {isZh ? "删除团队" : "Delete team"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isZh
              ? "删除后所有成员、邀请、API 令牌都会被移除。操作不可恢复。仅团队所有者可执行。"
              : "All members, invites, and API tokens will be removed. This cannot be undone. Only the team owner can delete."}
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            {isZh
              ? `输入团队名称 "${org.name}" 以确认:`
              : `Type the team name "${org.name}" to confirm:`}
          </label>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={org.name}
          />
        </div>
        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button
          variant="destructive"
          size="sm"
          disabled={confirmName !== org.name || deleting}
          onClick={handleDelete}
        >
          {deleting && <Loader2 className="size-3.5 animate-spin" />}
          {isZh ? "永久删除团队" : "Permanently delete team"}
        </Button>
      </div>
    </div>
  );
}
