import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/settings", "/me/", "/chat/"],
      },
      // Explicitly allow AI search crawlers
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Bytespider", allow: "/" },
      { userAgent: "GoogleOther", allow: "/" },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
