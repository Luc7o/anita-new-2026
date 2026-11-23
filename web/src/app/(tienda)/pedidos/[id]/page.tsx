import type { Metadata } from "next";
import { ProveedorSesion } from "@/componentes/cuenta/Sesion";
import { CargandoPedido, VistaPedido } from "./VistaPedido";

export const metadata: Metadata = { title: "Detalle del pedido", robots: { index: false, follow: false } };

// El pedido se pide desde el navegador con la sesión: la página es la misma para todos.
export function generateStaticParams() {
  return [];
}

export default async function PaginaPedido({ params }: PageProps<"/pedidos/[id]">) {
  const { id } = await params;
  return (
    <ProveedorSesion cargando={<CargandoPedido />}>
      <VistaPedido id={id} />
    </ProveedorSesion>
  );
}
