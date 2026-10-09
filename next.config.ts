import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Progress is per browser. Prerender cannot read the clock (due dates, streaks).
  cacheComponents: false,
  partialPrefetching: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
