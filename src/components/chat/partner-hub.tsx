"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { PartnerCard } from "./partner-card";
import { CHARACTER_PRESETS } from "@/lib/character-presets";
import type { CharacterPreset } from "@/lib/character-presets";
import { Plus, Crown, Lock, Swords, Flame, Heart, Star, Sparkles, Store } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Partner } from "@/types/partner";

const CATEGORY_CONFIG = {
  rival: { icon: Swords, color: "text-red-400", bg: "bg-red-500/10" },
  mentor: { icon: Flame, color: "text-amber-400", bg: "bg-amber-500/10" },
  companion: { icon: Heart, color: "text-green-400", bg: "bg-green-500/10" },
  wild: { icon: Star, color: "text-primary", bg: "bg-primary/10" },
} as const;

export function PartnerHub() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<"free" | "premium">("free");
  const [maxSlots, setMaxSlots] = useState(2);
  const [showGallery, setShowGallery] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const isZh = locale === "zh";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/partners");
        if (res.ok) {
          const data = await res.json();
          setPartners(data.data || []);
          if (data.tier) setTier(data.tier);
          if (data.maxSlots) setMaxSlots(data.maxSlots);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const customSlotCount = partners.filter((p) => p.slot > 0).length;
  const maxCustom = maxSlots - 1;
  const canCreateMore = customSlotCount < maxCustom;

  async function createFromPreset(preset: CharacterPreset) {
    if (!canCreateMore || creating) return;
    setCreating(preset.id);
    setCreateError(null);
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: isZh ? preset.name : preset.nameEn,
          avatar: preset.avatar,
          definition: preset.definition,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.id) {
          router.push(`/chat/${data.data.id}`);
        } else {
          setCreateError(isZh ? "创建失败，请重试" : "Failed to create, please retry");
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.error || (isZh ? "创建失败，请重试" : "Failed to create, please retry"));
      }
    } catch {
      setCreateError(isZh ? "网络错误，请重试" : "Network error, please retry");
    } finally {
      setCreating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("partners.title")}</h1>
        {tier === "premium" && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600">
            <Crown size={12} />
            Premium
          </span>
        )}
      </div>

      {/* Existing partner cards */}
      <div className="space-y-3">
        {partners.map((partner) => (
          <PartnerCard
            key={partner.id}
            id={partner.id}
            name={partner.name}
            avatar={partner.avatar}
            definition={partner.definition}
            memory={partner.memory}
            onClick={() => router.push(`/chat/${partner.id}`)}
          />
        ))}

        {/* Add character button */}
        {canCreateMore && !showGallery && (
          <button
            type="button"
            onClick={() => setShowGallery(true)}
            className={cn(
              "w-full flex items-center justify-center gap-2 p-4 rounded-2xl",
              "border-2 border-dashed border-foreground/15",
              "text-muted-foreground hover:border-primary/30 hover:text-primary",
              "transition-colors pressable"
            )}
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">
              {isZh ? "添加角色" : "Add Character"}{" "}
              <span className="text-xs opacity-70">
                ({partners.length}/{maxSlots})
              </span>
            </span>
          </button>
        )}

        {/* Locked slots */}
        {!canCreateMore && tier === "free" && (
          <button
            type="button"
            onClick={() => router.push("/me/premium")}
            className={cn(
              "w-full flex items-center justify-center gap-2 p-4 rounded-2xl",
              "border-2 border-dashed border-yellow-500/20",
              "text-yellow-600/70 hover:border-yellow-500/40 hover:text-yellow-600",
              "transition-colors pressable"
            )}
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t("partners.upgrade")}
            </span>
          </button>
        )}

        {!canCreateMore && tier === "premium" && (
          <p className="text-center text-xs text-muted-foreground py-2">
            {t("partners.maxReached", {
              current: partners.length,
              max: maxSlots,
            })}
          </p>
        )}
      </div>

      {/* Marketplace link — hidden (feature paused, code preserved) */}

      {/* Create error toast */}
      {createError && (
        <div className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2 text-center">
          {createError}
        </div>
      )}

      {/* Character Gallery */}
      {showGallery && canCreateMore && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              {isZh ? "角色画廊" : "Character Gallery"}
            </h2>
            <button
              onClick={() => setShowGallery(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {isZh ? "关闭" : "Close"}
            </button>
          </div>

          {/* Category sections */}
          {(["rival", "mentor", "companion", "wild"] as const).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            const presets = CHARACTER_PRESETS.filter((p) => p.category === cat);
            if (presets.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Icon size={14} className={config.color} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {isZh ? presets[0].categoryLabel : presets[0].categoryLabelEn}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={!!creating}
                      onClick={() => createFromPreset(preset)}
                      className={cn(
                        "text-left p-3 rounded-xl border border-border",
                        "hover:border-primary/30 transition-colors pressable",
                        creating === preset.id && "opacity-50"
                      )}
                    >
                      <div className="text-sm font-medium mb-0.5">
                        {isZh ? preset.name : preset.nameEn}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-2">
                        {isZh ? preset.tagline : preset.taglineEn}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Custom creation option */}
          <button
            type="button"
            onClick={() => router.push("/chat/new")}
            className={cn(
              "w-full flex items-center justify-center gap-2 p-3 rounded-xl",
              "border border-dashed border-foreground/15",
              "text-muted-foreground hover:border-primary/30 hover:text-primary",
              "transition-colors pressable text-sm"
            )}
          >
            <Plus className="w-4 h-4" />
            {isZh ? "自定义创建" : "Custom Character"}
          </button>
        </div>
      )}
    </div>
  );
}
