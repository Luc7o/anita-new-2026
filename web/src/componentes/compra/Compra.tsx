"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ListaAvisos, useAvisos, type TipoAviso } from "@/componentes/Avisos";
import { guardarSesion, pedir, recuperarSesion } from "@/lib/api";
import { guardarLineas, leerLineas, type Linea } from "@/lib/carritoInvitado";

// Sesión + carrito para /carrito y /checkout.
// (AuthContext + CarritoContext): sin sesión el carrito vive en el navegador y el
// servidor solo lo valida; con sesión, las líneas del navegador se fusionan a la
// cuenta y se limpian.

export type Usuario = { id: number; nombre: string | null; apellido: string | null; email: string; telefono?: string | null; es_invitado?: boolean };

export type ItemCarrito = {
  id: number | string;
  producto: { id: number; nombre: string; imagen_url: string | null; precio: number; precio_final: number; tiene_oferta: boolean };
  cantidad: number;
  talla: string | null;
  color: string | null;
  subtotal: number;
  problema?: string | null;
};

type Resumen = { items: ItemCarrito[]; total_items: number; total: number; descartados?: { key: string }[]; ajustes?: { mensaje: string }[] };

type Compra = {
  usuario: Usuario | null;
  listo: boolean;
  items: ItemCarrito[];
  totalItems: number;
  total: number;
  refrescar: () => Promise<Resumen>;
  cambiarCantidad: (itemId: ItemCarrito["id"], cantidad: number) => Promise<void>;
  quitar: (itemId: ItemCarrito["id"]) => Promise<void>;
  vaciarLocal: () => void;
  continuarComoInvitado: (email: string) => Promise<Usuario>;
  avisar: (tipo: TipoAviso, texto: string) => void;
};

const Contexto = createContext<Compra | null>(null);

export function useCompra() {
  const c = useContext(Contexto);
  if (!c) throw new Error("useCompra fuera de <ProveedorCompra>");
  return c;
}

const VACIO: Resumen = { items: [], total_items: 0, total: 0 };

export function ProveedorCompra({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [listo, setListo] = useState(false);
  const [resumen, setResumen] = useState<Resumen>(VACIO);
  const { avisos, avisar } = useAvisos();
  const usuarioRef = useRef<Usuario | null>(null);
  usuarioRef.current = usuario;
  const refrescoEnCurso = useRef<Promise<Resumen> | null>(null);

  // Carrito real de la cuenta; si quedaron líneas de invitado, se fusionan primero.
  // Llamadas simultáneas comparten la misma petición (las líneas nunca se fusionan dos veces).
  const refrescar = useCallback(() => {
    if (refrescoEnCurso.current) return refrescoEnCurso.current;
    const trabajo = (async () => {
      try {
        const lineas = leerLineas();
        let r: Resumen;
        if (lineas.length) {
          r = await pedir<Resumen>("/carrito/fusionar", { method: "POST", body: { items: lineas }, auth: true });
          guardarLineas([]);
        } else {
          r = await pedir<Resumen>("/carrito", { auth: true });
        }
        setResumen(r);
        return r;
      } finally {
        refrescoEnCurso.current = null;
      }
    })();
    refrescoEnCurso.current = trabajo;
    return trabajo;
  }, []);

  const hidratarInvitado = useCallback(async (lineas: Linea[]) => {
    if (!lineas.length) {
      setResumen(VACIO);
      return VACIO;
    }
    const r = await pedir<Resumen>("/carrito/invitado/validar", { method: "POST", body: { items: lineas } });
    if (r.descartados?.length) {
      const quitar = new Set(r.descartados.map((d) => d.key));
      guardarLineas(lineas.filter((l) => !quitar.has(l.key)));
    }
    setResumen(r);
    return r;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (await recuperarSesion()) {
          setUsuario(await pedir<Usuario>("/auth/perfil", { auth: true }));
          await refrescar();
        } else {
          await hidratarInvitado(leerLineas());
        }
      } catch {
        // Sin red o servidor caído: el carrito queda vacío en pantalla; las líneas siguen guardadas.
      } finally {
        setListo(true);
      }
    })();
  }, [refrescar, hidratarInvitado]);

  // Invitado: cada cambio se valida en el servidor ANTES de guardarse.
  const cambioInvitado = async (candidatas: Linea[], afectada: string | null) => {
    const r = await pedir<Resumen>("/carrito/invitado/validar", { method: "POST", body: { items: candidatas } });
    const item = afectada ? r.items.find((i) => i.id === afectada) : null;
    if (afectada && !item) throw new Error("Este producto ya no está disponible.");
    if (item?.problema) throw new Error(item.problema);
    guardarLineas(candidatas);
    setResumen(r);
  };

  const cambiarCantidad = async (itemId: ItemCarrito["id"], cantidad: number) => {
    if (usuarioRef.current) {
      setResumen(await pedir<Resumen>(`/carrito/${itemId}`, { method: "PUT", body: { cantidad }, auth: true }));
    } else if (cantidad <= 0) {
      await cambioInvitado(leerLineas().filter((l) => l.key !== itemId), null);
    } else {
      await cambioInvitado(leerLineas().map((l) => (l.key === itemId ? { ...l, cantidad } : l)), String(itemId));
    }
    if (cantidad <= 0) avisar("info", "Producto quitado del carrito");
  };

  const quitar = async (itemId: ItemCarrito["id"]) => {
    if (usuarioRef.current) {
      setResumen(await pedir<Resumen>(`/carrito/${itemId}`, { method: "DELETE", auth: true }));
    } else {
      await cambioInvitado(leerLineas().filter((l) => l.key !== itemId), null);
    }
    avisar("info", "Producto quitado del carrito");
  };

  const vaciarLocal = () => {
    guardarLineas([]);
    setResumen(VACIO);
  };

  // Compra sin cuenta: crea la cuenta solo con el correo (sin contraseña) y abre sesión.
  const continuarComoInvitado = async (email: string) => {
    const datos = await pedir<{ token: string; csrf?: string; usuario: Usuario }>("/auth/invitado", {
      method: "POST",
      body: { email, acepta_terminos: true },
    });
    guardarSesion(datos.token, datos.csrf);
    setUsuario(datos.usuario);
    return datos.usuario;
  };

  return (
    <Contexto.Provider
      value={{
        usuario,
        listo,
        items: resumen.items,
        totalItems: resumen.total_items,
        total: resumen.total,
        refrescar,
        cambiarCantidad,
        quitar,
        vaciarLocal,
        continuarComoInvitado,
        avisar,
      }}
    >
      {children}
      <ListaAvisos avisos={avisos} />
    </Contexto.Provider>
  );
}
