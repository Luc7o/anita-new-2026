import type { NextConfig } from "next";

// Mientras dure la migración, esta app atiende el dominio de la tienda y todo lo
// que todavía no tiene página aquí (carrito, checkout, cuenta, admin...) se sirve
// desde la tienda actual (SPA de Vite) por detrás, en el mismo dominio. Así comparten
// localStorage y cookies: el carrito de invitado y la sesión siguen funcionando.
const SPA = process.env.SPA_ORIGEN?.replace(/\/$/, "");

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    if (!SPA) return [];
    return { beforeFiles: [], afterFiles: [], fallback: [{ source: "/:ruta*", destination: `${SPA}/:ruta*` }] };
  },
};

export default config;
