"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { useI18n } from "@/i18n/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";

/** Match server `slugify()` so the preview is accurate. */
function slugifyPreview(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function CreateTeamClient() {
  const router = useRouter();
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugPreview = useMemo(() => slugifyPreview(name), [name]);
  const canSubmit = name.trim().length >= 2 && !submitting;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/team/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(
          typeof json.error === "string"
            ? json.error
            : isZh
              ? "创建失败"
              : "Failed to create team"
        );
        setSubmitting(false);
        return;
      }
      router.push(`/team/${json.data.org.id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : isZh
            ? "网络错误"
            : "Network error"
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 space-y-5">
      <div>
        <Link
          href="/team"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          {isZh ? "返回团队列表" : "Back to teams"}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isZh ? "创建团队" : "Create a team"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="team-name"
                className="text-sm font-medium text-foreground"
              >
                {isZh ? "团队名称" : "Team name"}
              </label>
              <Input
                id="team-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  isZh
                    ? "例如：上海闪电战队"
                    : "e.g. Shanghai Lightning Squad"
                }
                autoFocus
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground">
                {isZh
                  ? "至少 2 个字符，最多 80 个字符。"
                  : "Between 2 and 80 characters."}
              </p>
            </div>

            {slugPreview && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  {isZh ? "URL: " : "URL: "}
                </span>
                <span className="font-mono">/team/{slugPreview}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {isZh
                    ? "实际 URL 使用团队 ID，slug 仅用于 CSV 文件名等展示场景。"
                    : "Actual URLs use the team ID; the slug is only used in exported filenames and display contexts."}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button type="submit" variant="default" disabled={!canSubmit}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {isZh ? "创建团队" : "Create team"}
              </Button>
              <Link href="/team">
                <Button type="button" variant="ghost" size="default">
                  {isZh ? "取消" : "Cancel"}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
