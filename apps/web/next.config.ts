import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@geo-monitor/shared-types"],
};

export default nextConfig;
