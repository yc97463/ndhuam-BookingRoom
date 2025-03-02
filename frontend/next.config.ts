import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true, // GitHub Pages 不支援 Next.js 圖片最佳化，必須關閉
  },
};

export default nextConfig;
