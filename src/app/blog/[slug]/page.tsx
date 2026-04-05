import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getBlogPost, BLOG_POSTS } from "@/lib/blog-posts";
import { ShareButton } from "@/components/share-button";
import { ArrowLeft, Clock, Gamepad2 } from "lucide-react";

/**
 * Blog post page — SERVER COMPONENT for SEO.
 * All article content renders in server HTML so Google can index it.
 * Only the ShareButton is a client component (needs navigator API).
 */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // Server renders English by default (best for SEO/Google).
  // Client-side locale switching handled by i18n context on hydration.
  const sections = post.sectionsEn;
  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="max-w-2xl mx-auto px-5 py-8 w-full">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={14} />
          Blog
        </Link>

        {/* Article — server rendered for SEO */}
        <article className="space-y-6">
          <header className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight font-[family-name:var(--font-outfit)]">
              {post.titleEn}
            </h1>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {post.readTimeMin} min read
              </span>
              <span>{post.date}</span>
              <ShareButton
                url={`https://gametan.ai/blog/${slug}`}
                title={post.titleEn}
              />
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              {post.descriptionEn}
            </p>
          </header>

          {/* Content — ALL in server HTML */}
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

          {/* Related articles — internal linking for SEO */}
          {related.length > 0 && (
            <div className="border-t border-border pt-6 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Related Articles
              </h3>
              <div className="space-y-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="block text-sm text-primary hover:underline"
                  >
                    {r.titleEn}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="border-t border-border pt-8 text-center space-y-4">
            <p className="text-lg font-semibold font-[family-name:var(--font-outfit)]">
              Ready to test your talent?
            </p>
            <Link href="/quiz">
              <Button
                size="lg"
                className="h-12 px-10 text-base gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Gamepad2 size={18} />
                Free 3-Min Test
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              100% free · vs Pro Players · Instant results
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
