import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow OAuth provider avatars, incl. Google
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" }, // (optional) GitHub
      { protocol: "https", hostname: "pbs.twimg.com" },                 // (optional) X/Twitter
    ],
  },
  // (keep any other options you already had here)
};

export default nextConfig;
