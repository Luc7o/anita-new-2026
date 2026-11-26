"use client";

import { useEffect, useRef, useState } from "react";
import { FormIngresar } from "@/app/(acceso)/ingresar/FormIngresar";
import { FormOlvide } from "@/app/(acceso)/olvide-password/FormOlvide";
import { FormRegistro } from "@/app/(acceso)/registro/FormRegistro";
import { IconoAtras, IconoFlecha } from "@/componentes/Iconos";
import { BOTON_PANEL, MarcoAcceso, PanelTexto } from "./MarcoAcceso";

// Ingresar, crear cuenta y recuperar contraseña en la misma tarjeta. Al cambiar, el panel
// negro se desliza como una hoja de un lado al otro (y el formulario en sentido contrario);
// sus textos van dentro y se corren con él. El formulario se cambia a mitad del recorrido,
// tapado por el panel. Nunca hay dos formularios en la página a la vez. La dirección cambia
// sin recargar (/ingresar, /registro, /olvide-password) y el botón Atrás del navegador vuelve
// al anterior.
//
// Al ingresar el panel está a la derecha; al crear cuenta o recuperar la contraseña, a la
// izquierda.

export type ModoAcceso = "ingresar" | "registro" | "olvide";
type ModoIzquierdo = Exclude<ModoAcceso, "ingresar">;

const RUTA: Record<ModoAcceso, string> = { ingresar: "/ingresar", registro: "/registro", olvide: "/olvide-password" };
const TITULO: Record<ModoAcceso, string> = { ingresar: "Ingresar", registro: "Crear cuenta", olvide: "Recuperar contraseña" };
const TITULO_H1: Record<ModoAcceso, string> = { ingresar: "Iniciar sesión", registro: "Crear una cuenta", olvide: "Recuperar contraseña" };
const MITAD_MS = 450; // la mitad del deslizamiento (900 ms en MarcoAcceso)

function modoDeRuta(ruta: string): ModoAcceso {
  if (ruta.startsWith("/registro")) return "registro";
  if (ruta.startsWith("/olvide-password")) return "olvide";
  return "ingresar";
}

export function TarjetaAcceso({ inicial, redes }: { inicial: ModoAcceso; redes?: React.ReactNode }) {
  // modo: hacia dónde va el panel. mostrado: qué contenido se ve (cambia a mitad del recorrido).
  const [modo, setModo] = useState<ModoAcceso>(inicial);
  const [mostrado, setMostrado] = useState<ModoAcceso>(inicial);
  // Qué texto lleva la hoja en su cara izquierda (crear cuenta o recuperar). Cambia al salir
  // hacia ese lado, cuando esa cara todavía está oculta.
  const [izquierdo, setIzquierdo] = useState<ModoIzquierdo>(inicial === "olvide" ? "olvide" : "registro");
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  const ir = (destino: ModoAcceso, desdeHistorial = false) => {
    if (destino === modo) return;
    if (destino !== "ingresar") setIzquierdo(destino);
    setModo(destino);
    if (!desdeHistorial) history.pushState(null, "", RUTA[destino] + location.search);
    document.title = `${TITULO[destino]} · Anita New Style`;
    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // De crear cuenta a recuperar (o al revés) el panel no se mueve: el cambio es directo.
    const sinRecorrido = modo !== "ingresar" && destino !== "ingresar";
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setMostrado(destino), quieto || sinRecorrido ? 0 : MITAD_MS);
  };

  // Atrás/Adelante del navegador entre las tres direcciones.
  const irRef = useRef(ir);
  irRef.current = ir;
  useEffect(() => {
    const alVolver = () => irRef.current(modoDeRuta(location.pathname), true);
    addEventListener("popstate", alVolver);
    return () => {
      removeEventListener("popstate", alVolver);
      clearTimeout(temporizador.current);
    };
  }, []);

  // En escritorio el formulario se cambia escondido detrás del panel negro, a mitad del
  // recorrido: no hace falta fundido. En celular (sin deslizamiento) sí, uno corto.
  const fundidoCelular = `max-md:transition-opacity max-md:duration-300 ${modo !== mostrado ? "max-md:opacity-0" : "max-md:opacity-100"}`;

  const volverAIngresar = (
    <button type="button" onClick={() => ir("ingresar")} className={BOTON_PANEL}>
      <IconoAtras size={15} /> Iniciar sesión
    </button>
  );
  const textos: Record<ModoAcceso, React.ReactNode> = {
    registro: (
      <PanelTexto
        antetitulo="¿Ya eres clienta?"
        titulo={<>Qué bueno <em>verte</em></>}
        texto="Entra con tu correo y contraseña para ver tus pedidos y comprar más rápido."
        accion={volverAIngresar}
      />
    ),
    olvide: (
      <PanelTexto
        antetitulo="¿La recordaste?"
        titulo={<>Te ayudamos a <em>volver</em></>}
        texto="Te enviamos un enlace a tu correo para que elijas una contraseña nueva en un minuto."
        accion={volverAIngresar}
      />
    ),
    ingresar: (
      <PanelTexto
        antetitulo="¿Primera vez aquí?"
        titulo={<>Hola, <em>bienvenida</em></>}
        texto="Crea tu cuenta solo con tu correo: sigue tus pedidos en tiempo real y guarda tus direcciones."
        accion={
          <button type="button" onClick={() => ir("registro")} className={BOTON_PANEL}>
            Crear cuenta <IconoFlecha size={15} />
          </button>
        }
      />
    ),
  };

  const formularios: Record<ModoAcceso, React.ReactNode> = {
    ingresar: <FormIngresar onOlvide={() => ir("olvide")} />,
    registro: <FormRegistro />,
    olvide: <FormOlvide onVolver={() => ir("ingresar")} />,
  };

  return (
    <MarcoAcceso
      titulo={TITULO_H1[mostrado]}
      panelIzquierda={modo !== "ingresar"}
      pie={redes}
      // Escritorio: la hoja negra lleva dos caras (izquierda = crear cuenta o recuperar).
      panelDoble={{ izquierda: textos[izquierdo], derecha: textos.ingresar }}
      panel={<div className={fundidoCelular}>{textos[mostrado]}</div>}
    >
      <div className={fundidoCelular}>{formularios[mostrado]}</div>
    </MarcoAcceso>
  );
}
