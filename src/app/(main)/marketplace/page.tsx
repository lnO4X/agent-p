"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  Download,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Clock,
  Copy,
  Check,
  Bot,
  Brain,
  Lightbulb,
  Shield,
  Sword,
  Compass,
  Flame,
  Star,
  Gem,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Map partner avatar name to icon component */
const ICON_MAP: Record<string, LucideIcon> = {
  Bot, Brain, Lightbulb, Shield, Sword, Heart, Compass, Flame, Star, Sparkles, Gem, Crown,
};
function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Bot;
}

interface SharedPartner {
  id: string;
  name: string;
  avatar: string;
  description: string;
  tags: string[];
  usageCount: number;
  likeCount: number;
  authorUsername: string;
  authorName: string | null;
  liked: boolean;
  createdAt: string;
}

type SortMode = "popular" | "newest";

export default function MarketplacePage() {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [items, setItems] = useState<SharedPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("popular");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SharedPartner & { definition: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchList = useCallback(async (sortMode: SortMode) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace?sort=${sortMode}&limit=30`);
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(sort);
  }, [sort, fetchList]);

  // Load detail when selected
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    fetch(`/api/marketplace/${selectedId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setDetail(res.data);
      })
      .catch(() => {});
  }, [selectedId]);

  async function handleLike(id: string, currently: boolean) {
    const action = currently ? "unlike" : "like";
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              liked: !currently,
              likeCount: item.likeCount + (currently ? -1 : 1),
            }
          : item
      )
    );
    await fetch(`/api/marketplace/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  async function handleCopyDefinition() {
    if (!detail?.definition) return;
    await navigator.clipboard.writeText(detail.definition);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Detail view
  if (selectedId && detail) {
    const IconComp = getIcon(detail.avatar);
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          {isZh ? "返回" : "Back"}
        </button>

        <Card>
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <IconComp size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold">{detail.name}</h1>
                <p className="text-xs text-muted-foreground">
                  by @{detail.authorUsername}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart size={14} className={detail.liked ? "fill-red-500 text-red-500" : ""} />
                  {detail.likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <Download size={14} />
                  {detail.usageCount}
                </span>
              </div>
            </div>

            <p className="text-sm">{detail.description}</p>

            {detail.tags && detail.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {detail.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Definition preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">
                  {isZh ? "人格定义" : "Personality Definition"}
                </h3>
                <button
                  type="button"
                  onClick={handleCopyDefinition}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? (isZh ? "已复制" : "Copied") : (isZh ? "复制" : "Copy")}
                </button>
              </div>
              <pre className="text-xs bg-muted/50 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">
                {detail.definition}
              </pre>
            </div>

            {/* Use button — create partner with this definition */}
            <Link
              href={`/chat/new?preset=marketplace&definition=${encodeURIComponent(detail.definition)}&name=${encodeURIComponent(detail.name)}&avatar=${encodeURIComponent(detail.avatar)}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium pressable"
            >
              <Sparkles size={16} />
              {isZh ? "使用此伙伴" : "Use This Partner"}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            {isZh ? "伙伴市场" : "Partner Market"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isZh ? "发现社区创建的AI伙伴" : "Discover community-created AI partners"}
          </p>
        </div>
        <Link
          href="/chat"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} className="inline mr-1" />
          {isZh ? "我的伙伴" : "My Partners"}
        </Link>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSort("popular")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
            sort === "popular" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
          )}
        >
          <TrendingUp size={14} />
          {isZh ? "热门" : "Popular"}
        </button>
        <button
          type="button"
          onClick={() => setSort("newest")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
            sort === "newest" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
          )}
        >
          <Clock size={14} />
          {isZh ? "最新" : "Newest"}
        </button>
      </div>

      {/* Items */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {isZh ? "还没有共享的伙伴。创建一个吧！" : "No shared partners yet. Be the first!"}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const IconComp = getIcon(item.avatar);
            return (
              <Card
                key={item.id}
                className="pressable cursor-pointer"
                onClick={() => setSelectedId(item.id)}
              >
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <IconComp size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">{item.name}</h3>
                        <span className="text-[10px] text-muted-foreground">
                          @{item.authorUsername}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(item.id, item.liked);
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Heart
                          size={14}
                          className={item.liked ? "fill-red-500 text-red-500" : ""}
                        />
                        {item.likeCount}
                      </button>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Download size={10} />
                        {item.usageCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
