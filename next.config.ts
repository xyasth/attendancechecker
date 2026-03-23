import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // 🔥 FORCE browser version of Human
    config.resolve.alias = {
      ...config.resolve.alias,

      // 🔥 THIS is the real fix
      '@tensorflow/tfjs-node': false,
    };

    return config;
  },
};

export default nextConfig;