import React from "react";
import ListaPedidos from "../components/ListaPedidos.jsx";

export default function Pedidos() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      <h1 className="mb-6 text-2xl font-semibold text-plum">Mis pedidos</h1>
      <ListaPedidos />
    </div>
  );
}
