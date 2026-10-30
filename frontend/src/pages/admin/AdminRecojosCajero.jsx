import React, { useEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useConfirm } from "../../components/ConfirmDialog.jsx";
import { SkeletonFilasAdmin } from "../../components/admin/EsqueletosAdmin.jsx";
import { InsigniaEstadoPedido, InsigniaEntregaPedido } from "../../components/admin/InsigniasPedido.jsx";
import Paginador from "../../components/Paginador.jsx";

const POR_PAGINA = 20;

// La caja solo puede consultar recojos ONLINE listos y entregarlos con el
// código del cliente; las demás funciones siguen en el panel de Pedidos.
export default function AdminRecojosCajero() {
  const toast = useToast();
  const confirmar = useConfirm();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [pedidos, setPedidos] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0);
  const [codigos, setCodigos] = useState({});
  const [errores, setErrores] = useState({});
  const [entregandoId, setEntregandoId] = useState(null);
  const peticionActual = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagina(1);
      setFiltro(busqueda.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  useEffect(() => {
    const actual = ++peticionActual.current;
    setCargando(true);
    setErrorCarga("");
    api.adminRecojosCajero({ pagina, ...(filtro && { q: filtro }) })
      .then((data) => {
        if (actual !== peticionActual.current) return;
        setPedidos(data.pedidos);
        setTotal(data.total);
      })
      .catch((err) => {
        if (actual === peticionActual.current) setErrorCarga(err.message);
      })
      .finally(() => {
        if (actual === peticionActual.current) setCargando(false);
      });
    return () => { peticionActual.current++; };
  }, [pagina, filtro, recargar]);

  const entregar = async (e, pedido) => {
    e.preventDefault();
    if (entregandoId !== null) return;
    const codigo = codigos[pedido.id] || "";
    if (!/^\d{6}$/.test(codigo)) return;

    const aceptado = await confirmar({
      title: "Confirmar entrega",
      message: `¿El cliente está presente y vas a entregarle el pedido ${pedido.numero_pedido}? Esta acción no se puede deshacer.`,
      confirmText: "Sí, entregar pedido",
      cancelText: "Volver",
    });
    if (!aceptado) return;

    setEntregandoId(pedido.id);
    setErrores((prev) => ({ ...prev, [pedido.id]: "" }));
    try {
      await api.adminEntregarRecojoCajero(pedido.id, codigo);
      toast.success(`Pedido ${pedido.numero_pedido} entregado`);
      setCodigos((prev) => ({ ...prev, [pedido.id]: "" }));
      setPedidos((prev) => prev.filter((p) => p.id !== pedido.id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (pedidos.length === 1 && pagina > 1) setPagina((prev) => prev - 1);
      else setRecargar((prev) => prev + 1);
    } catch (err) {
      setErrores((prev) => ({ ...prev, [pedido.id]: err.message }));
    } finally {
      setEntregandoId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-plum">Recojos en tienda</h1>
          <p className="mt-1 text-sm text-plum-soft">
            Solo compras web listas para recoger. Pide el código de 6 dígitos antes de entregar.
          </p>
        </div>
        <button type="button" onClick={() => setRecargar((n) => n + 1)} className="btn btn-secondary">
          Actualizar lista
        </button>
      </div>

      <label htmlFor="buscar-recojo" className="mb-2 block text-sm font-semibold text-plum">
        Buscar pedido o cliente
      </label>
      <input
        id="buscar-recojo"
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="N° de pedido o nombre del cliente"
        maxLength={80}
        autoComplete="off"
        className="mb-5 w-full rounded-xl border border-plum/20 bg-white px-4 py-3 text-plum outline-none focus:border-berry sm:max-w-lg"
      />

      {errorCarga && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          No se pudo cargar la lista: {errorCarga}
        </p>
      )}
      {cargando ? (
        <SkeletonFilasAdmin etiqueta="Cargando recojos" cantidad={4} />
      ) : !errorCarga && pedidos.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-center text-plum-soft">
          {filtro ? "No se encontraron recojos listos con esa búsqueda." : "No hay pedidos pendientes de recojo en tienda."}
        </p>
      ) : !errorCarga ? (
        <>
          <Paginador pagina={pagina} porPagina={POR_PAGINA} total={total} onCambiar={setPagina} className="mb-3" />
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="glass rounded-2xl p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-plum">{pedido.numero_pedido}</h2>
                    <p className="mt-1 text-sm text-plum-soft">{pedido.envio_nombre || "Cliente sin nombre"}</p>
                    <p className="text-xs text-plum-soft">
                      Pedido del {new Date(pedido.fecha_creacion).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <InsigniaEntregaPedido pedido={{ tipo_entrega: "recojo", origen: "online" }} />
                    <InsigniaEstadoPedido estado={pedido.estado} label={pedido.estado_label} />
                  </div>
                </div>
                <form onSubmit={(e) => entregar(e, pedido)} className="mt-4 flex flex-wrap items-end gap-3 border-t border-plum/10 pt-4">
                  <div>
                    <label htmlFor={`codigo-recojo-${pedido.id}`} className="mb-1 block text-sm font-semibold text-plum">
                      Código que muestra el cliente
                    </label>
                    <input
                      id={`codigo-recojo-${pedido.id}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={codigos[pedido.id] || ""}
                      onChange={(e) => {
                        setCodigos((prev) => ({ ...prev, [pedido.id]: e.target.value.replace(/\D/g, "").slice(0, 6) }));
                        setErrores((prev) => ({ ...prev, [pedido.id]: "" }));
                      }}
                      placeholder="6 dígitos"
                      className="w-44 rounded-xl border border-plum/20 bg-white px-4 py-2.5 font-mono tracking-widest text-plum outline-none focus:border-berry"
                      disabled={entregandoId !== null}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={entregandoId !== null || (codigos[pedido.id] || "").length !== 6}
                  >
                    {entregandoId === pedido.id ? "Entregando..." : "Marcar entregado"}
                  </button>
                </form>
                {errores[pedido.id] && (
                  <p role="alert" className="mt-2 text-sm text-red-700">{errores[pedido.id]}</p>
                )}
              </div>
            ))}
          </div>
          <Paginador pagina={pagina} porPagina={POR_PAGINA} total={total} onCambiar={setPagina} className="mt-3" />
        </>
      ) : null}
    </div>
  );
}
