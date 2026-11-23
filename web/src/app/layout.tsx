import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "@fontsource/bodoni-moda/latin-500-italic.css";
import "@fontsource/bodoni-moda/latin-700.css";
import "@fontsource/spline-sans-mono/latin-500.css";
import "@fontsource/spline-sans-mono/latin-600.css";
import "./globals.css";
import { BannerPrivacidad } from "@/componentes/BannerPrivacidad";
import { AvisoAlCargar } from "@/componentes/AvisoAlCargar";
import { DESCRIPCION, MARCA, URL_TIENDA } from "@/lib/sitio";

export const metadata: Metadata = {
  metadataBase: new URL(URL_TIENDA),
  title: { default: `${MARCA} · Moda en Huancayo`, template: `%s · ${MARCA}` },
  description: DESCRIPCION,
  openGraph: { siteName: MARCA, locale: "es_PE", type: "website", images: ["/logo-anita-new-style.png"] },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Modo oscuro elegido con el botón de la tienda (misma clave que la SPA): se aplica antes
// de pintar para que no parpadee.
const temaAntesDePintar = `(function(){try{var t=localStorage.getItem("anita-tema");var o=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);if(o)document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function Raiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaAntesDePintar }} />
      </head>
      <body className="min-h-dvh bg-ivory text-plum antialiased">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-plum focus:px-4 focus:py-2 focus:text-ivory">
          Saltar al contenido
        </a>
        {/* Cabecera y pie los pone cada grupo: (tienda) los lleva, (acceso) no. */}
        {children}
        <BannerPrivacidad />
        <AvisoAlCargar />
      </body>
    </html>
  );
}
