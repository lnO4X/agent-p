import type { NextConfig } from "next";

const nextConfig = {
  output: "standalone",
  experimental: {
    nodeMiddleware: true,
  },
} satisfies NextConfig & { experimental: { nodeMiddleware?: boolean } };

export default nextConfig;
