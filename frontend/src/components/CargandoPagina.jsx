import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api/client.js";

// Último logo conocido. Se recuerda entre una pantalla de carga y la siguiente
// para que, al navegar, no se vea un parpadeo de la "A" antes del logo real.
let ultimoLogo = "";

/**
 * Pantalla de espera mientras baja el código de una página (carga bajo demanda).
 * Antes era una caja vacía: con internet lento el cliente veía todo en blanco.
 * Muestra el logo que se subió en Configuración; si no hay, el logo oficial de Anita New Style.
 */
export default function CargandoPagina() {
  const [logo, setLogo] = useState(ultimoLogo);
  // Si la página llega en menos de ~150 ms ni se muestra: evita el destello
  // de la pantalla de carga cada vez que se cambia de página.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let vivo = true;
    api
      .configuracionTienda()
      .then((c) => {
        ultimoLogo = c.logo_url || "";
        if (vivo) setLogo(ultimoLogo);
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  // Pantalla completa: el logo y la barra quedan siempre en el centro exacto
  // de la ventana, sin importar el alto de la página que se está cargando.
  // Se dibuja con un portal directo en <body>: la animación de entrada de las
  // páginas usa "transform", y dentro de ella un elemento fixed se encogía al
  // tamaño del contenido (se veía como una caja gris a mitad de la pantalla).
  if (!visible) return null;
  return createPortal(
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-[#f7f5f5]"
    >
      <img
        src={logo || "/logo-anita-new-style.png"}
        alt=""
        aria-hidden="true"
        className="animate-latido h-32 w-32 rounded-[28px] object-contain shadow-lg sm:h-40 sm:w-40"
      />
      <span aria-hidden="true" className="block h-1.5 w-64 max-w-[70vw] overflow-hidden rounded-full bg-plum/10">
        <span className="animate-barra block h-1.5 w-24 rounded-full bg-berry" />
      </span>
      <span className="sr-only">Cargando…</span>
    </div>,
    document.body
  );
}
