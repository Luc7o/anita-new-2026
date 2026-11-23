import type { Metadata } from "next";
import { ProveedorCompra } from "@/componentes/compra/Compra";
import { VistaCheckout } from "@/componentes/compra/VistaCheckout";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };

export default function PaginaCheckout() {
  return (
    <ProveedorCompra>
      <VistaCheckout />
    </ProveedorCompra>
  );
}
