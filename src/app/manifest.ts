import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vestra: educação financeira sem enrolação",
    short_name: "Vestra",
    description:
      "Simulador de investimentos com dinheiro fictício e preços reais da B3 e da bolsa americana.",
    start_url: "/simulador",
    id: "/simulador",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f2d44",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
