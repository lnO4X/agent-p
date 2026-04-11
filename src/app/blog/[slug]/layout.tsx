import type { Metadata } from "next";
import { getBlogPost, BLOG_POSTS } from "@/lib/blog-posts";

const baseUrl = "https://gametan.ai";

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
      canonical: `${baseUrl}/blog/${slug}`,
    },
    robots: { index: true, follow: true },
    other: {
      "article:published_time": post.date,
      "article:author": "GameTan",
      "article:section": "Esports Science",
    },
  };
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

function BlogArticleJsonLd({ slug }: { slug: string }) {
  const post = getBlogPost(slug);
  if (!post) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.titleEn,
    description: post.descriptionEn,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "GameTan", url: baseUrl },
    publisher: {
      "@type": "Organization",
      name: "GameTan",
      url: baseUrl,
      logo: { "@type": "ImageObject", url: `${baseUrl}/icons/icon-512.png` },
    },
    mainEntityOfPage: `${baseUrl}/blog/${slug}`,
    image: `${baseUrl}/api/home-card`,
    keywords: post.keywords.join(", "),
    inLanguage: ["en", "zh"],
    isAccessibleForFree: true,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <BlogArticleJsonLd slug={slug} />
      {children}
    </>
  );
}
