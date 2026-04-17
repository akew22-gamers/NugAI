import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-blob.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'prisma'];
    }
    return config;
  },

  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
