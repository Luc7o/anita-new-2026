// Íconos de línea (trazos de Lucide), sin librería.
import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function Icono({ size = 18, children, ...resto }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...resto}
    >
      {children}
    </svg>
  );
}

export const IconoCamion = (p: Props) => (
  <Icono {...p}>
    <path d="M3 7h11v9H3z" />
    <path d="M14 10h4l3 3v3h-7z" />
    <circle cx="7.5" cy="18" r="1.6" />
    <circle cx="17.5" cy="18" r="1.6" />
  </Icono>
);

export const IconoEtiqueta = (p: Props) => (
  <Icono {...p}>
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
    <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
  </Icono>
);

export const IconoCarrito = (p: Props) => (
  <Icono {...p}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </Icono>
);

export const IconoTienda = (p: Props) => (
  <Icono {...p}>
    <path d="M3 9l1.5-5h15L21 9" />
    <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" />
    <path d="M9 20v-6h6v6" />
  </Icono>
);

export const IconoWhatsApp = (p: Props) => (
  <Icono {...p}>
    <path d="M4 20.5 5.3 16A8.4 8.4 0 1 1 8.6 19l-4.6 1.5Z" />
    <path
      d="M8.7 8.7c-.2.9.1 2 .9 3.1 1 1.4 2.2 2.4 3.6 3 1 .4 1.9.3 2.4-.5l.4-.7c.2-.3 0-.7-.3-.9l-1.5-.9c-.3-.2-.6-.1-.8.1l-.4.5c-.7-.3-1.5-.9-2.1-1.7-.5-.7-.8-1.4-.9-2l.5-.4c.2-.2.3-.5.2-.8l-.8-1.6c-.1-.3-.5-.5-.8-.3l-.4.2Z"
      fill="currentColor"
      stroke="none"
    />
  </Icono>
);

export const IconoIzquierda = (p: Props) => (
  <Icono {...p}>
    <path d="m15 18-6-6 6-6" />
  </Icono>
);

export const IconoDerecha = (p: Props) => (
  <Icono {...p}>
    <path d="m9 18 6-6-6-6" />
  </Icono>
);

export const IconoFlecha = (p: Props) => (
  <Icono {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Icono>
);

// ---- Pantallas de acceso ----

export const IconoOjo = (p: Props) => (
  <Icono {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Icono>
);

export const IconoOjoTachado = (p: Props) => (
  <Icono {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a13.6 13.6 0 0 1-3.1 3.9M6.3 6.9C4 8.6 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.6-1.1" />
    <path d="M9.5 9.8A3 3 0 0 0 12 15a3 3 0 0 0 2.2-1" />
  </Icono>
);

export const IconoCorreo = (p: Props) => (
  <Icono {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </Icono>
);

export const IconoAtras = (p: Props) => (
  <Icono {...p}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </Icono>
);

export const IconoCirculoCheck = (p: Props) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </Icono>
);

export const IconoCheck = (p: Props) => (
  <Icono {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icono>
);

export const IconoFacebook = (p: Props) => (
  <Icono {...p}>
    <path d="M14 9V6.5a1.5 1.5 0 0 1 1.5-1.5H17V2h-2.5A4.5 4.5 0 0 0 10 6.5V9H7v3h3v10h4V12h3l1-3h-4Z" />
  </Icono>
);

export const IconoInstagram = (p: Props) => (
  <Icono {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </Icono>
);

export const IconoTikTok = ({ size = 18, ...resto }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...resto}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

// ---- Mi cuenta ----

export const IconoUsuario = (p: Props) => (
  <Icono {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icono>
);

export const IconoPaquete = (p: Props) => (
  <Icono {...p}>
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
    <path d="M20 16.5V7.5a1.8 1.8 0 0 0-.9-1.6l-6.2-3.6a1.8 1.8 0 0 0-1.8 0L4.9 5.9A1.8 1.8 0 0 0 4 7.5v9a1.8 1.8 0 0 0 .9 1.6l6.2 3.6a1.8 1.8 0 0 0 1.8 0l6.2-3.6a1.8 1.8 0 0 0 .9-1.6Z" />
  </Icono>
);

export const IconoCorazon = ({ relleno = false, ...p }: Props & { relleno?: boolean }) => (
  <Icono {...p}>
    <path
      d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
      fill={relleno ? "currentColor" : "none"}
    />
  </Icono>
);

export const IconoAjustes = (p: Props) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </Icono>
);

export const IconoAyuda = (p: Props) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.3 9a2.7 2.7 0 1 1 3.9 2.4c-.8.5-1.2 1-1.2 1.9" />
    <circle cx="12" cy="17" r="0.3" fill="currentColor" stroke="none" />
  </Icono>
);

export const IconoSalir = (p: Props) => (
  <Icono {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </Icono>
);

export const IconoCopiar = (p: Props) => (
  <Icono {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icono>
);

export const IconoReloj = (p: Props) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Icono>
);
