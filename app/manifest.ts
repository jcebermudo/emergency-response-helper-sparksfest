import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "L.I.G.T.A.S. — Disaster Response Hub",
    short_name: "LIGTAS",
    description:
      "Logistics Integration & Geo-Targeted Allocation System. Real-time disaster resource coordination for Filipino communities.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#dc2626",
    orientation: "portrait-primary",
    categories: ["utilities", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Report a Need",
        url: "/report",
        description: "Submit a new resource request",
      },
      {
        name: "Dashboard",
        url: "/dashboard",
        description: "View and manage active reports",
      },
    ],
  };
}
