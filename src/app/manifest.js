export default function manifest() {
  return {
    name: "LightFeed",
    short_name: "LightFeed",
    description: "Privacy-first, self-hosted RSS news aggregation.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f2e7",
    theme_color: "#111114",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
