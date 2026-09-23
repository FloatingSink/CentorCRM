import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*.asse.devtunnels.ms", "localhost:3000"],
    },
  },
  // Default bottom-left position overlaps the sidebar's language switcher.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
