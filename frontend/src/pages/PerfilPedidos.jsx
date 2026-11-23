import React from "react";
import CuentaLayout from "../components/CuentaLayout.jsx";
import ListaPedidos from "../components/ListaPedidos.jsx";
import { useMetadatos } from "../hooks/useMetadatos";

export default function PerfilPedidos() {
  useMetadatos({ titulo: "Mis pedidos", noIndexar: true });
  return (
    <CuentaLayout>
      <h2 className="mb-5 text-xl font-semibold text-plum">Pedidos</h2>
      <ListaPedidos pedidosBase="/pedidos" />
    </CuentaLayout>
  );
}
