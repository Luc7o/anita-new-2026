import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const { usuario } = useAuth();
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [total, setTotal] = useState(0);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);

  const aplicarResumen = (resumen) => {
    setItems(resumen.items || []);
    setTotalItems(resumen.total_items || 0);
    setTotal(resumen.total || 0);
  };

  const refrescar = useCallback(async () => {
    if (!usuario) return;
    setCargando(true);
    try {
      const resumen = await api.verCarrito();
      aplicarResumen(resumen);
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  const agregar = async (productoId, opciones = {}) => {
    const resumen = await api.agregarAlCarrito({
      producto_id: productoId,
      cantidad: opciones.cantidad || 1,
      talla: opciones.talla || null,
      color: opciones.color || null,
    });
    aplicarResumen(resumen);
    setDrawerAbierto(true);
  };

  const actualizarCantidad = async (itemId, cantidad) => {
    const resumen = await api.actualizarItemCarrito(itemId, { cantidad });
    aplicarResumen(resumen);
  };

  const eliminar = async (itemId) => {
    const resumen = await api.eliminarItemCarrito(itemId);
    aplicarResumen(resumen);
  };

  const vaciarLocal = () => aplicarResumen({ items: [], total_items: 0, total: 0 });

  return (
    <CarritoContext.Provider
      value={{
        items,
        totalItems,
        total,
        cargando,
        drawerAbierto,
        setDrawerAbierto,
        refrescar,
        agregar,
        actualizarCantidad,
        eliminar,
        vaciarLocal,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  return useContext(CarritoContext);
}
