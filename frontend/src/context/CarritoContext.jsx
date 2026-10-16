import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const CarritoContext = createContext(null);

// ---------------------------------------------------------------------------
// Carrito de INVITADO (sin cuenta)
//
// Mientras la persona no ha iniciado sesión, su carrito vive en el navegador
// (localStorage) como una lista de líneas {key, producto_id, cantidad, talla,
// color}. Nunca guardamos precios ni nombres ahí: cada vez que se muestra, el
// servidor valida las líneas y devuelve los datos reales (precio vigente,
// stock). Al registrarse o iniciar sesión, esas líneas se fusionan al carrito
// real de la cuenta y el localStorage se limpia.
// ---------------------------------------------------------------------------
const CLAVE_CARRITO = "ans_carrito_invitado";

const nuevaClave = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function leerLineas() {
  try {
    const crudo = localStorage.getItem(CLAVE_CARRITO);
    const lineas = crudo ? JSON.parse(crudo) : [];
    if (!Array.isArray(lineas)) return [];
    return lineas.filter(
      (l) => l && typeof l.key === "string" && Number.isInteger(l.producto_id) && l.cantidad > 0
    );
  } catch {
    return [];
  }
}

function guardarLineas(lineas) {
  try {
    if (lineas.length > 0) localStorage.setItem(CLAVE_CARRITO, JSON.stringify(lineas));
    else localStorage.removeItem(CLAVE_CARRITO);
  } catch {
    // localStorage no disponible (modo privado estricto): el carrito sigue
    // funcionando en esta pestaña, solo que no sobrevive a recargar.
  }
}

const mismaLinea = (a, b) =>
  a.producto_id === b.producto_id && (a.talla || null) === (b.talla || null) && (a.color || null) === (b.color || null);

export function CarritoProvider({ children }) {
  const { usuario, cargando: cargandoAuth } = useAuth();
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [total, setTotal] = useState(0);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  // Falso hasta que termina la PRIMERA carga del carrito (de la cuenta o del
  // navegador). Evita que, al abrir la página, se vea un instante "tu carrito
  // está vacío" antes de que lleguen los productos: mientras tanto se muestra
  // el skeleton.
  const [listo, setListo] = useState(false);

  // Si usuario cambia a null (cerró sesión) o llega un login mientras hay una
  // fusión en curso, hay que saber cuál es el estado actual dentro de funciones
  // async sin depender de un closure viejo.
  const usuarioRef = useRef(usuario);
  usuarioRef.current = usuario;
  const refrescoEnCurso = useRef(null);

  const aplicarResumen = (resumen) => {
    setItems(resumen.items || []);
    setTotalItems(resumen.total_items || 0);
    setTotal(resumen.total || 0);
  };

  // Pide al servidor los datos reales de las líneas locales y los muestra.
  // Las líneas que el servidor descarta (producto eliminado, etc.) se quitan.
  const hidratarLocal = useCallback(async (lineas) => {
    if (lineas.length === 0) {
      aplicarResumen({ items: [], total_items: 0, total: 0 });
      return null;
    }
    setCargando(true);
    let resumen;
    try {
      resumen = await api.validarCarritoInvitado(lineas);
    } finally {
      setCargando(false);
    }
    if (usuarioRef.current) return resumen; // inició sesión mientras tanto: ya no aplica
    if (resumen.descartados?.length) {
      const quitar = new Set(resumen.descartados.map((d) => d.key));
      guardarLineas(lineas.filter((l) => !quitar.has(l.key)));
    }
    aplicarResumen(resumen);
    return resumen;
  }, []);

  // Cuando termina de saberse que NO hay sesión (o se cierra la sesión), el
  // carrito pasa a modo invitado y muestra lo que haya en el navegador.
  useEffect(() => {
    if (cargandoAuth || usuario) return;
    hidratarLocal(leerLineas())
      .catch(() => {
        // Sin red o servidor caído: dejamos el carrito vacío en pantalla; las
        // líneas siguen guardadas y se reintenta en la próxima acción.
      })
      .finally(() => setListo(true));
  }, [cargandoAuth, usuario, hidratarLocal]);

  // Carga el carrito real de la cuenta. Si quedaron líneas de invitado en el
  // navegador (la persona armó el carrito antes de registrarse), las fusiona
  // primero y limpia el localStorage. Devuelve el resumen resultante.
  //
  // Es seguro llamarla varias veces a la vez (App.jsx la llama al cambiar el
  // usuario y el Checkout la llama justo después de registrar): comparten la
  // misma petición en curso, así las líneas nunca se fusionan dos veces.
  const refrescar = useCallback(() => {
    if (refrescoEnCurso.current) return refrescoEnCurso.current;

    const trabajo = (async () => {
      setCargando(true);
      try {
        const lineas = leerLineas();
        let resumen;
        if (lineas.length > 0) {
          resumen = await api.fusionarCarrito(lineas);
          guardarLineas([]); // ya están en la cuenta; si no se limpiara se duplicarían
        } else {
          resumen = await api.verCarrito();
        }
        aplicarResumen(resumen);
        return resumen;
      } finally {
        setCargando(false);
        setListo(true);
        refrescoEnCurso.current = null;
      }
    })();

    refrescoEnCurso.current = trabajo;
    return trabajo;
  }, []);

  // --- Modo invitado: agregar / cambiar cantidad / quitar ---------------------
  // Cada cambio se valida contra el servidor ANTES de guardarse: si no hay
  // stock, se lanza el error (el componente lo muestra) y el carrito no cambia.
  const aplicarCambioInvitado = async (candidatas, claveAfectada) => {
    const resumen = await api.validarCarritoInvitado(candidatas);
    const afectada = claveAfectada && resumen.items.find((i) => i.id === claveAfectada);
    if (claveAfectada && !afectada) {
      throw new Error("Este producto ya no está disponible.");
    }
    if (afectada?.problema) throw new Error(afectada.problema);

    guardarLineas(candidatas);
    aplicarResumen(resumen);
  };

  // opciones.abrirCarrito (por defecto true): abre el drawer al agregar. El
  // "agregar rápido" de las tarjetas lo manda en false: ahí el feedback es el
  // botón ("¡Agregado!") y el contador del navbar, sin tapar la pantalla.
  const agregar = async (productoId, opciones = {}) => {
    const cantidad = opciones.cantidad || 1;
    const abrirCarrito = opciones.abrirCarrito !== false;

    if (usuarioRef.current) {
      const resumen = await api.agregarAlCarrito({
        producto_id: productoId,
        cantidad,
        talla: opciones.talla || null,
        color: opciones.color || null,
      });
      aplicarResumen(resumen);
      if (abrirCarrito) setDrawerAbierto(true);
      return;
    }

    const lineas = leerLineas();
    const nueva = {
      key: nuevaClave(),
      producto_id: productoId,
      cantidad,
      talla: opciones.talla || null,
      color: opciones.color || null,
    };
    const existente = lineas.find((l) => mismaLinea(l, nueva));
    const candidatas = existente
      ? lineas.map((l) => (l === existente ? { ...l, cantidad: l.cantidad + cantidad } : l))
      : [...lineas, nueva];

    try {
      await aplicarCambioInvitado(candidatas, existente ? existente.key : nueva.key);
    } catch (err) {
      // Si el rechazo es por stock y ya había unidades de esta línea, se aclara
      // que el límite incluye lo que ya está en el carrito.
      if (existente && /^Solo /.test(err.message)) {
        throw new Error(`Ya tienes ${existente.cantidad} en tu carrito. ${err.message}`);
      }
      throw err;
    }
    if (abrirCarrito) setDrawerAbierto(true);
  };

  const actualizarCantidad = async (itemId, cantidad) => {
    if (usuarioRef.current) {
      const resumen = await api.actualizarItemCarrito(itemId, { cantidad });
      aplicarResumen(resumen);
      return;
    }

    const lineas = leerLineas();
    if (cantidad <= 0) {
      await aplicarCambioInvitado(lineas.filter((l) => l.key !== itemId), null);
      return;
    }
    const candidatas = lineas.map((l) => (l.key === itemId ? { ...l, cantidad } : l));
    await aplicarCambioInvitado(candidatas, itemId);
  };

  const eliminar = async (itemId) => {
    if (usuarioRef.current) {
      const resumen = await api.eliminarItemCarrito(itemId);
      aplicarResumen(resumen);
      return;
    }
    await aplicarCambioInvitado(leerLineas().filter((l) => l.key !== itemId), null);
  };

  const vaciarLocal = () => {
    guardarLineas([]);
    aplicarResumen({ items: [], total_items: 0, total: 0 });
  };

  return (
    <CarritoContext.Provider
      value={{
        items,
        totalItems,
        total,
        cargando: cargando || !listo,
        drawerAbierto,
        setDrawerAbierto,
        refrescar,
        agregar,
        actualizarCantidad,
        eliminar,
        vaciarLocal,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  return useContext(CarritoContext);
}
