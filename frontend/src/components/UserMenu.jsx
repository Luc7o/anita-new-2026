import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IconUser, IconChevronDown, IconDashboard, IconPackage, IconLogout } from "./Icons.jsx";

export default function UserMenu({ usuario, onLogout }) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    function alHacerClickFuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alHacerClickFuera);
    return () => document.removeEventListener("mousedown", alHacerClickFuera);
  }, []);

  const cerrarYNavegar = () => setAbierto(false);

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-2 text-plum shadow-glass transition hover:bg-white"
        aria-label="Menú de usuario"
        aria-expanded={abierto}
      >
        <IconUser size={18} />
        <IconChevronDown size={12} className={`transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div className="glass-strong absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl py-1.5 shadow-glass-lg">
          <div className="border-b border-white/50 px-4 py-2">
            <p className="truncate text-sm font-medium text-plum">{usuario.nombre_completo}</p>
            <p className="truncate text-xs text-plum-soft">{usuario.email}</p>
          </div>

          <Link
            to="/perfil"
            onClick={cerrarYNavegar}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-plum hover:bg-white/60"
          >
            <IconUser size={16} /> Perfil
          </Link>
          <Link
            to="/perfil/pedidos"
            onClick={cerrarYNavegar}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-plum hover:bg-white/60"
          >
            <IconPackage size={16} /> Pedidos
          </Link>
          {usuario.es_admin && (
            <Link
              to="/admin"
              onClick={cerrarYNavegar}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-berry-dark hover:bg-white/60"
            >
              <IconDashboard size={16} /> Panel admin
            </Link>
          )}

          <button
            onClick={() => {
              cerrarYNavegar();
              onLogout();
            }}
            className="flex w-full items-center gap-2 border-t border-white/50 px-4 py-2.5 text-left text-sm text-plum-soft hover:bg-white/60"
          >
            <IconLogout size={16} /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
