"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  MessageCircle,
  Send,
  Users,
  ChevronDown,
  CornerDownRight,
  Clock,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllArchetypes } from "@/lib/archetype";

interface Reply {
  id: string;
  authorUsername: string;
  authorDisplayName: string | null;
  content: string;
  createdAt: string;
}

interface Post {
  id: string;
  authorUsername: string;
  authorDisplayName: string | null;
  archetypeId: string;
  content: string;
  likeCount: number;
  replyCount: number;
  liked: boolean;
  createdAt: string;
}

export default function CommunityPage() {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [showArchetypeFilter, setShowArchetypeFilter] = useState(false);
  const [myArchetypeId, setMyArchetypeId] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "hot">("newest");

  // Reply state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, Reply[]>>({});
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  const archetypes = getAllArchetypes();
  const selectedArch = archetypes.find((a) => a.id === selectedArchetype) || null;

  // Load user's archetype
  useEffect(() => {
    fetch("/api/talent-trends")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.archetypeId) {
          setMyArchetypeId(res.data.archetypeId);
          if (!selectedArchetype) {
            setSelectedArchetype(res.data.archetypeId);
          }
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPosts = useCallback(async (archetypeId: string | null, sortMode: "newest" | "hot") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30", sort: sortMode });
      if (archetypeId) params.set("archetypeId", archetypeId);
      const res = await fetch(`/api/community?${params}`);
      const data = await res.json();
      if (data.success) setPosts(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(selectedArchetype, sort);
  }, [selectedArchetype, sort, fetchPosts]);

  async function handlePost() {
    if (!newPostContent.trim() || !selectedArchetype || posting) return;
    setPosting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetypeId: selectedArchetype,
          content: newPostContent.trim(),
        }),
      });
      if (res.ok) {
        setNewPostContent("");
        fetchPosts(selectedArchetype, sort);
      }
    } catch {
      // silent
    } finally {
      setPosting(false);
    }
  }

  async function handleLike(postId: string, currently: boolean) {
    const action = currently ? "unlike" : "like";
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !currently, likeCount: p.likeCount + (currently ? -1 : 1) }
          : p
      )
    );
    await fetch(`/api/community/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  async function toggleReplies(postId: string) {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    setExpandedPostId(postId);
    if (repliesMap[postId]) return; // already loaded

    setLoadingReplies((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/community/${postId}`);
      const data = await res.json();
      if (data.success) {
        setRepliesMap((prev) => ({ ...prev, [postId]: data.data.replies ?? [] }));
      }
    } catch {
      setRepliesMap((prev) => ({ ...prev, [postId]: [] }));
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleReply(postId: string) {
    const content = replyTextMap[postId]?.trim();
    if (!content || submittingReply[postId]) return;

    setSubmittingReply((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/community/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", content }),
      });
      if (res.ok) {
        setReplyTextMap((prev) => ({ ...prev, [postId]: "" }));
        // Refresh replies
        const detailRes = await fetch(`/api/community/${postId}`);
        const detailData = await detailRes.json();
        if (detailData.success) {
          setRepliesMap((prev) => ({ ...prev, [postId]: detailData.data.replies ?? [] }));
        }
        // Increment reply count in local state
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, replyCount: p.replyCount + 1 } : p))
        );
      }
    } catch {
      // silent
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [postId]: false }));
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isZh ? "刚刚" : "just now";
    if (mins < 60) return isZh ? `${mins}分钟前` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isZh ? `${hours}小时前` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isZh ? `${days}天前` : `${days}d ago`;
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Users size={18} className="text-primary" />
          {isZh ? "原型社区" : "Archetype Community"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isZh ? "找到你的同类，交流游戏心得" : "Find your kind, share gaming insights"}
        </p>
      </div>

      {/* Archetype filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowArchetypeFilter(!showArchetypeFilter)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-foreground/5 w-full text-left"
        >
          {selectedArch ? (
            <>
              <span className="text-lg">{selectedArch.icon}</span>
              <span className="text-sm font-medium flex-1">
                {isZh ? selectedArch.name : selectedArch.nameEn}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground flex-1">
              {isZh ? "全部原型" : "All Archetypes"}
            </span>
          )}
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>

        {showArchetypeFilter && (
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-background border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
            <button
              type="button"
              onClick={() => { setSelectedArchetype(null); setShowArchetypeFilter(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              {isZh ? "全部原型" : "All Archetypes"}
            </button>
            {archetypes.map((arch) => (
              <button
                key={arch.id}
                type="button"
                onClick={() => { setSelectedArchetype(arch.id); setShowArchetypeFilter(false); }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2",
                  selectedArchetype === arch.id && "bg-primary/5 text-primary"
                )}
              >
                <span>{arch.icon}</span>
                <span>{isZh ? arch.name : arch.nameEn}</span>
                {arch.id === myArchetypeId && (
                  <span className="ml-auto text-[10px] text-primary">
                    {isZh ? "我的原型" : "My archetype"}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort toggle */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setSort("newest")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            sort === "newest"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
          )}
        >
          <Clock size={12} />
          {isZh ? "最新" : "Newest"}
        </button>
        <button
          type="button"
          onClick={() => setSort("hot")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            sort === "hot"
              ? "bg-orange-500 text-white"
              : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
          )}
        >
          <Flame size={12} />
          {isZh ? "热门" : "Hot"}
        </button>
      </div>

      {/* New post */}
      {selectedArchetype && (
        <Card>
          <CardContent className="pt-3 pb-3">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={isZh ? `作为${selectedArch?.name || ""}，分享你的想法...` : `As a ${selectedArch?.nameEn || ""}, share your thoughts...`}
              className="w-full bg-transparent text-sm resize-none border-none outline-none placeholder:text-muted-foreground/50"
              rows={3}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">
                {newPostContent.length}/500
              </span>
              <button
                type="button"
                onClick={handlePost}
                disabled={!newPostContent.trim() || posting}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  newPostContent.trim()
                    ? "bg-primary text-primary-foreground pressable"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Send size={12} />
                {isZh ? "发布" : "Post"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {isZh ? "还没有帖子。成为第一个发言的人！" : "No posts yet. Be the first to post!"}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const arch = archetypes.find((a) => a.id === post.archetypeId);
            const isExpanded = expandedPostId === post.id;
            const replies = repliesMap[post.id] ?? [];
            const isLoadingReplies = loadingReplies[post.id] ?? false;
            const replyText = replyTextMap[post.id] ?? "";

            return (
              <Card key={post.id}>
                <CardContent className="pt-3 pb-3">
                  {/* Post header */}
                  <div className="flex items-center gap-2 mb-2">
                    {arch && <span className="text-sm">{arch.icon}</span>}
                    <span className="text-xs font-medium">
                      {post.authorDisplayName || post.authorUsername}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      @{post.authorUsername}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {timeAgo(post.createdAt)}
                    </span>
                  </div>

                  {/* Post content */}
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/30">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id, post.liked)}
                      className={cn(
                        "flex items-center gap-1 text-xs transition-colors",
                        post.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                      )}
                    >
                      <Heart size={14} className={post.liked ? "fill-current" : ""} />
                      {post.likeCount}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleReplies(post.id)}
                      className={cn(
                        "flex items-center gap-1 text-xs transition-colors",
                        isExpanded ? "text-primary" : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      <MessageCircle size={14} className={isExpanded ? "fill-primary/20" : ""} />
                      {post.replyCount}
                    </button>
                  </div>

                  {/* Replies section */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {/* Existing replies */}
                      {isLoadingReplies ? (
                        <div className="space-y-2">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="h-10 bg-muted/40 rounded-lg animate-pulse ml-4" />
                          ))}
                        </div>
                      ) : replies.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground ml-4">
                          {isZh ? "暂无回复，来第一个评论吧" : "No replies yet — be the first!"}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {replies.map((reply) => (
                            <div key={reply.id} className="flex gap-2 ml-2">
                              <CornerDownRight size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                              <div className="flex-1 bg-muted/30 rounded-lg px-2.5 py-1.5">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[11px] font-medium">
                                    {reply.authorDisplayName || reply.authorUsername}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {timeAgo(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-[12px] whitespace-pre-wrap leading-relaxed">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply input */}
                      <div className="flex gap-2 ml-2 mt-2">
                        <CornerDownRight size={12} className="text-primary mt-2 shrink-0" />
                        <div className="flex-1 flex gap-1.5 items-end bg-muted/30 rounded-lg px-2.5 py-1.5">
                          <textarea
                            value={replyText}
                            onChange={(e) =>
                              setReplyTextMap((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            placeholder={isZh ? "写回复..." : "Write a reply..."}
                            className="flex-1 bg-transparent text-[12px] resize-none border-none outline-none placeholder:text-muted-foreground/50 leading-relaxed"
                            rows={1}
                            maxLength={300}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleReply(post.id);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleReply(post.id)}
                            disabled={!replyText.trim() || submittingReply[post.id]}
                            className={cn(
                              "shrink-0 p-1 rounded-md transition-all",
                              replyText.trim()
                                ? "text-primary hover:bg-primary/10 pressable"
                                : "text-muted-foreground/30 cursor-not-allowed"
                            )}
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
