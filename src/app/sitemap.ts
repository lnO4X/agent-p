import type { MetadataRoute } from "next";
import { getAllArchetypes } from "@/lib/archetype";
import { ARCHETYPE_SECTIONS } from "@/lib/archetype-content";
import { getAllGameQuizIds } from "@/lib/game-quizzes";
import { PERSONALITY_CODES } from "@/lib/personality-types";
import { BLOG_POSTS } from "@/lib/blog-posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";
  const archetypes = getAllArchetypes();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/quiz`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/quiz/questions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/archetype`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/archetype/compatibility`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/pk`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // 16 archetype overview pages
  const archetypePages: MetadataRoute.Sitemap = archetypes.map((a) => ({
    url: `${baseUrl}/archetype/${a.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // 16 archetypes × 4 sections = 64 content pages
  const archetypeSectionPages: MetadataRoute.Sitemap = archetypes.flatMap((a) =>
    ARCHETYPE_SECTIONS.map((section) => ({
      url: `${baseUrl}/archetype/${a.id}/${section}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  );

  // Game-specific quiz pages (3 games)
  const gameQuizPages: MetadataRoute.Sitemap = getAllGameQuizIds().map((gameId) => ({
    url: `${baseUrl}/quiz/${gameId}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // 16 personality index pages (one per archetype)
  const personalityIndexPages: MetadataRoute.Sitemap = archetypes.map((a) => ({
    url: `${baseUrl}/archetype/${a.id}/personality`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // 256 personality × archetype combo pages
  const personalityComboPages: MetadataRoute.Sitemap = archetypes.flatMap((a) =>
    PERSONALITY_CODES.map((code) => ({
      url: `${baseUrl}/archetype/${a.id}/personality/${code.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  );

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    ...BLOG_POSTS.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [
    ...staticPages,
    ...blogPages,
    ...gameQuizPages,
    ...archetypePages,
    ...archetypeSectionPages,
    ...personalityIndexPages,
    ...personalityComboPages,
  ];
}
