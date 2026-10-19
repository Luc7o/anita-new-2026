import React, { useEffect, useRef, useState } from "react";
import { esNombreProvisional, nombreVisible } from "../utils/nombreUsuario.js";
import { Link } from "react-router-dom";
import { IconUser, IconChevronDown, IconPackage, IconLogout } from "./Icons.jsx";

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
        className="flex items-center gap-1.5 rounded-[10px] border border-white/25 px-3 py-2.5 text-white transition hover:bg-white/10"
        aria-label="Menú de usuario"
        aria-expanded={abierto}
      >
        <IconUser size={18} />
        <IconChevronDown size={12} className={`transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div className="panel absolute right-0 top-full mt-2 w-52 overflow-hidden py-1.5 shadow-pop">
          <div className="border-b border-plum/10 px-4 py-2">
            <p className="truncate text-sm font-medium text-plum">{nombreVisible(usuario)}</p>
            {!esNombreProvisional(usuario) && (
              <p className="truncate text-xs text-plum-soft">{usuario.email}</p>
            )}
          </div>

          <Link
            to="/perfil"
            onClick={cerrarYNavegar}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-plum hover:bg-ivory"
          >
            <IconUser size={16} /> Perfil
          </Link>
          <Link
            to="/perfil/pedidos"
            onClick={cerrarYNavegar}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-plum hover:bg-ivory"
          >
            <IconPackage size={16} /> Pedidos
          </Link>
          <button
            onClick={() => {
              cerrarYNavegar();
              onLogout();
            }}
            className="flex w-full items-center gap-2 border-t border-plum/10 px-4 py-2.5 text-left text-sm text-plum-soft hover:bg-ivory"
          >
            <IconLogout size={16} /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
