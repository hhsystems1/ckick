import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Monaco Editor requires these for browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Optimize Monaco imports
  experimental: {
    optimizePackageImports: ['@monaco-editor/react']
  },
  // Turbopack config (empty since Monaco should work fine with defaults)
  turbopack: {}
};

export default nextConfig;
