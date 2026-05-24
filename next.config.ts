import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Standalone build mažesniam Docker image (Faze 9 diegimui ARM serveryje)
  output: "standalone",
  images: {
    // TMDB plakatu CDN (Faze 4). Veliau prisidesim IGDB ir kt.
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
    ],
  },
};

export default withNextIntl(nextConfig);
