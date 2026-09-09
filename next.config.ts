import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*.asse.devtunnels.ms", "localhost:3000"],
    },
  },
};

export default nextConfig;
