import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hanlu",
    short_name: "Hanlu",
    description: "Learn Chinese, one step at a time.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F3EC",
    theme_color: "#E25B45",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
