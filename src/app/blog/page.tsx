"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { BookOpen, Clock, ArrowRight } from "lucide-react";

export default function BlogPage() {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="max-w-2xl mx-auto px-5 py-12 w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)]">
            {t("blog.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("blog.subtitle")}
          </p>
        </div>

        <div className="space-y-4">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="card-hover border-border hover:border-primary/30 transition-colors">
                <CardContent className="pt-5 pb-5 space-y-2">
                  <h2 className="text-lg font-semibold leading-tight">
                    {isZh ? post.titleZh : post.titleEn}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {isZh ? post.descriptionZh : post.descriptionEn}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground/70 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.readTimeMin} {t("blog.minRead")}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {post.sectionsEn.length} {t("blog.sections")}
                    </span>
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary text-xs font-medium pt-1">
                    {t("blog.readMore")}
                    <ArrowRight size={12} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
