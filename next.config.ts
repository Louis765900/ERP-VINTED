import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/adapter-neon', '@neondatabase/serverless', 'ws'],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
