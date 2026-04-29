import type { NextConfig } from "next";

// Changing type to 'any' stops the 'eslint does not exist' error
const nextConfig: any = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;