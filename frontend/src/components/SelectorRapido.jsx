import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useFocusTrap } from "../hooks/useFocusTrap.js";
import { nombreColorAHex } from "../utils/colores.js";
import { stockCombo, tallaDisponible, colorDisponible } from "../utils/variantes.js";
import { IconClose, IconCart } from "./Icons.jsx";
import ImagenOptimizada from "./ImagenOptimizada.jsx";
import { Skeleton, SkeletonRegion } from "./Skeleton.jsx";

// Los listados (tarjetas) no traen el stock por talla/color, así que al abrir
// el selector se pide el detalle completo. Se guarda unos segundos para que
// abrir el mismo producto dos veces seguidas no repita la petición.
const CACHE = new Map();
const VIGENCIA_MS = 30_000;

function obtenerDetalle(id) {
  const guardado = CACHE.get(id);
  if (guardado && Date.now() - guardado.t < VIGENCIA_MS) return Promise.resolve(guardado.data);
  return api.producto(id).then((data) => {
    CACHE.set(id, { t: Date.now(), data });
    return data;
  });
}

// Selector rápido ("atajo"): elegir talla y color de un producto sin salir del
// listado. En celular sube desde abajo como una hoja; en pantallas grandes
// aparece centrado. Se dibuja en un portal (document.body) para que no lo
// recorte la tarjeta ni cambie de posición con sus animaciones.
export default function SelectorRapido({ producto, onClose, onAgregado }) {
  const { agregar } = useCarrito();
  const refDialogo = useFocusTrap(true, onClose);

  const [detalle, setDetalle] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState(false);
  const [error, setError] = useState("");

  // Bloquea el scroll de la página mientras el selector está abierto.
  useEffect(() => {
    const previo = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previo;
    };
  }, []);

  useEffect(() => {
    let vigente = true;
    obtenerDetalle(producto.id)
      .then((data) => {
        if (!vigente) return;
        setDetalle(data);
        // Si solo hay una opción en un eje (ej. un único color), se deja elegida:
        // un clic menos para el cliente.
        if (data.tallas?.length === 1) setTalla(data.tallas[0]);
        if (data.colores?.length === 1) setColor(data.colores[0]);
      })
      .catch(() => {
        if (vigente) setErrorCarga("No pudimos cargar las opciones. Intenta de nuevo.");
      });
    return () => {
      vigente = false;
    };
  }, [producto.id]);

  const tieneTallas = detalle?.tallas?.length > 0;
  const tieneColores = detalle?.colores?.length > 0;
  const faltaTalla = tieneTallas && !talla;
  const faltaColor = tieneColores && !color;
  const seleccionIncompleta = faltaTalla || faltaColor;
  const stock = detalle && !seleccionIncompleta ? stockCombo(detalle, talla, color) : 0;

  // Si cambia la combinación y ya no alcanza el stock, bajamos la cantidad.
  useEffect(() => {
    if (stock > 0 && cantidad > stock) setCantidad(stock);
  }, [stock]); // eslint-disable-line react-hooks/exhaustive-deps

  const elegirTalla = (t) => {
    setError("");
    setTalla(t);
    // Si el color elegido no existe en esta talla, lo limpiamos para no dejar
    // una combinación imposible seleccionada.
    if (color && stockCombo(detalle, t, color) <= 0) setColor("");
  };

  const elegirColor = (c) => {
    setError("");
    setColor(c);
    if (talla && stockCombo(detalle, talla, c) <= 0) setTalla("");
  };

  const textoBoton = () => {
    if (agregando) return "Agregando...";
    if (faltaTalla && faltaColor) return "Elige talla y color";
    if (faltaTalla) return "Elige una talla";
    if (faltaColor) return "Elige un color";
    if (stock <= 0) return "Agotado";
    return "Agregar al carrito";
  };

  const confirmar = async () => {
    setError("");
    setAgregando(true);
    try {
      await agregar(producto.id, {
        cantidad,
        talla: talla || null,
        color: color || null,
        abrirCarrito: false,
      });
      onAgregado?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setAgregando(false);
    }
  };

  // La foto cambia con el color elegido, si el producto tiene una por color.
  const imagen =
    detalle?.imagenes?.find((img) => img.color && img.color === color)?.url || producto.imagen_url;

  const idTitulo = `selector-rapido-${producto.id}`;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar selector"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-plum/40 backdrop-blur-sm"
      />

      <div
        ref={refDialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="relative max-h-[92vh] w-full max-w-md animate-slide-in-up overflow-y-auto rounded-t-3xl bg-white p-5 shadow-glass-lg sm:animate-scale-in sm:rounded-3xl sm:p-6"
      >
        <div className="flex gap-4">
          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-lilac">
            {imagen ? (
              <ImagenOptimizada
                src={imagen}
                variante="thumb"
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={idTitulo} className="text-base font-semibold leading-snug text-plum">
              {producto.nombre}
            </h2>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold text-berry">S/{producto.precio_final.toFixed(2)}</span>
              {producto.tiene_oferta && (
                <span className="text-sm text-plum-soft line-through">
                  S/{producto.precio.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="self-start rounded-full p-2 text-plum-soft transition hover:bg-lilac"
          >
            <IconClose size={16} />
          </button>
        </div>

        {errorCarga ? (
          <p className="mt-6 text-sm text-berry-dark" role="alert">
            {errorCarga}
          </p>
        ) : !detalle ? (
          <SkeletonRegion etiqueta="Cargando opciones" className="mt-6 space-y-5">
            <div className="space-y-2" aria-hidden="true">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-10 w-12 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="space-y-2" aria-hidden="true">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-9 w-9 rounded-full" />
                ))}
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-full" />
          </SkeletonRegion>
        ) : (
          <div className="mt-6 animate-fade-in space-y-5">
            {tieneTallas && (
              <div>
                <p className="mb-2 text-sm font-semibold text-plum">
                  Talla{talla ? <span className="font-normal text-plum-soft">: {talla}</span> : null}
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Tallas">
                  {detalle.tallas.map((t) => {
                    const disponible = tallaDisponible(detalle, t, color);
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={!disponible}
                        aria-pressed={talla === t}
                        onClick={() => elegirTalla(t)}
                        title={disponible ? undefined : "Agotado"}
                        className={`min-w-[3rem] rounded-xl border px-3 py-2 text-sm font-medium transition active:scale-95 ${
                          talla === t
                            ? "border-berry bg-berry text-white"
                            : "border-plum/15 bg-white text-plum hover:border-berry/40"
                        } ${disponible ? "" : "cursor-not-allowed opacity-40 line-through"}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tieneColores && (
              <div>
                <p className="mb-2 text-sm font-semibold text-plum">
                  Color{color ? <span className="font-normal text-plum-soft">: {color}</span> : null}
                </p>
                <div className="flex flex-wrap gap-2.5" role="group" aria-label="Colores">
                  {detalle.colores.map((c) => {
                    const disponible = colorDisponible(detalle, c, talla);
                    return (
                      <button
                        key={c}
                        type="button"
                        disabled={!disponible}
                        aria-pressed={color === c}
                        aria-label={disponible ? c : `${c} (agotado)`}
                        title={disponible ? c : `${c} — agotado`}
                        onClick={() => elegirColor(c)}
                        className={`h-9 w-9 rounded-full border border-plum/20 transition active:scale-90 ${
                          color === c ? "ring-2 ring-berry ring-offset-2" : "hover:scale-110"
                        } ${disponible ? "" : "cursor-not-allowed opacity-30"}`}
                        style={{ backgroundColor: nombreColorAHex(c) }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-plum">Cantidad</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    disabled={cantidad <= 1}
                    aria-label="Restar una unidad"
                    className="h-8 w-8 rounded-full border border-plum/15 text-plum transition hover:bg-lilac active:scale-90 disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold" aria-live="polite">
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.min(Math.max(stock, 1), c + 1))}
                    disabled={seleccionIncompleta || cantidad >= stock}
                    aria-label="Sumar una unidad"
                    className="h-8 w-8 rounded-full border border-plum/15 text-plum transition hover:bg-lilac active:scale-90 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
              {!seleccionIncompleta && stock > 0 && stock <= 5 && (
                <span className="text-xs font-medium text-berry-dark">
                  {stock === 1 ? "¡Última unidad!" : `Quedan ${stock}`}
                </span>
              )}
            </div>

            {error && (
              <p className="text-sm text-berry-dark" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={confirmar}
              disabled={seleccionIncompleta || stock <= 0 || agregando}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-berry py-3 font-semibold text-white shadow-glass transition hover:bg-berry-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconCart size={16} />
              {textoBoton()}
            </button>

            <Link
              to={`/producto/${producto.id}`}
              onClick={onClose}
              className="block text-center text-sm font-medium text-plum-soft transition hover:text-berry"
            >
              Ver todos los detalles
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
