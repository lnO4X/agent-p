"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { getPartnerIcon, PARTNER_ICON_NAMES } from "./partner-icons";
import { X, Trash2, Save, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Partner } from "@/types/partner";

interface PartnerSettingsSheetProps {
  partner: Partner;
  open: boolean;
  onClose: () => void;
  onUpdated: (updated: Partner) => void;
}

export function PartnerSettingsSheet({
  partner,
  open,
  onClose,
  onUpdated,
}: PartnerSettingsSheetProps) {
  const { locale } = useI18n();
  const router = useRouter();
  const isZh = locale === "zh";

  const [name, setName] = useState(partner.name);
  const [avatar, setAvatar] = useState(partner.avatar);
  const [definition, setDefinition] = useState(partner.definition);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when partner changes
  useEffect(() => {
    setName(partner.name);
    setAvatar(partner.avatar);
    setDefinition(partner.definition);
    setShowDeleteConfirm(false);
    setError(null);
  }, [partner.id, partner.name, partner.avatar, partner.definition]);

  const hasChanges =
    name !== partner.name ||
    avatar !== partner.avatar ||
    definition !== partner.definition;

  async function handleSave() {
    if (!hasChanges || saving) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/partners/${partner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar, definition }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdated(data.data);
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (isZh ? "保存失败" : "Save failed"));
      }
    } catch {
      setError(isZh ? "网络错误" : "Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/partners/${partner.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onClose();
        router.push("/chat");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (isZh ? "删除失败" : "Delete failed"));
      }
    } catch {
      setError(isZh ? "网络错误" : "Network error");
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto bg-background rounded-t-2xl animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="sticky top-0 bg-background pt-3 pb-2 px-4 flex items-center justify-between border-b border-foreground/10 z-10">
          <h2 className="text-base font-semibold">
            {isZh ? "角色设置" : "Character Settings"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="pressable p-1.5 rounded-full hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-8 space-y-5">
          {/* Error */}
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {isZh ? "名称" : "Name"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className={cn(
                "w-full rounded-xl px-4 py-2.5 text-sm",
                "bg-muted/50 border border-foreground/10",
                "focus:outline-none focus:ring-2 focus:ring-primary/30"
              )}
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1 text-right">
              {name.length}/20
            </p>
          </div>

          {/* Avatar */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {isZh ? "图标" : "Icon"}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PARTNER_ICON_NAMES.map((iconName) => {
                const Icon = getPartnerIcon(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setAvatar(iconName)}
                    className={cn(
                      "w-full aspect-square rounded-xl flex items-center justify-center transition-all",
                      avatar === iconName
                        ? "bg-primary/15 ring-2 ring-primary"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        avatar === iconName
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Definition */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {isZh ? "人格定义" : "Personality Definition"}
            </label>
            <textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={6}
              className={cn(
                "w-full rounded-xl px-4 py-2.5 text-sm resize-none",
                "bg-muted/50 border border-foreground/10",
                "focus:outline-none focus:ring-2 focus:ring-primary/30",
                "leading-relaxed"
              )}
            />
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saving || !name.trim()}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
              "bg-primary text-primary-foreground font-medium text-sm",
              "pressable disabled:opacity-40 disabled:cursor-not-allowed",
              "transition-opacity"
            )}
          >
            <Save className="w-4 h-4" />
            {saving
              ? isZh
                ? "保存中…"
                : "Saving…"
              : isZh
                ? "保存修改"
                : "Save Changes"}
          </button>

          {/* Danger zone */}
          <div className="pt-3 border-t border-foreground/10">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
                  "text-destructive text-sm font-medium",
                  "border border-destructive/20 hover:bg-destructive/5",
                  "transition-colors pressable"
                )}
              >
                <Trash2 className="w-4 h-4" />
                {isZh ? "删除角色" : "Delete Character"}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {isZh
                      ? "确定删除此角色？所有对话记忆将丢失，此操作不可撤销。"
                      : "Delete this character? All conversation memory will be lost. This cannot be undone."}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-medium",
                      "bg-muted text-foreground pressable"
                    )}
                  >
                    {isZh ? "取消" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-medium",
                      "bg-destructive text-destructive-foreground pressable",
                      "disabled:opacity-50"
                    )}
                  >
                    {deleting
                      ? isZh
                        ? "删除中…"
                        : "Deleting…"
                      : isZh
                        ? "确认删除"
                        : "Confirm Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
