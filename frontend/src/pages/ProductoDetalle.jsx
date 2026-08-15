import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { IconCart } from "../components/Icons.jsx";
import Estrellas from "../components/Estrellas.jsx";

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { agregar } = useCarrito();

  const [producto, setProducto] = useState(null);
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [miCalificacion, setMiCalificacion] = useState(0);
  const [miComentario, setMiComentario] = useState("");
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [errorResena, setErrorResena] = useState("");

  const cargarResenas = () => api.resenas(id).then((data) => setResenas(data.resenas));

  useEffect(() => {
    cargarResenas();
  }, [id]);

  useEffect(() => {
    if (!usuario) return;
    const propia = resenas.find((r) => r.usuario_id === usuario.id);
    if (propia) {
      setMiCalificacion(propia.calificacion);
      setMiComentario(propia.comentario || "");
    }
  }, [resenas, usuario]);

  const enviarResena = async (e) => {
    e.preventDefault();
    if (!usuario) {
      navigate("/ingresar");
      return;
    }
    if (miCalificacion < 1) {
      setErrorResena("Elige al menos una estrella.");
      return;
    }
    setEnviandoResena(true);
    setErrorResena("");
    try {
      await api.guardarResena(id, { calificacion: miCalificacion, comentario: miComentario });
      cargarResenas();
    } catch (err) {
      setErrorResena(err.message);
    } finally {
      setEnviandoResena(false);
    }
  };

  useEffect(() => {
    api.producto(id).then((data) => {
      setProducto(data);
      setTalla(data.tallas?.[0] || "");
      setColor(data.colores?.[0] || "");
      const primera = data.imagenes?.[0]?.url || data.imagen_url;
      setImagenActiva(primera);
    });
  }, [id]);

  // Stock disponible para una combinación de talla/color. Si el producto no
  // usa variantes, el stock es el mismo sin importar lo elegido.
  const stockParaCombo = (t, c) => {
    if (!producto || !producto.usa_variantes) return producto?.stock ?? 0;
    const tallaBuscada = producto.tallas?.length ? t : null;
    const colorBuscado = producto.colores?.length ? c : null;
    const variante = producto.variantes?.find(
      (v) => (v.talla || null) === (tallaBuscada || null) && (v.color || null) === (colorBuscado || null)
    );
    return variante ? variante.stock : 0;
  };

  // Cuando el cliente cambia de color, mostramos la imagen asociada a ese color (si existe)
  useEffect(() => {
    if (!producto || !color) return;
    const imagenDelColor = producto.imagenes?.find((img) => img.color === color);
    if (imagenDelColor) {
      setImagenActiva(imagenDelColor.url);
    }
  }, [color, producto]);

  // Si la cantidad elegida ya no cabe en el stock de la combinación actual, la ajustamos
  useEffect(() => {
    if (!producto) return;
    const disponible = stockParaCombo(talla, color);
    if (disponible > 0 && cantidad > disponible) {
      setCantidad(disponible);
    }
  }, [talla, color, producto]);

  if (!producto) {
    return <p className="mx-auto max-w-6xl px-4 py-10 text-plum-soft">Cargando producto...</p>;
  }

  const stockSeleccion = stockParaCombo(talla, color);
  const sinStockEnCombo = producto.usa_variantes && stockSeleccion <= 0;

  const handleAgregar = async () => {
    if (!usuario) {
      navigate("/ingresar");
      return;
    }
    setAgregando(true);
    setMensaje("");
    try {
      await agregar(producto.id, { cantidad, talla, color });
      setMensaje("¡Producto agregado al carrito!");
    } catch (err) {
      setMensaje(err.message);
    } finally {
      setAgregando(false);
    }
  };

  const handleComprar = async () => {
    if (!usuario) {
      navigate("/ingresar");
      return;
    }
    setAgregando(true);
    setMensaje("");
    try {
      await agregar(producto.id, { cantidad, talla, color });
      navigate("/checkout");
    } catch (err) {
      setMensaje(err.message);
      setAgregando(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="glass aspect-[4/5] overflow-hidden rounded-3xl shadow-glass">
            {imagenActiva ? (
              <img
                src={imagenActiva}
                alt={producto.nombre}
                className="h-full w-full object-cover transition"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-lilac to-white font-display text-5xl text-berry-light/60">
                {producto.nombre.slice(0, 1)}
              </div>
            )}
          </div>

          {producto.imagenes?.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {producto.imagenes.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setImagenActiva(img.url)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl shadow-glass transition ${
                    imagenActiva === img.url ? "ring-2 ring-berry" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass sm:p-8">
          <span className="text-xs uppercase tracking-wide text-plum-soft">
            {producto.categoria_nombre}
          </span>
          <h1 className="mt-1 font-display text-3xl font-semibold text-plum">{producto.nombre}</h1>

          {producto.total_resenas > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <Estrellas valor={producto.promedio_calificacion} size={15} />
              <span className="text-sm text-plum-soft">
                {producto.promedio_calificacion} ({producto.total_resenas}{" "}
                {producto.total_resenas === 1 ? "reseña" : "reseñas"})
              </span>
            </div>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-2xl font-semibold text-berry-dark">
              S/ {producto.precio_final.toFixed(2)}
            </span>
            {producto.tiene_oferta && (
              <span className="text-plum-soft line-through">S/ {producto.precio.toFixed(2)}</span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-plum-soft">{producto.descripcion}</p>

          {producto.tallas?.length > 0 && (
            <div className="mt-5">
              <span className="mb-2 block text-sm font-medium text-plum">Talla</span>
              <div className="flex flex-wrap gap-2">
                {producto.tallas.map((t) => {
                  const sinStock = producto.usa_variantes && stockParaCombo(t, color) <= 0;
                  return (
                    <button
                      key={t}
                      onClick={() => setTalla(t)}
                      disabled={sinStock}
                      className={`rounded-full px-4 py-1.5 text-sm shadow-glass transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        talla === t ? "bg-berry text-white" : "glass text-plum"
                      }`}
                      title={sinStock ? "Sin stock en esta combinación" : undefined}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {producto.colores?.length > 0 && (
            <div className="mt-4">
              <span className="mb-2 block text-sm font-medium text-plum">Color</span>
              <div className="flex flex-wrap gap-2">
                {producto.colores.map((c) => {
                  const sinStock = producto.usa_variantes && stockParaCombo(talla, c) <= 0;
                  return (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      disabled={sinStock}
                      className={`rounded-full px-4 py-1.5 text-sm shadow-glass transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        color === c ? "bg-berry text-white" : "glass text-plum"
                      }`}
                      title={sinStock ? "Sin stock en esta combinación" : undefined}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <span className="text-sm font-medium text-plum">Cantidad</span>
            <div className="glass flex items-center gap-3 rounded-full px-3 py-1.5 shadow-glass">
              <button onClick={() => setCantidad((c) => Math.max(1, c - 1))} className="text-plum">
                −
              </button>
              <span className="w-4 text-center">{cantidad}</span>
              <button
                onClick={() => setCantidad((c) => Math.min(stockSeleccion, c + 1))}
                disabled={cantidad >= stockSeleccion}
                className="text-plum disabled:opacity-30"
              >
                +
              </button>
            </div>
            {producto.usa_variantes && stockSeleccion > 0 && (
              <span className="text-xs text-plum-soft">{stockSeleccion} disponibles</span>
            )}
          </div>

          {sinStockEnCombo && (
            <p className="mt-2 text-sm text-berry-dark">
              Sin stock para esta combinación de talla/color.
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleAgregar}
              disabled={producto.sin_stock || sinStockEnCombo || agregando}
              className="glass flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-semibold text-plum shadow-glass transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconCart size={16} />
              {producto.sin_stock || sinStockEnCombo ? "Sin stock" : agregando ? "..." : "Agregar al carrito"}
            </button>
            <button
              onClick={handleComprar}
              disabled={producto.sin_stock || sinStockEnCombo || agregando}
              className="flex-1 rounded-full bg-berry py-3 font-semibold text-white shadow-glass-lg transition hover:bg-berry-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {producto.sin_stock || sinStockEnCombo ? "Sin stock" : agregando ? "..." : "Comprar ahora"}
            </button>
          </div>

          {mensaje && <p className="mt-3 text-sm text-berry-dark">{mensaje}</p>}
        </div>
      </div>

      {/* Calificación y reseñas */}
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="glass rounded-3xl p-6 shadow-glass sm:p-8">
          <h2 className="font-display text-xl font-semibold text-plum">Escribe tu reseña</h2>
          {usuario ? (
            <form onSubmit={enviarResena} className="mt-4 space-y-3">
              <Estrellas valor={miCalificacion} onChange={setMiCalificacion} size={24} />
              <textarea
                placeholder="Cuéntanos qué te pareció el producto (opcional)"
                rows={3}
                maxLength={1000}
                value={miComentario}
                onChange={(e) => setMiComentario(e.target.value)}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              {errorResena && <p className="text-sm text-berry-dark">{errorResena}</p>}
              <button
                type="submit"
                disabled={enviandoResena}
                className="rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
              >
                {enviandoResena ? "Guardando..." : "Publicar reseña"}
              </button>
              <p className="text-xs text-plum-soft">
                Solo puedes reseñar productos que hayas comprado.
              </p>
            </form>
          ) : (
            <p className="mt-3 text-sm text-plum-soft">
              <button onClick={() => navigate("/ingresar")} className="font-medium text-berry hover:underline">
                Ingresa
              </button>{" "}
              a tu cuenta para dejar tu reseña.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-plum">
            Reseñas {resenas.length > 0 && `(${resenas.length})`}
          </h2>
          {resenas.length === 0 ? (
            <p className="text-sm text-plum-soft">Este producto todavía no tiene reseñas.</p>
          ) : (
            <div className="space-y-3">
              {resenas.map((r) => (
                <div key={r.id} className="glass rounded-2xl p-4 shadow-glass">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-plum">{r.usuario_nombre}</span>
                    <Estrellas valor={r.calificacion} size={14} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-plum-soft">
                    <span>{new Date(r.fecha_creacion).toLocaleDateString("es-PE")}</span>
                    {r.compra_verificada && (
                      <span className="rounded-full bg-berry/10 px-2 py-0.5 font-semibold text-berry-dark">
                        Compra verificada
                      </span>
                    )}
                  </div>
                  {r.comentario && <p className="mt-2 text-sm text-plum-soft">{r.comentario}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
