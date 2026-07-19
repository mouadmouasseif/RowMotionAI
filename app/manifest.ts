import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RowMotion AI",
    short_name: "RowMotion AI",
    description: "Analyse biomécanique intelligente pour l’aviron.",
    start_url: "/",
    display: "standalone",
    background_color: "#020b18",
    theme_color: "#020b18",
    icons: [
      { src: "/app-icon-dark.png", sizes: "164x167", type: "image/png" },
      { src: "/favicon-dark.png", sizes: "157x167", type: "image/png" },
    ],
  };
}
