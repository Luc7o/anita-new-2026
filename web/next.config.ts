import type { NextConfig } from "next";

// El panel de administración vive en su propio dominio (frontend/, proyecto
// anita-new-2026-vcom). Los enlaces viejos a /admin/... de la tienda van allá.
const PANEL = (process.env.ADMIN_URL ?? "https://admin.anita-new-style.xyz").replace(/\/$/, "");

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/admin", destination: PANEL, permanent: false },
      { source: "/admin/:ruta*", destination: `${PANEL}/:ruta*`, permanent: false },
    ];
  },
};

export default config;
