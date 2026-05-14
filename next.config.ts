import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  outputFileTracingRoot: __dirname,
  // 사진이 고정이고 적음(2개 방 × 4장 + 로고) → 최적화 파이프라인 우회.
  // /public 의 파일을 그대로 정적으로 서빙. Vercel CDN + 브라우저 캐싱만으로 충분.
  images: {
    unoptimized: true,
  },
  // /rooms/* 와 /flip-mark.png 에 immutable 캐시 헤더 부착
  async headers() {
    return [
      {
        source: "/rooms/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/flip-mark.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
