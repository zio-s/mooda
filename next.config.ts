import type { NextConfig } from 'next';
import { OPTIMIZED_IMAGE_HOSTS } from './src/lib/imageHosts';

const nextConfig: NextConfig = {
  output: 'standalone',
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
    },
  },
  images: {
    // 최적화는 비중 큰 호스트만 — 나머지 카페 사진은 컴포넌트에서 unoptimized 처리 (src/lib/imageHosts.ts)
    remotePatterns: OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({ protocol: 'https' as const, hostname })),
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'mooda-one.vercel.app'],
    },
  },
};

export default nextConfig;
