import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeuroCare — Monitoring & Recovery Support",
    short_name: "NeuroCare",
    description:
      "PWA edukasi dan monitoring untuk membantu pencatatan faktor risiko, tindak lanjut kesehatan, dan aktivitas pemulihan pascastroke.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F8F2",
    theme_color: "#243746",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/neurocare-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/neurocare-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
