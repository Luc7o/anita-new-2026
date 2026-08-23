import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const FavoritosContext = createContext(null);

export function FavoritosProvider({ children }) {
  const { usuario } = useAuth();
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
      } catch {
        setIds((prev) => [...prev, productoId]);
      }
    } else {
      setIds((prev) => [...prev, productoId]);
      try {
        await api.agregarFavorito(productoId);
      } catch {
        setIds((prev) => prev.filter((id) => id !== productoId));
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
