import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "*.ytimg.com" },
      { protocol: "https", hostname: "*.tiktokcdn.com" },
    ],
  },
};

export default nextConfig;
