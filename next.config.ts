import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignorer les erreurs TypeScript pendant le build (temporaire pour Next.js 16 bug)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
