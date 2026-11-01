import React from "react";
import { Link } from "react-router-dom";

// Se muestra cuando la dirección no existe (antes quedaba la pantalla vacía).
export default function NoEncontrada() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-5xl font-semibold text-berry">404</p>
      <h1 className="mt-3 text-2xl font-semibold text-plum">No encontramos esa página</h1>
      <p className="mt-2 text-plum-soft">
        Puede que el enlace esté mal escrito o que la página ya no exista.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
        <Link to="/tienda" className="btn btn-secondary">Ver la tienda</Link>
      </div>
    </div>
  );
}
