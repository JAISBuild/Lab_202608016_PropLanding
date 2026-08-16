import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@proplanding/shared"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
