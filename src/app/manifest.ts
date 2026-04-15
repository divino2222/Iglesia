import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Comunidad VID",
    short_name: "Comunidad VID",
    description:
      "App oficial de Comunidad VID para transmisiones, eventos, oración y vida de iglesia.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f6f2",
    theme_color: "#111111",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}