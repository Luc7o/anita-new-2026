"use client";

import { useEffect } from "react";
import { ListaAvisos, tomarAvisosPendientes, useAvisos } from "@/componentes/Avisos";

// Muestra el aviso que dejó otra página antes de una recarga completa (p. ej. «Cerraste
// sesión» al salir desde Mi cuenta).
export function AvisoAlCargar() {
  const { avisos, avisar } = useAvisos();
  useEffect(() => {
    for (const a of tomarAvisosPendientes("ans_aviso_siguiente")) avisar(a.tipo, a.texto);
  }, [avisar]);
  return <ListaAvisos avisos={avisos} />;
}
