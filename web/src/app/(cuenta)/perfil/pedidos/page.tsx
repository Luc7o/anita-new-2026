import type { Metadata } from "next";
import { ListaPedidos } from "@/componentes/cuenta/ListaPedidos";

export const metadata: Metadata = { title: "Mis pedidos" };

export default function PaginaPedidosCuenta() {
  return (
    <>
      <h2 className="mb-5 text-xl font-semibold text-plum">Pedidos</h2>
      <ListaPedidos />
    </>
  );
}
