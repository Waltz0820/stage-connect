import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
    // Multiple root layouts need a standalone document for a server-rendered 404.
    globalNotFound: true,
  },
  outputFileTracingRoot: path.join(__dirname, ".."),
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "react-router-dom": path.join(__dirname, "node_modules", "react-router-dom"),
    };

    return config;
  },
};

export default nextConfig;
