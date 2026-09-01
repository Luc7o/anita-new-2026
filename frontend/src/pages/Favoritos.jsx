import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useFavoritos } from "../context/FavoritosContext.jsx";
import CuentaLayout from "../components/CuentaLayout.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { IconHeart } from "../components/Icons.jsx";

export default function Favoritos() {
  const { usuario } = useAuth();
  const favoritos = useFavoritos();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!usuario) {
      setCargando(false);
      return;
    }
    api
      .favoritos()
      .then(setProductos)
      .finally(() => setCargando(false));
  }, [usuario]);

  // Si el usuario quita un favorito desde la misma tarjeta, lo sacamos de
  // la lista al instante en vez de esperar a que recargue la página.
  const productosVisibles = productos.filter((p) => favoritos?.ids.includes(p.id));

  if (!usuario) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-plum-soft">
        Ingresa para ver tus favoritos.
        <div className="mt-4">
          <Link to="/ingresar" className="font-semibold text-berry-dark hover:underline">
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CuentaLayout>
      <h2 className="mb-5 text-xl font-semibold text-plum">Mis favoritos</h2>

      {cargando ? (
        <p className="text-plum-soft">Cargando favoritos...</p>
      ) : productosVisibles.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl p-10 text-center shadow-glass">
          <IconHeart size={28} className="text-berry-light" />
          <p className="text-plum-soft">Todavía no guardaste ningún producto como favorito.</p>
          <Link
            to="/tienda"
            className="mt-1 rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark"
          >
            Explorar tienda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {productosVisibles.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </CuentaLayout>
  );
}
