import type { Metadata } from "next";
import { ProveedorSesion } from "@/componentes/cuenta/Sesion";
import { ListaPedidos } from "@/componentes/cuenta/ListaPedidos";

export const metadata: Metadata = { title: "Mis pedidos", robots: { index: false, follow: false } };

export default function PaginaPedidos() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8">
      <h1 className="mb-6 text-2xl font-semibold text-plum">Mis pedidos</h1>
      <ProveedorSesion cargando={<div role="status" aria-label="Cargando" className="skeleton h-40 rounded-2xl" />}>
        <ListaPedidos />
      </ProveedorSesion>
    </div>
  );
}
