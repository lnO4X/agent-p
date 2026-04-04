import type { Metadata } from "next";
import { getBlogPost, BLOG_POSTS } from "@/lib/blog-posts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.titleEn,
    description: post.descriptionEn,
    keywords: post.keywords,
    openGraph: {
      title: post.titleEn,
      description: post.descriptionEn,
      type: "article",
      publishedTime: post.date,
      authors: ["GameTan"],
      images: [
        {
          url: "/api/home-card",
          width: 1200,
          height: 630,
          alt: post.titleEn,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.titleEn,
      description: post.descriptionEn,
    },
    alternates: {
      canonical: `https://gametan.ai/blog/${slug}`,
    },
    robots: { index: true, follow: true },
  };
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
