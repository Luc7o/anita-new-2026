import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";

const FavoritosContext = createContext(null);

export function FavoritosProvider({ children }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const [ids, setIds] = useState([]);

  const refrescar = useCallback(async () => {
    if (!usuario) {
      setIds([]);
      return;
    }
    try {
      const lista = await api.favoritosIds();
      setIds(lista);
    } catch {
      // Si falla, no rompemos la navegación — los corazones simplemente
      // se ven vacíos hasta el próximo refresco.
    }
  }, [usuario]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const esFavorito = (productoId) => ids.includes(productoId);

  const alternar = async (productoId) => {
    if (esFavorito(productoId)) {
      setIds((prev) => prev.filter((id) => id !== productoId));
      try {
        await api.quitarFavorito(productoId);
        toast.info("Quitado de tus favoritos");
      } catch {
        setIds((prev) => [...prev, productoId]);
        toast.error("No se pudo quitar de tus favoritos");
      }
    } else {
      setIds((prev) => [...prev, productoId]);
      try {
        await api.agregarFavorito(productoId);
        toast.success("Guardado en tus favoritos");
      } catch {
        setIds((prev) => prev.filter((id) => id !== productoId));
        toast.error("No se pudo guardar en tus favoritos");
      }
    }
  };

  return (
    <FavoritosContext.Provider value={{ ids, esFavorito, alternar, refrescar }}>
      {children}
    </FavoritosContext.Provider>
  );
}

export function useFavoritos() {
  return useContext(FavoritosContext);
}
