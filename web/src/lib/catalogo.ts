import "server-only";
import { and, asc, avg, count, desc, eq, ilike, inArray, isNotNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categorias, colores, imagenesProducto, productos, resenas, tallas, variantesProducto } from "@/db/schema";
import { calcularPrecios, type Precios } from "./precio";

export type Variante = { id: number; talla: string | null; color: string | null; colorHex: string | null; stock: number };
export type Imagen = { id: number; url: string; color: string | null };

export type ProductoResumen = Precios & {
  id: number;
  nombre: string;
  imagenUrl: string | null;
  categoria: { slug: string; nombre: string } | null;
  esNuevo: boolean;
  destacado: boolean;
  stock: number;
  sinStock: boolean;
  promedioCalificacion: number;
  totalResenas: number;
};

export type ProductoDetalle = ProductoResumen & {
  descripcion: string | null;
  sku: string | null;
  imagenes: Imagen[];
  /** Vacío en un producto simple (su variante única es interna, como en Flask). */
  variantes: Variante[];
  tallas: string[];
  colores: string[];
};

const POR_PAGINA = 24;

async function resumenResenas(ids: number[]) {
  if (!ids.length) return new Map<number, { total: number; promedio: number }>();
  const filas = await db
    .select({ productoId: resenas.productoId, total: count(resenas.id), promedio: avg(resenas.calificacion) })
    .from(resenas)
    .where(inArray(resenas.productoId, ids))
    .groupBy(resenas.productoId);
  return new Map(filas.map((f) => [f.productoId, { total: f.total, promedio: Math.round(Number(f.promedio) * 10) / 10 }]));
}

async function stockPorProducto(ids: number[]) {
  if (!ids.length) return new Map<number, number>();
  const filas = await db
    .select({ productoId: variantesProducto.productoId, stock: sql<number>`coalesce(sum(${variantesProducto.stock}), 0)::int` })
    .from(variantesProducto)
    .where(inArray(variantesProducto.productoId, ids))
    .groupBy(variantesProducto.productoId);
  return new Map(filas.map((f) => [f.productoId, f.stock]));
}

async function primeraImagen(ids: number[]) {
  if (!ids.length) return new Map<number, string>();
  const filas = await db
    .selectDistinctOn([imagenesProducto.productoId], { productoId: imagenesProducto.productoId, url: imagenesProducto.url })
    .from(imagenesProducto)
    .where(inArray(imagenesProducto.productoId, ids))
    .orderBy(imagenesProducto.productoId, asc(imagenesProducto.orden), asc(imagenesProducto.id));
  return new Map(filas.map((f) => [f.productoId, f.url]));
}

type FilaProducto = {
  id: number;
  nombre: string;
  precio: string;
  precioOferta: string | null;
  esNuevo: boolean;
  destacado: boolean;
  categoriaSlug: string | null;
  categoriaNombre: string | null;
};

async function armarResumenes(filas: FilaProducto[]): Promise<ProductoResumen[]> {
  const ids = filas.map((f) => f.id);
  const [stock, fotos, notas] = await Promise.all([stockPorProducto(ids), primeraImagen(ids), resumenResenas(ids)]);
  return filas.map((f) => {
    const s = stock.get(f.id) ?? 0;
    const n = notas.get(f.id);
    return {
      id: f.id,
      nombre: f.nombre,
      ...calcularPrecios(f.precio, f.precioOferta),
      imagenUrl: fotos.get(f.id) ?? null,
      categoria: f.categoriaSlug ? { slug: f.categoriaSlug, nombre: f.categoriaNombre ?? f.categoriaSlug } : null,
      esNuevo: f.esNuevo,
      destacado: f.destacado,
      stock: s,
      sinStock: s <= 0,
      promedioCalificacion: n?.promedio ?? 0,
      totalResenas: n?.total ?? 0,
    };
  });
}

const columnasProducto = {
  id: productos.id,
  nombre: productos.nombre,
  precio: productos.precio,
  precioOferta: productos.precioOferta,
  esNuevo: productos.esNuevo,
  destacado: productos.destacado,
  categoriaSlug: categorias.slug,
  categoriaNombre: categorias.nombre,
};

export async function obtenerProducto(id: number): Promise<ProductoDetalle | null> {
  const [fila] = await db
    .select({ ...columnasProducto, descripcion: productos.descripcion, sku: productos.sku })
    .from(productos)
    .leftJoin(categorias, eq(categorias.id, productos.categoriaId))
    .where(and(eq(productos.id, id), eq(productos.activo, true)))
    .limit(1);
  if (!fila) return null;

  const [resumen, imagenes, variantes] = await Promise.all([
    armarResumenes([fila]),
    db
      .select({ id: imagenesProducto.id, url: imagenesProducto.url, color: colores.nombre })
      .from(imagenesProducto)
      .leftJoin(colores, eq(colores.id, imagenesProducto.colorId))
      .where(eq(imagenesProducto.productoId, id))
      .orderBy(asc(imagenesProducto.orden), asc(imagenesProducto.id)),
    db
      .select({
        id: variantesProducto.id,
        stock: variantesProducto.stock,
        talla: tallas.nombre,
        tallaOrden: tallas.orden,
        color: colores.nombre,
        colorHex: colores.codigoHex,
      })
      .from(variantesProducto)
      .leftJoin(tallas, eq(tallas.id, variantesProducto.tallaId))
      .leftJoin(colores, eq(colores.id, variantesProducto.colorId))
      .where(eq(variantesProducto.productoId, id))
      .orderBy(asc(variantesProducto.tallaId), asc(variantesProducto.colorId)),
  ]);

  const usaVariantes = variantes.some((v) => v.talla !== null || v.color !== null);
  const tallasOrdenadas = [
    ...new Map(
      variantes
        .filter((v) => v.talla)
        .sort((a, b) => (a.tallaOrden ?? 0) - (b.tallaOrden ?? 0) || a.talla!.localeCompare(b.talla!))
        .map((v) => [v.talla!, v.talla!])
    ).values(),
  ];
  const coloresOrdenados = [...new Set(variantes.filter((v) => v.color).map((v) => v.color!))].sort((a, b) =>
    a.localeCompare(b)
  );

  return {
    ...resumen[0]!,
    descripcion: fila.descripcion,
    sku: fila.sku,
    imagenes,
    variantes: usaVariantes
      ? variantes.map(({ id, talla, color, colorHex, stock }) => ({ id, talla, color, colorHex, stock }))
      : [],
    tallas: tallasOrdenadas,
    colores: coloresOrdenados,
  };
}

export type Orden = "nuevos" | "precio_asc" | "precio_desc";
export type FiltrosTienda = { categoria?: string; q?: string; oferta?: boolean; orden?: Orden; pagina?: number };

export async function listarProductos(filtros: FiltrosTienda) {
  const condiciones: SQL[] = [eq(productos.activo, true)];
  if (filtros.categoria) condiciones.push(eq(categorias.slug, filtros.categoria));
  if (filtros.oferta) condiciones.push(isNotNull(productos.precioOferta), sql`${productos.precioOferta} < ${productos.precio}`);
  const q = filtros.q?.trim().slice(0, 80);
  if (q) {
    const patron = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    // unaccent no está instalada: se compara sin distinguir mayúsculas (ILIKE).
    condiciones.push(or(ilike(productos.nombre, patron), ilike(productos.descripcion, patron))!);
  }
  const donde = and(...condiciones);
  const precioFinal = sql`coalesce(nullif(${productos.precioOferta}, 0), ${productos.precio})`;
  const orden =
    filtros.orden === "precio_asc"
      ? [asc(precioFinal), asc(productos.id)]
      : filtros.orden === "precio_desc"
        ? [desc(precioFinal), asc(productos.id)]
        : [desc(productos.fechaCreacion), desc(productos.id)];
  const pagina = Math.max(1, Math.floor(filtros.pagina ?? 1));

  const [filas, [total]] = await Promise.all([
    db
      .select(columnasProducto)
      .from(productos)
      .leftJoin(categorias, eq(categorias.id, productos.categoriaId))
      .where(donde)
      .orderBy(...orden)
      .limit(POR_PAGINA)
      .offset((pagina - 1) * POR_PAGINA),
    db.select({ n: count() }).from(productos).leftJoin(categorias, eq(categorias.id, productos.categoriaId)).where(donde),
  ]);

  const totalProductos = total?.n ?? 0;
  return {
    productos: await armarResumenes(filas),
    total: totalProductos,
    pagina,
    paginas: Math.max(1, Math.ceil(totalProductos / POR_PAGINA)),
  };
}

export async function listarCategorias() {
  return db
    .select({ slug: categorias.slug, nombre: categorias.nombre })
    .from(categorias)
    .where(eq(categorias.activo, true))
    .orderBy(asc(categorias.nombre));
}

export async function relacionados(producto: ProductoDetalle, limite = 4) {
  if (!producto.categoria) return [];
  const filas = await db
    .select(columnasProducto)
    .from(productos)
    .innerJoin(categorias, eq(categorias.id, productos.categoriaId))
    .where(and(eq(productos.activo, true), eq(categorias.slug, producto.categoria.slug), sql`${productos.id} <> ${producto.id}`))
    .orderBy(desc(productos.destacado), desc(productos.fechaCreacion))
    .limit(limite);
  return armarResumenes(filas);
}

/** Para el sitemap: id y última modificación de cada producto activo. */
export async function productosParaSitemap() {
  return db
    .select({ id: productos.id, actualizado: productos.fechaActualizacion, creado: productos.fechaCreacion })
    .from(productos)
    .where(eq(productos.activo, true))
    .orderBy(asc(productos.id));
}
