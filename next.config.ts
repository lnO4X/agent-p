import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/challenge",
        destination: "/quiz",
        permanent: true,
      },
      {
        source: "/challenge/:path*",
        destination: "/quiz",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
