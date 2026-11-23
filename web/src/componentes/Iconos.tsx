// Íconos de línea (trazos de Lucide, los mismos que usa la tienda actual), sin librería.
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
