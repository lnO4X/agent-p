"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { Bell, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: "post_liked" | "post_replied";
  postId: string | null;
  read: boolean;
  createdAt: string;
  senderUsername: string | null;
  senderDisplayName: string | null;
}

function timeAgo(dateStr: string, isZh: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return isZh ? "刚刚" : "just now";
  if (mins < 60) return isZh ? `${mins}分钟前` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isZh ? `${hours}小时前` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return isZh ? `${days}天前` : `${days}d ago`;
}

export default function NotificationsPage() {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/notifications?limit=50");
      if (res.ok) {
        const json = await res.json();
        setItems(json.data ?? []);
      }
      setLoading(false);
      // Mark all as read
      await fetch("/api/notifications/mark-read", { method: "POST" });
    })();
  }, []);

  const title = isZh ? "通知" : "Notifications";
  const empty = isZh ? "暂无通知" : "No notifications yet";

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={20} strokeWidth={1.8} className="text-primary" />
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      {loading && (
        <div className="text-center text-muted-foreground py-12 text-sm">
          {isZh ? "加载中..." : "Loading..."}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center text-muted-foreground py-12 text-sm">{empty}</div>
      )}

      <div className="flex flex-col gap-2">
        {items.map((n) => {
          const sender = n.senderDisplayName ?? n.senderUsername ?? (isZh ? "某人" : "Someone");
          const isLike = n.type === "post_liked";
          const action = isLike
            ? isZh ? "赞了你的帖子" : "liked your post"
            : isZh ? "回复了你的帖子" : "replied to your post";
          const Icon = isLike ? Heart : MessageCircle;

          return (
            <Link
              key={n.id}
              href="/explore"
              className={`flex items-start gap-3 p-3 rounded-2xl border transition-colors pressable ${
                n.read ? "bg-card/50 border-border/50" : "bg-primary/5 border-primary/20"
              }`}
            >
              <div className={`mt-0.5 p-1.5 rounded-xl ${isLike ? "bg-red-500/10" : "bg-blue-500/10"}`}>
                <Icon
                  size={16}
                  strokeWidth={1.8}
                  className={isLike ? "text-red-500" : "text-blue-500"}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">
                  <span className="font-medium">{sender}</span>
                  {" "}
                  <span className="text-muted-foreground">{action}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {timeAgo(n.createdAt, isZh)}
                </p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
