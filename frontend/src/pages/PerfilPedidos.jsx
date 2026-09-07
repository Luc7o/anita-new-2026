import React from "react";
import CuentaLayout from "../components/CuentaLayout.jsx";
import ListaPedidos from "../components/ListaPedidos.jsx";

export default function PerfilPedidos() {
  return (
    <CuentaLayout>
      <h2 className="mb-5 text-xl font-semibold text-plum">Pedidos</h2>
      <ListaPedidos pedidosBase="/pedidos" />
    </CuentaLayout>
  );
}
