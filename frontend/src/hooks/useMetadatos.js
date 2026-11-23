import { useEffect } from "react";

/*
 * Título, descripción, enlace canónico, Open Graph y datos estructurados
 * (JSON-LD) de cada página de la tienda.
 *
 * La tienda es una SPA: index.html trae unas etiquetas genéricas y este hook
 * las reescribe al entrar en cada página, así Google (que sí ejecuta JS)
 * indexa cada producto con su propio nombre, precio y foto. Las vistas previas
 * de WhatsApp/Facebook no ejecutan JS: para esas hace falta renderizar en el
 * servidor (ver la migración a la app nueva).
 */
const MARCA = "Anita New Style";
const DESCRIPCION_POR_DEFECTO =
  "Moda para toda la familia en Huancayo. Compra en línea con tarjeta o Yape, recojo en tienda o envío a domicilio.";
const IMAGEN_POR_DEFECTO = "/logo-anita-new-style.png";
const ID_JSON_LD = "metadatos-json-ld";

function absoluta(url) {
  if (!url) return url;
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}

function fijarMeta(atributo, clave, contenido) {
  let el = document.head.querySelector(`meta[${atributo}="${clave}"]`);
  if (!contenido) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(atributo, clave);
    document.head.appendChild(el);
  }
  el.setAttribute("content", contenido);
}

function fijarCanonico(url) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

function fijarJsonLd(datos) {
  document.getElementById(ID_JSON_LD)?.remove();
  if (!datos) return;
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.id = ID_JSON_LD;
  el.textContent = JSON.stringify(datos);
  document.head.appendChild(el);
}

/**
 * @param {object} opciones
 * @param {string} [opciones.titulo]      Sin la marca: se agrega sola ("Polo básico · Anita New Style").
 * @param {string} [opciones.descripcion] Unas 150 letras como máximo.
 * @param {string} [opciones.imagen]
 * @param {"website"|"product"} [opciones.tipo]
 * @param {boolean} [opciones.noIndexar]  Para carrito, checkout, cuenta y similares.
 * @param {object} [opciones.jsonLd]
 */
export function useMetadatos({ titulo, descripcion, imagen, tipo = "website", noIndexar = false, jsonLd } = {}) {
  const jsonLdTexto = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const tituloCompleto = titulo ? `${titulo} · ${MARCA}` : `${MARCA} · Moda en Huancayo`;
    const texto = (descripcion || DESCRIPCION_POR_DEFECTO).replace(/\s+/g, " ").trim().slice(0, 160);
    const url = window.location.origin + window.location.pathname;
    const foto = absoluta(imagen || IMAGEN_POR_DEFECTO);

    document.title = tituloCompleto;
    fijarMeta("name", "description", texto);
    fijarMeta("name", "robots", noIndexar ? "noindex, nofollow" : null);
    fijarCanonico(url);
    fijarMeta("property", "og:title", tituloCompleto);
    fijarMeta("property", "og:description", texto);
    fijarMeta("property", "og:image", foto);
    fijarMeta("property", "og:url", url);
    fijarMeta("property", "og:type", tipo);
    fijarMeta("name", "twitter:card", "summary_large_image");
    fijarJsonLd(jsonLdTexto ? JSON.parse(jsonLdTexto) : null);
  }, [titulo, descripcion, imagen, tipo, noIndexar, jsonLdTexto]);
}

/** JSON-LD de schema.org/Product para la ficha de un producto. */
export function jsonLdProducto(producto) {
  if (!producto) return undefined;
  const imagenes = (producto.imagenes?.length ? producto.imagenes.map((i) => i.url) : [producto.imagen_url])
    .filter(Boolean)
    .map(absoluta);
  const datos = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description: producto.descripcion || undefined,
    sku: producto.sku || undefined,
    image: imagenes.length ? imagenes : undefined,
    brand: { "@type": "Brand", name: MARCA },
    category: producto.categoria_nombre || undefined,
    offers: {
      "@type": "Offer",
      url: window.location.origin + window.location.pathname,
      priceCurrency: "PEN",
      price: Number(producto.precio_final ?? producto.precio).toFixed(2),
      availability: producto.sin_stock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  if (producto.total_resenas > 0 && producto.promedio_calificacion) {
    datos.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(producto.promedio_calificacion).toFixed(1),
      reviewCount: producto.total_resenas,
    };
  }
  return datos;
}
