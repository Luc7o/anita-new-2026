import EstadoVacio from "../components/EstadoVacio.jsx";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useFavoritos } from "../context/FavoritosContext.jsx";
import CuentaLayout from "../components/CuentaLayout.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { SkeletonProductGrid } from "../components/Skeleton.jsx";
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
        <SkeletonProductGrid cantidad={6} etiqueta="Cargando favoritos" />
      ) : productosVisibles.length === 0 ? (
        <EstadoVacio
          icono={IconHeart}
          titulo="Aún no tienes favoritos"
          texto="Toca el corazón en un producto para guardarlo aquí y encontrarlo después."
          enlace="/tienda"
          etiqueta="Explorar tienda"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {productosVisibles.map((producto, i) => (
            <ProductCard key={producto.id} producto={producto} indice={i} />
          ))}
        </div>
      )}
    </CuentaLayout>
  );
}
