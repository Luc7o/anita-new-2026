import type { Metadata } from "next";
import { ListaPedidos } from "@/componentes/cuenta/ListaPedidos";

export const metadata: Metadata = { title: "Mis pedidos" };

export default function PaginaPedidosCuenta() {
  return (
    <>
      <h2 className="mb-4 font-display text-3xl text-plum">Pedidos</h2>
      <ListaPedidos />
    </>
  );
}
