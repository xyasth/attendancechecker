import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const nextConfig: NextConfig = {
  webpack: (config: Configuration) => {
    // Force @vladmandic/human to always use browser ESM build
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@vladmandic/human/dist/human.node.js":
        "@vladmandic/human/dist/human.esm.js",
    };
    return config;
  },
};

export default nextConfig;
