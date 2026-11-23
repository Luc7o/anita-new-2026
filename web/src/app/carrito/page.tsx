import type { Metadata } from "next";
import { ProveedorCompra } from "@/componentes/compra/Compra";
import { VistaCarrito } from "@/componentes/compra/VistaCarrito";

export const metadata: Metadata = { title: "Tu carrito", robots: { index: false, follow: false } };

export default function PaginaCarrito() {
  return (
    <ProveedorCompra>
      <VistaCarrito />
    </ProveedorCompra>
  );
}
