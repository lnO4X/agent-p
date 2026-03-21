import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/settings", "/me/", "/chat/", "/notifications"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
