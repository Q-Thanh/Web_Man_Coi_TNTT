import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  env: {
    NEXTAUTH_SECRET: 'man-coi-secret-key-2024-secure-prod-token',
  },
  turbopack: {},
};

export default nextConfig;
