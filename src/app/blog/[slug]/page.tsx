"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";
import { getBlogPost } from "@/lib/blog-posts";
import { ArrowLeft, Clock, Gamepad2, Share2 } from "lucide-react";
import { useCallback, useState } from "react";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const post = getBlogPost(slug);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (!post) return;
    const url = `https://gametan.ai/blog/${slug}`;
    const text = isZh ? post.titleZh : post.titleEn;
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
        return;
      } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (typeof window !== "undefined") {
        alert(isZh ? "复制失败" : "Copy failed");
      }
    }
  }, [post, slug, isZh]);

  if (!post) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <p className="text-muted-foreground mb-4">
          {isZh ? "文章未找到" : "Post not found"}
        </p>
        <Link href="/blog">
          <Button variant="outline">{isZh ? "返回博客" : "Back to Blog"}</Button>
        </Link>
      </div>
    );
  }

  const sections = isZh ? post.sectionsZh : post.sectionsEn;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="max-w-2xl mx-auto px-5 py-8 w-full">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={14} />
          {isZh ? "博客" : "Blog"}
        </Link>

        {/* Header */}
        <article className="space-y-6">
          <header className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight font-[family-name:var(--font-outfit)]">
              {isZh ? post.titleZh : post.titleEn}
            </h1>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {post.readTimeMin} {isZh ? "分钟阅读" : "min read"}
              </span>
              <span>{post.date}</span>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Share2 size={12} />
                {copied ? (isZh ? "已复制" : "Copied") : (isZh ? "分享" : "Share")}
              </button>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              {isZh ? post.descriptionZh : post.descriptionEn}
            </p>
          </header>

          {/* Content */}
          <div className="space-y-8">
            {sections.map((section, i) => (
              <section key={i} className="space-y-3">
                <h2 className="text-xl font-semibold font-[family-name:var(--font-outfit)]">
                  {section.heading}
                </h2>
                <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
                  {section.body.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                    j % 2 === 1 ? (
                      <strong key={j} className="text-foreground font-medium">
                        {part}
                      </strong>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="border-t border-border pt-8 text-center space-y-4">
            <p className="text-lg font-semibold font-[family-name:var(--font-outfit)]">
              {isZh ? "准备好测试了吗？" : "Ready to test your talent?"}
            </p>
            <Link href="/quiz">
              <Button
                size="lg"
                className="h-12 px-10 text-base gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Gamepad2 size={18} />
                {isZh ? "3 分钟免费测试" : "Free 3-Min Test"}
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              {isZh ? "完全免费 · 对比职业选手 · 即时出结果" : "100% free · vs Pro Players · Instant results"}
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
