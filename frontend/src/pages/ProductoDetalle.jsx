import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useFavoritos } from "../context/FavoritosContext.jsx";
import { IconCart, IconHeart } from "../components/Icons.jsx";
import Estrellas from "../components/Estrellas.jsx";

// Traduce el nombre del color (como se guarda en BD) a un hex real para
// pintar el círculo. Si aparece un color que no está mapeado, cae a un
// gris neutro en vez de romper la UI.
const MAPA_COLORES = {
  negro: "#171717",
  blanco: "#FFFFFF",
  rojo: "#DC2626",
  guindo: "#7C1D2E",
  vino: "#7C1D2E",
  azul: "#2563EB",
  "azul marino": "#1E3A8A",
  "azul rey": "#1D4ED8",
  verde: "#16A34A",
  "verde militar": "#4D5C36",
  "verde olivo": "#6B7A3A",
  amarillo: "#EAB308",
  mostaza: "#CA9A2E",
  naranja: "#EA580C",
  rosa: "#EC4899",
  "rosa palo": "#D8A6A6",
  morado: "#9333EA",
  violeta: "#7C3AED",
  gris: "#6B7280",
  "gris claro": "#D1D5DB",
  "gris oscuro": "#4B5563",
  beige: "#D6C7A1",
  marron: "#78350F",
  marrón: "#78350F",
  café: "#6F4E37",
  camel: "#C19A6B",
  chocolate: "#4B2E1E",
  celeste: "#38BDF8",
  turquesa: "#14B8A6",
  dorado: "#CA8A04",
  plateado: "#9CA3AF",
  crema: "#FDF6E3",
  fucsia: "#DB2777",
  lila: "#C4B5FD",
  coral: "#FF6F61",
  khaki: "#8B8355",
  caqui: "#8B8355",
  ocre: "#B5651D",
};

const nombreColorAHex = (nombre) => MAPA_COLORES[(nombre || "").trim().toLowerCase()] || "#D4D4D8";

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { agregar } = useCarrito();
  const favoritos = useFavoritos();

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
  const [productosRelacionados, setProductosRelacionados] = useState([]);
  const refCarrusel = useRef(null);

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
      // La talla no se preselecciona: el cliente debe elegirla a propósito.
      // El color sí queda preseleccionado con el primero, porque es el que
      // corresponde a la imagen que se muestra al entrar.
      setTalla("");
      setColor(data.colores?.[0] || "");
      const primera = data.imagenes?.[0]?.url || data.imagen_url;
      setImagenActiva(primera);

      // Cargar productos relacionados (misma categoría). Se piden más de
      // los que caben en pantalla a propósito, para que el carrusel tenga
      // sentido (si no, las flechas no tendrían nada más que mostrar).
      if (data?.categoria_id) {
        api.productos({ categoria_id: data.categoria_id, por_pagina: 12 })
          .then((response) => {
            const filtrados = response.productos.filter(p => p.id !== data.id);
            setProductosRelacionados(filtrados);
          })
          .catch(() => {});
      }
    });
  }, [id]);

  // Disponibilidad de una talla/color para habilitar o no su botón.
  // Si la OTRA dimensión ya está elegida, exige esa combinación exacta
  // (como antes). Si la otra dimensión todavía no está elegida, alcanza con
  // que exista AL MENOS una variante con esta talla/color (sin importar la
  // otra) que tenga stock — así ningún botón queda bloqueado solo porque
  // el cliente todavía no eligió el otro campo.
  const tallaDisponible = (t) => {
    if (!producto.usa_variantes) return true;
    if (color) return stockParaCombo(t, color) > 0;
    return (producto.variantes || []).some((v) => (v.talla || null) === (t || null) && v.stock > 0);
  };

  const colorDisponible = (c) => {
    if (!producto.usa_variantes) return true;
    if (talla) return stockParaCombo(talla, c) > 0;
    return (producto.variantes || []).some((v) => (v.color || null) === (c || null) && v.stock > 0);
  };

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

  useEffect(() => {
    if (!producto || !color) return;
    const imagenDelColor = producto.imagenes?.find((img) => img.color === color);
    if (imagenDelColor) {
      setImagenActiva(imagenDelColor.url);
    }
  }, [color, producto]);

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

  // Falta elegir talla y/o color: solo aplica si el producto realmente
  // ofrece esas opciones (algunos productos no tienen tallas ni colores).
  const faltaTalla = producto.tallas?.length > 0 && !talla;
  const faltaColor = producto.colores?.length > 0 && !color;
  const seleccionIncompleta = faltaTalla || faltaColor;

  const stockSeleccion = seleccionIncompleta ? 0 : stockParaCombo(talla, color);
  // "Sin stock" solo se muestra cuando la selección YA está completa pero
  // esa combinación específica no tiene stock — si todavía falta elegir,
  // el mensaje correcto es pedir que elija, no decir que no hay stock.
  const sinStockEnCombo = !seleccionIncompleta && producto.usa_variantes && stockSeleccion <= 0;
  const esFavorito = favoritos?.esFavorito(producto.id);

  const textoBotonPendiente = () => {
    if (faltaTalla && faltaColor) return "Elige talla y color";
    if (faltaTalla) return "Elige una talla";
    if (faltaColor) return "Elige un color";
    return null;
  };

  const handleFavorito = () => {
    if (!usuario) {
      navigate("/ingresar");
      return;
    }
    favoritos?.alternar(producto.id);
  };

  const handleAgregar = async () => {
    if (!usuario) {
      // Guardamos desde dónde vino para que, si elige "Comprar sin crear
      // cuenta", vuelva acá mismo en vez de al inicio.
      navigate("/ingresar", { state: { from: `/producto/${producto.id}` } });
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
      navigate("/ingresar", { state: { from: `/producto/${producto.id}` } });
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

  // Mueve el carrusel de "También te puede interesar" hacia la izquierda
  // (-1) o derecha (1), desplazando el 80% del ancho visible por clic.
  const scrollCarrusel = (direccion) => {
    if (!refCarrusel.current) return;
    const ancho = refCarrusel.current.clientWidth * 0.8;
    refCarrusel.current.scrollBy({ left: direccion * ancho, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Galería: en mobile, la imagen grande arriba y las miniaturas debajo
            en fila horizontal (flex-col-reverse muestra el último hijo del DOM
            primero). Desde md hacia arriba, flex-row pone las miniaturas
            (primer hijo del DOM) a la izquierda de la imagen grande. */}
        <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-4">
          {producto.imagenes?.length > 1 && (
            <div
              className="flex gap-2 overflow-x-auto pb-1 md:max-h-[560px] md:w-20 md:shrink-0 md:flex-col md:overflow-x-visible md:overflow-y-auto md:pb-0"
              role="group"
              aria-label="Otras fotos del producto"
            >
              {producto.imagenes.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setImagenActiva(img.url)}
                  aria-label={`Ver foto${img.color ? ` — color ${img.color}` : ""}`}
                  aria-pressed={imagenActiva === img.url}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl shadow-glass transition ${
                    imagenActiva === img.url ? "ring-2 ring-berry" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="glass aspect-[4/5] flex-1 overflow-hidden rounded-3xl shadow-glass">
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
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wide text-plum-soft">
                {producto.categoria_nombre}
              </span>
              <h1 className="mt-1 font-display text-3xl font-semibold text-plum">
                {producto.nombre}
                {talla && ` ${talla}`}
              </h1>
            </div>
            <button
              onClick={handleFavorito}
              aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
              aria-pressed={esFavorito}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-glass transition hover:scale-110 ${
                esFavorito ? "border-berry bg-berry text-white" : "border-plum/15 bg-white text-plum-soft hover:text-berry"
              }`}
            >
              <IconHeart size={18} relleno={esFavorito} />
            </button>
          </div>

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
            <span className="text-2xl font-semibold text-berry-dark">
              S/ {producto.precio_final.toFixed(2)}
            </span>
            {producto.tiene_oferta && (
              <span className="text-plum-soft line-through">S/ {producto.precio.toFixed(2)}</span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-plum-soft">{producto.descripcion}</p>

          {producto.tallas?.length > 0 && (
            <div className="mt-5">
              <span id="talla-label" className="mb-2 block text-sm font-medium text-plum">Talla</span>
              <div role="radiogroup" aria-labelledby="talla-label" className="flex flex-wrap gap-2">
                {producto.tallas.map((t) => {
                  const sinStock = producto.usa_variantes && !tallaDisponible(t);
                  return (
                    <button
                      key={t}
                      role="radio"
                      aria-checked={talla === t}
                      onClick={() => setTalla(t)}
                      disabled={sinStock}
                      style={
                        sinStock
                          ? {
                              backgroundImage:
                                "linear-gradient(to top right, transparent 46%, currentColor 48%, currentColor 52%, transparent 54%)",
                            }
                          : undefined
                      }
                      className={`rounded-full px-4 py-1.5 text-sm shadow-glass transition disabled:cursor-not-allowed ${
                        sinStock
                          ? "text-plum-soft/50 glass"
                          : talla === t
                          ? "bg-berry text-white"
                          : "glass text-plum"
                      }`}
                      title={sinStock ? "Talla no disponible" : undefined}
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
              <span id="color-label" className="mb-2 block text-sm font-medium text-plum">Color</span>
              <div role="radiogroup" aria-labelledby="color-label" className="flex flex-wrap gap-3">
                {producto.colores.map((c) => {
                  const sinStock = producto.usa_variantes && !colorDisponible(c);
                  return (
                    <button
                      key={c}
                      role="radio"
                      aria-checked={color === c}
                      aria-label={c}
                      onClick={() => setColor(c)}
                      disabled={sinStock}
                      title={sinStock ? "Sin stock en esta combinación" : c}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full shadow-glass transition disabled:cursor-not-allowed ${
                        sinStock
                          ? "opacity-40"
                          : color === c
                          ? "ring-2 ring-berry ring-offset-2"
                          : "ring-1 ring-plum/15"
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-full border border-plum/10"
                        style={{ backgroundColor: nombreColorAHex(c) }}
                        aria-hidden="true"
                      />
                      {sinStock && (
                        <span
                          className="pointer-events-none absolute inset-0 rounded-full"
                          style={{
                            backgroundImage:
                              "linear-gradient(to top right, transparent 46%, #78350F 48%, #78350F 52%, transparent 54%)",
                          }}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <span id="cantidad-label" className="text-sm font-medium text-plum">Cantidad</span>
            <div className="glass flex items-center gap-3 rounded-full px-3 py-1.5 shadow-glass">
              <button
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                aria-label="Restar una unidad"
                className="text-plum"
              >
                −
              </button>
              <span className="w-4 text-center" aria-live="polite" aria-labelledby="cantidad-label">{cantidad}</span>
              <button
                onClick={() => setCantidad((c) => Math.min(stockSeleccion, c + 1))}
                disabled={cantidad >= stockSeleccion}
                aria-label="Sumar una unidad"
                className="text-plum disabled:opacity-30"
              >
                +
              </button>
            </div>
            {producto.usa_variantes && stockSeleccion > 0 && (
              <span className="text-xs text-plum-soft">{stockSeleccion} disponibles</span>
            )}
          </div>

          {seleccionIncompleta && (
            <p className="mt-2 text-sm text-plum-soft" role="status">
              {textoBotonPendiente()} para continuar.
            </p>
          )}

          {sinStockEnCombo && (
            <p className="mt-2 text-sm text-berry-dark" role="alert">
              Sin stock para esta combinación de talla/color.
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleAgregar}
              disabled={producto.sin_stock || sinStockEnCombo || seleccionIncompleta || agregando}
              className="glass flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-semibold text-plum shadow-glass transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconCart size={16} />
              {seleccionIncompleta
                ? textoBotonPendiente()
                : producto.sin_stock || sinStockEnCombo
                ? "Sin stock"
                : agregando
                ? "..."
                : "Agregar al carrito"}
            </button>
            <button
              onClick={handleComprar}
              disabled={producto.sin_stock || sinStockEnCombo || seleccionIncompleta || agregando}
              className="flex-1 rounded-full bg-berry py-3 font-semibold text-white shadow-glass-lg transition hover:bg-berry-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {seleccionIncompleta
                ? textoBotonPendiente()
                : producto.sin_stock || sinStockEnCombo
                ? "Sin stock"
                : agregando
                ? "..."
                : "Comprar ahora"}
            </button>
          </div>

          {mensaje && <p className="mt-3 text-sm text-berry-dark">{mensaje}</p>}
        </div>
      </div>

      {/* Calificación y reseñas */}
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="glass rounded-3xl p-6 shadow-glass sm:p-8">
          <h2 className="text-xl font-semibold text-plum">Escribe tu reseña</h2>
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
          <h2 className="mb-4 text-xl font-semibold text-plum">
            Reseñas {resenas.length > 0 && `(${resenas.length})`}
          </h2>
          {resenas.length === 0 ? (
            <p className="text-sm text-plum-soft">Sé la primera en reseñar este producto.</p>
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

      {/* Productos relacionados: carrusel horizontal con flechas */}
      {productosRelacionados.length > 0 && (
        <section className="mt-16">
          <h3 className="font-display text-xl font-semibold text-plum">
            También te puede interesar
          </h3>
          <div className="relative mt-4">
            {productosRelacionados.length > 4 && (
              <button
                onClick={() => scrollCarrusel(-1)}
                aria-label="Ver productos anteriores"
                className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full bg-berry text-white shadow-glass-lg transition hover:bg-berry-dark sm:flex"
              >
                ‹
              </button>
            )}

            <div
              ref={refCarrusel}
              className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
            >
              {productosRelacionados.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/producto/${rel.id}`}
                  className="group w-40 shrink-0 rounded-xl border border-plum/10 p-3 transition hover:shadow-glass sm:w-48"
                >
                  <img
                    src={rel.imagen_url || "/placeholder.png"}
                    alt={rel.nombre}
                    className="h-40 w-full rounded-lg object-cover sm:h-48"
                  />
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-plum transition group-hover:text-berry">
                    {rel.nombre}
                  </p>
                  <p className="text-sm font-semibold text-plum">
                    S/ {rel.precio_final?.toFixed(2) || rel.precio?.toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>

            {productosRelacionados.length > 4 && (
              <button
                onClick={() => scrollCarrusel(1)}
                aria-label="Ver más productos"
                className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 translate-x-3 items-center justify-center rounded-full bg-berry text-white shadow-glass-lg transition hover:bg-berry-dark sm:flex"
              >
                ›
              </button>
            )}
          </div>
        </section>
      )}

      {/* Cuidados, Envíos y Métodos de Pago - AL FINAL DE TODO */}
      <section className="mt-16 grid gap-6 sm:grid-cols-3 border-t border-plum/10 pt-10">
        {/* Cuidados */}
        <div className="rounded-xl border border-plum/10 bg-plum/5 p-5">
          <h4 className="font-display text-lg font-semibold text-plum">Cuidados:</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-plum-soft">
            <li>• Limpiar con paño suave y seco</li>
            <li>• No exponer a humedad excesiva</li>
            <li>• Aplicar crema protectora para cuero ecológico</li>
          </ul>
        </div>

        {/* Envíos y Devoluciones */}
        <div className="rounded-xl border border-plum/10 bg-plum/5 p-5">
          <h4 className="font-display text-lg font-semibold text-plum">Envíos & Devoluciones</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-plum-soft">
            <li>• Envíos a todo el Perú en 3-5 días hábiles.</li>
            <li>• Cambios y devoluciones hasta 30 días después de la compra.</li>
            <li>
              • Para más información, revisa nuestra{" "}
              <Link to="/cambios-devoluciones" className="text-berry hover:underline">
                política de cambios
              </Link>.
            </li>
          </ul>
        </div>

        {/* Métodos de pago */}
        <div className="rounded-xl border border-plum/10 bg-plum/5 p-5">
          <h4 className="font-display text-lg font-semibold text-plum">Métodos de pago</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-plum-soft">
            <li>• Tarjetas de crédito/débito (Visa, Mastercard, American Express).</li>
            <li>• Yape, Plin y transferencias bancarias.</li>
            <li>• Pago contraentrega en Huancayo (consulta disponibilidad).</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
