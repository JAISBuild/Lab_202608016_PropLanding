import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@proplanding/shared"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: "localhost", port: "4000" },
    ],
  },
};

export default nextConfig;
