import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "../out",
  images: {
    unoptimized: true, // GitHub Pages 不支援 Next.js 圖片最佳化，必須關閉
  },
  async exportPathMap() {
    return {
      "/": { page: "/" }, // 你的主頁
      // 不要包含 /api/xxx
    };
  },
};

export default nextConfig;
