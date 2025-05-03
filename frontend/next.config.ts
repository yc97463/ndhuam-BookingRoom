import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';
console.log('💡 NEXT CONFIG ENV', process.env.NODE_ENV, 'rewrites enabled?', isDev);


const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // GitHub Pages 不支援 Next.js 圖片最佳化，必須關閉
  },
  async rewrites() {
    return isDev
      ? [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8788/api/:path*'
        }
      ]
      : [];
  }
};

export default nextConfig;
