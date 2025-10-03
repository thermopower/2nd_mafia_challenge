import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },
  // Turbopack 사용 시 webpack 설정은 무시됨
  // webpack: (config) => {
  //   config.externals = [...(config.externals || []), { canvas: 'canvas' }];
  //   return config;
  // },
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js'],
};

export default nextConfig;
