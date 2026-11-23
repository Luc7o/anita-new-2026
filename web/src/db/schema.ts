// Generado con `npm run db:pull` (drizzle-kit) a partir del esquema que crean
// backend/migraciones_postgres. Después de regenerarlo, repetir estos dos arreglos:
// el tipo citext (drizzle-kit no lo conoce) y los .default('') que salen cortados.
import { customType } from "drizzle-orm/pg-core";

const citext = customType<{ data: string }>({ dataType: () => "citext" });
import { pgTable, varchar, timestamp, index, bigint, integer, smallint, unique, boolean, foreignKey, check, text, numeric, char, date, jsonb, uniqueIndex } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const migracionesAplicadas = pgTable("migraciones_aplicadas", {
	nombreArchivo: varchar("nombre_archivo", { length: 200 }).primaryKey().notNull(),
	fechaAplicada: timestamp("fecha_aplicada", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
});

export const latenciaRequests = pgTable("latencia_requests", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "latencia_requests_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	endpoint: varchar({ length: 150 }).notNull(),
	metodo: varchar({ length: 10 }).notNull(),
	latenciaMs: integer("latencia_ms").notNull(),
	statusCode: smallint("status_code").notNull(),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	index("idx_endpoint").using("btree", table.endpoint.asc().nullsLast().op("text_ops")),
	index("idx_latencia_fecha").using("btree", table.fechaCreacion.asc().nullsLast().op("timestamp_ops")),
]);

export const categorias = pgTable("categorias", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "categorias_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	nombre: citext("nombre").notNull(),
	slug: citext("slug").notNull(),
	descripcion: varchar({ length: 300 }),
	icono: varchar({ length: 100 }).default('bag'),
	activo: boolean().default(true).notNull(),
	imagenUrl: varchar("imagen_url", { length: 500 }),
}, (table) => [
	unique("uq_categorias_nombre").on(table.nombre),
	unique("uq_categorias_slug").on(table.slug),
]);

export const favoritos = pgTable("favoritos", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "favoritos_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	usuarioId: integer("usuario_id").notNull(),
	productoId: integer("producto_id").notNull(),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	index("idx_favoritos_producto_id").using("btree", table.productoId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "fk_favoritos_usuario_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productoId],
			foreignColumns: [productos.id],
			name: "fk_favoritos_producto_id"
		}).onDelete("cascade"),
	unique("uq_favorito_usuario_producto").on(table.usuarioId, table.productoId),
]);

export const configuracionTienda = pgTable("configuracion_tienda", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "configuracion_tienda_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	nombreComercial: varchar("nombre_comercial", { length: 120 }).notNull(),
	logoUrl: varchar("logo_url", { length: 400 }),
	correoContacto: varchar("correo_contacto", { length: 120 }),
	telefono: varchar({ length: 20 }),
	whatsapp: varchar({ length: 20 }),
	direccion: varchar({ length: 200 }),
	referencia: varchar({ length: 200 }),
	ciudad: varchar({ length: 80 }),
	horarioAtencion: varchar("horario_atencion", { length: 120 }),
	mapsUrl: varchar("maps_url", { length: 400 }),
	facebookUrl: varchar("facebook_url", { length: 200 }),
	instagramUrl: varchar("instagram_url", { length: 200 }),
	tiktokUrl: varchar("tiktok_url", { length: 200 }),
	moneda: varchar({ length: 3 }).notNull(),
	actualizadoEn: timestamp("actualizado_en", { mode: 'string' }),
});

export const productos = pgTable("productos", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "productos_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	nombre: varchar({ length: 150 }).notNull(),
	descripcion: text(),
	precio: numeric({ precision: 10, scale:  2 }).notNull(),
	precioOferta: numeric("precio_oferta", { precision: 10, scale:  2 }),
	sku: citext("sku"),
	categoriaId: integer("categoria_id").notNull(),
	destacado: boolean().default(false).notNull(),
	esNuevo: boolean("es_nuevo").default(true).notNull(),
	activo: boolean().default(true).notNull(),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	fechaActualizacion: timestamp("fecha_actualizacion", { mode: 'string' }),
	genero: varchar({ length: 20 }),
	costoPromedio: numeric("costo_promedio", { precision: 10, scale:  2 }),
	stockMinimo: integer("stock_minimo").default(3).notNull(),
}, (table) => [
	index("idx_productos_categoria_id").using("btree", table.categoriaId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.categoriaId],
			foreignColumns: [categorias.id],
			name: "fk_productos_categoria_id"
		}),
	unique("uq_productos_sku").on(table.sku),
	check("chk_productos_genero", sql`(genero IS NULL) OR ((genero)::text = ANY ((ARRAY['mujer'::character varying, 'hombre'::character varying, 'unisex'::character varying, 'nina'::character varying, 'nino'::character varying])::text[]))`),
	check("chk_productos_oferta", sql`(precio_oferta IS NULL) OR (precio_oferta < precio)`),
	check("chk_productos_precio", sql`(precio >= (0)::numeric) AND ((precio_oferta IS NULL) OR (precio_oferta >= (0)::numeric))`),
	check("chk_productos_stock_minimo", sql`stock_minimo >= 0`),
]);

export const pedidos = pgTable("pedidos", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "pedidos_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	numeroPedido: varchar("numero_pedido", { length: 30 }).notNull(),
	idempotencyKey: varchar("idempotency_key", { length: 64 }),
	usuarioId: integer("usuario_id"),
	estado: varchar({ length: 20 }).default('pendiente'),
	estadoPago: varchar("estado_pago", { length: 20 }).default('pendiente'),
	metodoPago: varchar("metodo_pago", { length: 20 }).notNull(),
	tipoEntrega: varchar("tipo_entrega", { length: 20 }).default('delivery'),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	costoEnvio: numeric("costo_envio", { precision: 10, scale:  2 }).default('0.00'),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	envioNombre: varchar("envio_nombre", { length: 160 }),
	envioTelefono: varchar("envio_telefono", { length: 20 }),
	envioDireccion: varchar("envio_direccion", { length: 200 }),
	envioDistrito: varchar("envio_distrito", { length: 100 }),
	envioProvincia: varchar("envio_provincia", { length: 100 }),
	envioDpto: varchar("envio_dpto", { length: 100 }),
	envioReferencia: varchar("envio_referencia", { length: 200 }),
	nota: text(),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	culqiCargoId: varchar("culqi_cargo_id", { length: 40 }),
	origen: varchar({ length: 20 }).default('online').notNull(),
	pagoIdempotencyKey: varchar("pago_idempotency_key", { length: 64 }),
	fechaLimitePago: timestamp("fecha_limite_pago", { mode: 'string' }),
	fechaPago: timestamp("fecha_pago", { mode: 'string' }),
	fechaEntregado: timestamp("fecha_entregado", { mode: 'string' }),
	motivoCancelacion: varchar("motivo_cancelacion", { length: 50 }),
	distritoId: integer("distrito_id"),
	envioTipoDocumento: varchar("envio_tipo_documento", { length: 10 }),
	envioNumeroDocumento: varchar("envio_numero_documento", { length: 15 }),
	envioEmail: varchar("envio_email", { length: 120 }),
	codigoRecojo: char("codigo_recojo", { length: 6 }),
}, (table) => [
	index("idx_pedidos_distrito_id").using("btree", table.distritoId.asc().nullsLast().op("int4_ops")),
	index("idx_pedidos_estado").using("btree", table.estado.asc().nullsLast().op("text_ops"), table.estadoPago.asc().nullsLast().op("text_ops")),
	index("idx_pedidos_fecha_creacion").using("btree", table.fechaCreacion.asc().nullsLast().op("timestamp_ops")),
	index("idx_pedidos_usuario_id").using("btree", table.usuarioId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "fk_pedidos_usuario"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.distritoId],
			foreignColumns: [ubigeoDistritos.id],
			name: "fk_pedidos_distrito_id"
		}),
	unique("uq_pedidos_numero_pedido").on(table.numeroPedido),
	unique("uq_pedidos_idempotency_key").on(table.idempotencyKey),
	unique("uq_pedidos_culqi_cargo_id").on(table.culqiCargoId),
	check("chk_pedidos_estado", sql`(estado)::text = ANY ((ARRAY['pendiente'::character varying, 'confirmado'::character varying, 'preparando'::character varying, 'listo_recojo'::character varying, 'enviado'::character varying, 'entregado'::character varying, 'cancelado'::character varying])::text[])`),
	check("chk_pedidos_importes", sql`(subtotal >= (0)::numeric) AND (total >= (0)::numeric) AND ((costo_envio IS NULL) OR (costo_envio >= (0)::numeric))`),
	check("chk_pedidos_metodo_pago", sql`(metodo_pago)::text = ANY ((ARRAY['yape'::character varying, 'tarjeta'::character varying, 'efectivo'::character varying])::text[])`),
	check("chk_pedidos_origen", sql`(origen)::text = ANY ((ARRAY['online'::character varying, 'presencial'::character varying])::text[])`),
	check("chk_pedidos_tipo_entrega", sql`(tipo_entrega)::text = ANY ((ARRAY['delivery'::character varying, 'recojo'::character varying])::text[])`),
	check("chk_pedidos_estado_pago", sql`(estado_pago)::text = ANY ((ARRAY['pendiente'::character varying, 'en_revision'::character varying, 'verificado'::character varying, 'rechazado'::character varying, 'no_aplica'::character varying, 'reembolso_pendiente'::character varying, 'reembolsando'::character varying, 'reembolsado'::character varying])::text[])`),
]);

export const ubigeoDepartamentos = pgTable("ubigeo_departamentos", {
	id: integer().primaryKey().notNull(),
	nombre: varchar({ length: 50 }).notNull(),
	codigo: char({ length: 2 }).notNull(),
}, (table) => [
	unique("uq_ubigeo_departamentos_codigo").on(table.codigo),
]);

export const ubigeoProvincias = pgTable("ubigeo_provincias", {
	id: integer().primaryKey().notNull(),
	nombre: varchar({ length: 100 }).notNull(),
	codigo: char({ length: 4 }).notNull(),
	departamentoId: integer("departamento_id").notNull(),
}, (table) => [
	index("idx_provincias_departamento").using("btree", table.departamentoId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.departamentoId],
			foreignColumns: [ubigeoDepartamentos.id],
			name: "fk_provincias_departamento"
		}),
	unique("uq_ubigeo_provincias_codigo").on(table.codigo),
]);

export const imagenesProducto = pgTable("imagenes_producto", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "imagenes_producto_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	productoId: integer("producto_id").notNull(),
	url: varchar({ length: 400 }).notNull(),
	orden: integer().default(0),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	colorId: integer("color_id"),
}, (table) => [
	index("idx_imagenes_color").using("btree", table.colorId.asc().nullsLast().op("int4_ops")),
	index("idx_imagenes_producto_producto_id").using("btree", table.productoId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.colorId],
			foreignColumns: [colores.id],
			name: "fk_imagenes_color"
		}),
	foreignKey({
			columns: [table.productoId],
			foreignColumns: [productos.id],
			name: "fk_imagenes_producto_producto_id"
		}).onDelete("cascade"),
]);

export const promociones = pgTable("promociones", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "promociones_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	etiqueta: varchar({ length: 60 }).default(''),
	titulo: varchar({ length: 150 }).notNull(),
	descripcion: varchar({ length: 400 }).default(''),
	imagenUrl: varchar("imagen_url", { length: 400 }).default(''),
	botonTexto: varchar("boton_texto", { length: 60 }).default('Ver Todo'),
	botonLink: varchar("boton_link", { length: 200 }).default('/tienda'),
	fechaInicio: date("fecha_inicio"),
	fechaFin: date("fecha_fin"),
	activo: boolean().default(true).notNull(),
	orden: integer().default(0),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	fechaActualizacion: timestamp("fecha_actualizacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	productoId: integer("producto_id"),
}, (table) => [
	index("idx_promociones_producto_id").using("btree", table.productoId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productoId],
			foreignColumns: [productos.id],
			name: "fk_promociones_producto"
		}).onDelete("set null"),
	check("chk_promociones_fechas", sql`(fecha_inicio IS NULL) OR (fecha_fin IS NULL) OR (fecha_fin >= fecha_inicio)`),
]);

export const eventoAnalitica = pgTable("evento_analitica", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "evento_analitica_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	tipoEvento: varchar("tipo_evento", { length: 30 }).notNull(),
	productoId: integer("producto_id"),
	usuarioId: integer("usuario_id"),
	sesionId: varchar("sesion_id", { length: 64 }).notNull(),
	metadata: jsonb(),
	creadoEn: timestamp("creado_en", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	index("idx_evento_analitica_producto_id").using("btree", table.productoId.asc().nullsLast().op("int4_ops")),
	index("idx_evento_analitica_usuario_id").using("btree", table.usuarioId.asc().nullsLast().op("int4_ops")),
	index("idx_evento_creado_en").using("btree", table.creadoEn.asc().nullsLast().op("timestamp_ops")),
	index("idx_sesion").using("btree", table.sesionId.asc().nullsLast().op("text_ops")),
	index("idx_tipo_fecha").using("btree", table.tipoEvento.asc().nullsLast().op("text_ops"), table.creadoEn.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productoId],
			foreignColumns: [productos.id],
			name: "fk_evento_analitica_producto_id"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "fk_evento_analitica_usuario_id"
		}).onDelete("set null"),
	check("chk_evento_analitica_tipo_evento", sql`(tipo_evento)::text = ANY ((ARRAY['vista_pagina'::character varying, 'vista_producto'::character varying, 'agregar_carrito'::character varying, 'inicio_checkout'::character varying, 'compra_completada'::character varying])::text[])`),
]);

export const colores = pgTable("colores", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "colores_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	nombre: citext("nombre").notNull(),
	codigoHex: varchar("codigo_hex", { length: 7 }),
}, (table) => [
	unique("uq_colores_nombre").on(table.nombre),
	check("chk_colores_nombre", sql`nombre <> ''::citext`),
]);

export const ubigeoDistritos = pgTable("ubigeo_distritos", {
	id: integer().primaryKey().notNull(),
	nombre: varchar({ length: 150 }).notNull(),
	codigo: char({ length: 6 }).notNull(),
	provinciaId: integer("provincia_id").notNull(),
}, (table) => [
	index("idx_distritos_provincia").using("btree", table.provinciaId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.provinciaId],
			foreignColumns: [ubigeoProvincias.id],
			name: "fk_distritos_provincia"
		}),
	unique("uq_ubigeo_distritos_codigo").on(table.codigo),
]);

export const tallas = pgTable("tallas", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "tallas_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	nombre: citext("nombre").notNull(),
	orden: integer().default(0),
}, (table) => [
	unique("uq_tallas_nombre").on(table.nombre),
	check("chk_tallas_nombre", sql`nombre <> ''::citext`),
]);

export const proveedorProductos = pgTable("proveedor_productos", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "proveedor_productos_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	proveedorId: integer("proveedor_id").notNull(),
	productoId: integer("producto_id").notNull(),
	precioCompra: numeric("precio_compra", { precision: 10, scale:  2 }),
	activo: boolean().default(true).notNull(),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	index("idx_proveedor_productos_producto_id").using("btree", table.productoId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productoId],
			foreignColumns: [productos.id],
			name: "fk_pp_producto"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.proveedorId],
			foreignColumns: [proveedores.id],
			name: "fk_pp_proveedor"
		}).onDelete("cascade"),
	unique("uq_proveedor_producto").on(table.proveedorId, table.productoId),
]);

export const roles = pgTable("roles", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "roles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	codigo: varchar({ length: 20 }).notNull(),
	nombre: varchar({ length: 50 }).notNull(),
}, (table) => [
	unique("uq_roles_codigo").on(table.codigo),
]);

export const proveedores = pgTable("proveedores", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "proveedores_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	nombre: varchar({ length: 150 }).notNull(),
	contactoNombre: varchar("contacto_nombre", { length: 120 }),
	telefono: varchar({ length: 20 }),
	email: varchar({ length: 120 }),
	direccion: varchar({ length: 200 }),
	ruc: varchar({ length: 20 }),
	notas: text(),
	activo: boolean().default(true).notNull(),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	unique("uq_proveedores_ruc").on(table.ruc),
]);

export const detalleCompra = pgTable("detalle_compra", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "detalle_compra_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	compraId: integer("compra_id").notNull(),
	productoId: integer("producto_id").notNull(),
	varianteId: integer("variante_id"),
	talla: varchar({ length: 20 }),
	color: varchar({ length: 50 }),
	cantidad: integer().notNull(),
	costoUnitario: numeric("costo_unitario", { precision: 10, scale:  2 }).notNull(),
	subtotal: numeric({ precision: 12, scale:  2 }).notNull(),
}, (table) => [
	index("idx_detalle_compra_variante_id").using("btree", table.varianteId.asc().nullsLast().op("int4_ops")),
	index("idx_detcompra_compra").using("btree", table.compraId.asc().nullsLast().op("int4_ops")),
	index("idx_detcompra_producto").using("btree", table.productoId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productoId],
			foreignColumns: [productos.id],
			name: "fk_detcompra_producto"
		}),
	foreignKey({
			columns: [table.varianteId],
			foreignColumns: [variantesProducto.id],
			name: "fk_detcompra_variante"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.compraId],
			foreignColumns: [compras.id],
			name: "fk_detcompra_compra"
		}).onDelete("cascade"),
	check("chk_detcompra_cantidad", sql`cantidad > 0`),
	check("chk_detcompra_costo", sql`costo_unitario >= (0)::numeric`),
	check("chk_detcompra_subtotal", sql`subtotal >= (0)::numeric`),
]);

export const detallesPedido = pgTable("detalles_pedido", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "detalles_pedido_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	pedidoId: integer("pedido_id").notNull(),
	productoId: integer("producto_id").notNull(),
	cantidad: integer().default(1).notNull(),
	precioUnit: numeric("precio_unit", { precision: 10, scale:  2 }).notNull(),
	talla: varchar({ length: 20 }),
	color: varchar({ length: 50 }),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	varianteId: integer("variante_id"),
}, (table) => [
	index("idx_detalles_pedido_pedido_id").using("btree", table.pedidoId.asc().nullsLast().op("int4_ops")),
	index("idx_detalles_pedido_producto_id").using("btree", table.productoId.asc().nullsLast().op("int4_ops")),
	index("idx_detalles_pedido_variante_id").using("btree", table.varianteId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.pedidoId],
			foreignColumns: [pedidos.id],
			name: "fk_detalles_pedido_pedido_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productoId],
			foreignColumns: [productos.id],
			name: "fk_detalles_pedido_producto_id"
		}),
	foreignKey({
			columns: [table.varianteId],
			foreignColumns: [variantesProducto.id],
			name: "fk_detalle_variante"
		}).onDelete("set null"),
	check("chk_detalles_pedido_cantidad", sql`cantidad > 0`),
	check("chk_detalles_pedido_importes", sql`(precio_unit >= (0)::numeric) AND (subtotal >= (0)::numeric)`),
]);

export const historialEstadoPedido = pgTable("historial_estado_pedido", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "historial_estado_pedido_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	pedidoId: integer("pedido_id").notNull(),
	estadoAnterior: varchar("estado_anterior", { length: 30 }).notNull(),
	estadoNuevo: varchar("estado_nuevo", { length: 30 }).notNull(),
	cambiadoPor: integer("cambiado_por"),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	index("idx_historial_estado_pedido_cambiado_por").using("btree", table.cambiadoPor.asc().nullsLast().op("int4_ops")),
	index("idx_pedido").using("btree", table.pedidoId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.pedidoId],
			foreignColumns: [pedidos.id],
			name: "fk_historial_estado_pedido_pedido_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.cambiadoPor],
			foreignColumns: [usuarios.id],
			name: "fk_historial_estado_pedido_cambiado_por"
		}).onDelete("set null"),
]);

export const codigosRespaldo = pgTable("codigos_respaldo", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "codigos_respaldo_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	usuarioId: integer("usuario_id").notNull(),
	codigoHash: varchar("codigo_hash", { length: 64 }).notNull(),
	usadoEn: timestamp("usado_en", { mode: 'string' }),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "fk_codigos_respaldo_usuario"
		}).onDelete("cascade"),
	unique("uq_codigos_respaldo_usuario_hash").on(table.usuarioId, table.codigoHash),
	check("chk_codigos_respaldo_hash", sql`char_length((codigo_hash)::text) = 64`),
]);

export const carrito = pgTable("carrito", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "carrito_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	usuarioId: integer("usuario_id").notNull(),
	cantidad: integer().default(1).notNull(),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	varianteId: integer("variante_id").notNull(),
}, (table) => [
	index("idx_carrito_variante").using("btree", table.varianteId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "fk_carrito_usuario_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.varianteId],
			foreignColumns: [variantesProducto.id],
			name: "fk_carrito_variante"
		}).onDelete("cascade"),
	unique("uq_carrito_linea").on(table.usuarioId, table.varianteId),
	check("chk_carrito_cantidad", sql`cantidad > 0`),
]);

export const variantesProducto = pgTable("variantes_producto", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "variantes_producto_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	productoId: integer("producto_id").notNull(),
	stock: integer().default(0).notNull(),
	tallaId: integer("talla_id"),
	colorId: integer("color_id"),
}, (table) => [
	index("idx_variantes_color").using("btree", table.colorId.asc().nullsLast().op("int4_ops")),
	index("idx_variantes_talla").using("btree", table.tallaId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.colorId],
			foreignColumns: [colores.id],
			name: "fk_variantes_color"
		}),
	foreignKey({
			columns: [table.tallaId],
			foreignColumns: [tallas.id],
			name: "fk_variantes_talla"
		}),
	foreignKey({
			columns: [table.productoId],
			foreignColumns: [productos.id],
			name: "fk_variantes_producto_producto_id"
		}).onDelete("cascade"),
	unique("uq_variante_producto").on(table.productoId, table.tallaId, table.colorId),
	check("chk_variantes_stock", sql`stock >= 0`),
]);

export const intentoPago = pgTable("intento_pago", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "intento_pago_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	pedidoId: integer("pedido_id").notNull(),
	monto: numeric({ precision: 10, scale:  2 }).notNull(),
	estado: varchar({ length: 30 }).notNull(),
	codigoCulqi: varchar("codigo_culqi", { length: 40 }),
	motivoRechazo: varchar("motivo_rechazo", { length: 255 }),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	index("idx_intento_pago_pedido_id").using("btree", table.pedidoId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.pedidoId],
			foreignColumns: [pedidos.id],
			name: "fk_intento_pago_pedido_id"
		}).onDelete("cascade"),
	check("chk_intento_pago_estado", sql`(estado)::text = ANY ((ARRAY['aprobado'::character varying, 'rechazado'::character varying, 'reembolsado'::character varying])::text[])`),
	check("chk_intento_pago_monto", sql`monto >= (0)::numeric`),
]);

export const resenas = pgTable("resenas", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "resenas_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	productoId: integer("producto_id").notNull(),
	usuarioId: integer("usuario_id").notNull(),
	calificacion: integer().notNull(),
	comentario: text(),
	compraVerificada: boolean("compra_verificada").default(false).notNull(),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	fechaActualizacion: timestamp("fecha_actualizacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	index("idx_resenas_usuario_id").using("btree", table.usuarioId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productoId],
			foreignColumns: [productos.id],
			name: "fk_resenas_producto_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "fk_resenas_usuario_id"
		}).onDelete("cascade"),
	unique("uq_resena_producto_usuario").on(table.productoId, table.usuarioId),
	check("chk_resenas_calificacion", sql`(calificacion >= 1) AND (calificacion <= 5)`),
]);

export const promocionUso = pgTable("promocion_uso", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "promocion_uso_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	promocionId: integer("promocion_id").notNull(),
	pedidoId: integer("pedido_id").notNull(),
	usuarioId: integer("usuario_id"),
	montoDescuento: numeric("monto_descuento", { precision: 10, scale:  2 }).notNull(),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	index("idx_promocion_uso_pedido_id").using("btree", table.pedidoId.asc().nullsLast().op("int4_ops")),
	index("idx_promocion_uso_usuario_id").using("btree", table.usuarioId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.promocionId],
			foreignColumns: [promociones.id],
			name: "fk_promocion_uso_promocion_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.pedidoId],
			foreignColumns: [pedidos.id],
			name: "fk_promocion_uso_pedido_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "fk_promocion_uso_usuario_id"
		}).onDelete("set null"),
	unique("uq_promocion_uso_promocion_pedido").on(table.promocionId, table.pedidoId),
	check("chk_promocion_uso_monto", sql`monto_descuento >= (0)::numeric`),
]);

export const compras = pgTable("compras", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "compras_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	proveedorId: integer("proveedor_id").notNull(),
	tipoDocumento: varchar("tipo_documento", { length: 20 }),
	numeroDocumento: varchar("numero_documento", { length: 40 }),
	fechaCompra: date("fecha_compra").notNull(),
	estado: varchar({ length: 30 }).default('recibida').notNull(),
	total: numeric({ precision: 12, scale:  2 }).default('0.00').notNull(),
	notas: text(),
	usuarioId: integer("usuario_id"),
	anuladaPor: integer("anulada_por"),
	fechaAnulacion: timestamp("fecha_anulacion", { mode: 'string' }),
	motivoAnulacion: varchar("motivo_anulacion", { length: 255 }),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	index("idx_compras_anulada_por").using("btree", table.anuladaPor.asc().nullsLast().op("int4_ops")),
	index("idx_compras_fecha").using("btree", table.fechaCompra.asc().nullsLast().op("date_ops")),
	index("idx_compras_usuario_id").using("btree", table.usuarioId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("uq_compras_documento").using("btree", table.proveedorId.asc().nullsLast().op("text_ops"), table.tipoDocumento.asc().nullsLast().op("int4_ops"), table.numeroDocumento.asc().nullsLast().op("text_ops")).where(sql`(((estado)::text = 'recibida'::text) AND (tipo_documento IS NOT NULL) AND (numero_documento IS NOT NULL))`),
	foreignKey({
			columns: [table.anuladaPor],
			foreignColumns: [usuarios.id],
			name: "fk_compras_anulada_por"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.proveedorId],
			foreignColumns: [proveedores.id],
			name: "fk_compras_proveedor"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "fk_compras_usuario"
		}).onDelete("set null"),
	check("chk_compras_estado", sql`(estado)::text = ANY ((ARRAY['recibida'::character varying, 'anulada'::character varying])::text[])`),
	check("chk_compras_total", sql`total >= (0)::numeric`),
]);

export const movimientoStock = pgTable("movimiento_stock", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "movimiento_stock_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	varianteId: integer("variante_id"),
	talla: varchar({ length: 20 }),
	color: varchar({ length: 50 }),
	productoId: integer("producto_id"),
	tipo: varchar({ length: 30 }).notNull(),
	cantidad: integer().notNull(),
	pedidoId: integer("pedido_id"),
	fechaCreacion: timestamp("fecha_creacion", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	usuarioId: integer("usuario_id"),
	motivo: varchar({ length: 255 }),
	stockAntes: integer("stock_antes"),
	stockDespues: integer("stock_despues"),
	costoUnitario: numeric("costo_unitario", { precision: 10, scale:  2 }),
	proveedorId: integer("proveedor_id"),
	compraId: integer("compra_id"),
}, (table) => [
	index("idx_movimiento_stock_compra_id").using("btree", table.compraId.asc().nullsLast().op("int4_ops")),
	index("idx_movimiento_stock_fecha").using("btree", table.fechaCreacion.asc().nullsLast().op("timestamp_ops")),
	index("idx_movimiento_stock_pedido_id").using("btree", table.pedidoId.asc().nullsLast().op("int4_ops")),
	index("idx_movimiento_stock_proveedor_id").using("btree", table.proveedorId.asc().nullsLast().op("int4_ops")),
	index("idx_movimiento_stock_usuario_id").using("btree", table.usuarioId.asc().nullsLast().op("int4_ops")),
	index("idx_movstock_producto_fecha").using("btree", table.productoId.asc().nullsLast().op("int4_ops"), table.fechaCreacion.asc().nullsLast().op("timestamp_ops")),
	index("idx_variante").using("btree", table.varianteId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.pedidoId],
			foreignColumns: [pedidos.id],
			name: "fk_movimiento_stock_pedido_id"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.compraId],
			foreignColumns: [compras.id],
			name: "fk_movstock_compra"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.proveedorId],
			foreignColumns: [proveedores.id],
			name: "fk_movstock_proveedor"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "fk_movstock_usuario"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.varianteId],
			foreignColumns: [variantesProducto.id],
			name: "fk_movimiento_stock_variante_id"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.productoId],
			foreignColumns: [productos.id],
			name: "fk_movimiento_stock_producto_id"
		}).onDelete("set null"),
	check("chk_movimiento_stock_tipo", sql`(tipo)::text = ANY ((ARRAY['venta'::character varying, 'restauracion'::character varying, 'stock_inicial'::character varying, 'ingreso_compra'::character varying, 'ajuste_manual'::character varying, 'merma'::character varying, 'inventario_fisico'::character varying, 'anulacion_compra'::character varying])::text[])`),
]);

export const refreshTokens = pgTable("refresh_tokens", {
	jti: varchar({ length: 64 }).primaryKey().notNull(),
	usuarioId: integer("usuario_id").notNull(),
	creadoEn: timestamp("creado_en", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	expiraEn: timestamp("expira_en", { mode: 'string' }).notNull(),
	usadoEn: timestamp("usado_en", { mode: 'string' }),
}, (table) => [
	index("idx_refresh_tokens_expira").using("btree", table.expiraEn.asc().nullsLast().op("timestamp_ops")),
	index("idx_refresh_tokens_usuario").using("btree", table.usuarioId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "fk_refresh_tokens_usuario"
		}).onDelete("cascade"),
]);

export const usuarios = pgTable("usuarios", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "usuarios_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	nombre: varchar({ length: 80 }).notNull(),
	apellido: varchar({ length: 80 }).notNull(),
	email: citext("email").notNull(),
	passwordHash: varchar("password_hash", { length: 255 }),
	telefono: varchar({ length: 20 }),
	direccion: varchar({ length: 200 }),
	referencia: varchar({ length: 200 }),
	activo: boolean().default(true).notNull(),
	fechaRegistro: timestamp("fecha_registro", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	tipoDocumento: varchar("tipo_documento", { length: 10 }),
	numeroDocumento: varchar("numero_documento", { length: 15 }),
	rolId: integer("rol_id").notNull(),
	distritoId: integer("distrito_id"),
	esInvitado: boolean("es_invitado").default(false).notNull(),
	sesionVersion: integer("sesion_version").default(1).notNull(),
	intentosFallidosLogin: integer("intentos_fallidos_login").default(0).notNull(),
	bloqueadoHasta: timestamp("bloqueado_hasta", { mode: 'string' }),
	googleId: varchar("google_id", { length: 40 }),
	aceptaPromociones: boolean("acepta_promociones").default(false).notNull(),
	totpSecreto: varchar("totp_secreto", { length: 255 }),
	totpActivo: boolean("totp_activo").default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totpUltimoPaso: bigint("totp_ultimo_paso", { mode: "number" }),
	eliminadoEn: timestamp("eliminado_en", { mode: 'string' }),
	aceptoTerminosEn: timestamp("acepto_terminos_en", { mode: 'string' }),
	versionTerminos: varchar("version_terminos", { length: 20 }),
}, (table) => [
	index("idx_usuarios_distrito").using("btree", table.distritoId.asc().nullsLast().op("int4_ops")),
	index("idx_usuarios_rol").using("btree", table.rolId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.distritoId],
			foreignColumns: [ubigeoDistritos.id],
			name: "fk_usuarios_distrito"
		}),
	foreignKey({
			columns: [table.rolId],
			foreignColumns: [roles.id],
			name: "fk_usuarios_rol"
		}),
	unique("uq_usuarios_email").on(table.email),
	unique("uq_usuarios_numero_documento").on(table.numeroDocumento),
	unique("uq_usuarios_google_id").on(table.googleId),
	check("chk_usuarios_aceptacion_completa", sql`(acepto_terminos_en IS NULL) = (version_terminos IS NULL)`),
]);

export const consentimientosPrivacidad = pgTable("consentimientos_privacidad", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "consentimientos_privacidad_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	finalidad: varchar({ length: 20 }).default('analitica').notNull(),
	decision: varchar({ length: 10 }).notNull(),
	version: varchar({ length: 20 }).notNull(),
	sesionId: varchar("sesion_id", { length: 64 }),
	decididoEn: timestamp("decidido_en", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	retiradoEn: timestamp("retirado_en", { mode: 'string' }),
}, (table) => [
	index("idx_consentimientos_decidido").using("btree", table.decididoEn.asc().nullsLast().op("timestamp_ops")),
	unique("uq_consentimientos_sesion_id").on(table.sesionId),
	check("chk_consentimientos_finalidad", sql`(finalidad)::text = 'analitica'::text`),
	check("chk_consentimientos_decision", sql`(decision)::text = ANY ((ARRAY['aceptado'::character varying, 'rechazado'::character varying, 'retirado'::character varying])::text[])`),
	check("chk_consentimientos_sesion", sql`((decision)::text = 'aceptado'::text) = (sesion_id IS NOT NULL)`),
	check("chk_consentimientos_retiro", sql`((decision)::text = 'retirado'::text) = (retirado_en IS NOT NULL)`),
]);

export const tokensRecuperacion = pgTable("tokens_recuperacion", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "tokens_recuperacion_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	usuarioId: integer("usuario_id").notNull(),
	token: varchar({ length: 64 }).notNull(),
	usado: boolean().default(false).notNull(),
	expiraEn: timestamp("expira_en", { mode: 'string' }).notNull(),
	creadoEn: timestamp("creado_en", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	index("idx_tokens_recuperacion_usuario_id").using("btree", table.usuarioId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "fk_tokens_recuperacion_usuario_id"
		}).onDelete("cascade"),
	unique("uq_tokens_recuperacion_token").on(table.token),
]);

export const reclamaciones = pgTable("reclamaciones", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "reclamaciones_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	codigo: varchar({ length: 20 }),
	fechaRegistro: timestamp("fecha_registro", { mode: 'string' }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
	fechaLimite: date("fecha_limite").notNull(),
	consumidorNombre: varchar("consumidor_nombre", { length: 150 }).notNull(),
	consumidorDocTipo: varchar("consumidor_doc_tipo", { length: 5 }).notNull(),
	consumidorDocumento: varchar("consumidor_documento", { length: 20 }).notNull(),
	consumidorDomicilio: varchar("consumidor_domicilio", { length: 250 }).notNull(),
	consumidorTelefono: varchar("consumidor_telefono", { length: 30 }).notNull(),
	consumidorEmail: varchar("consumidor_email", { length: 150 }).notNull(),
	apoderadoNombre: varchar("apoderado_nombre", { length: 150 }),
	bienTipo: varchar("bien_tipo", { length: 10 }).notNull(),
	bienDescripcion: varchar("bien_descripcion", { length: 400 }).notNull(),
	montoReclamado: numeric("monto_reclamado", { precision: 10, scale:  2 }),
	numeroPedido: varchar("numero_pedido", { length: 40 }),
	tipo: varchar({ length: 10 }).notNull(),
	detalle: text().notNull(),
	pedidoConsumidor: text("pedido_consumidor").notNull(),
	estado: varchar({ length: 15 }).default('pendiente').notNull(),
	respuesta: text(),
	fechaRespuesta: timestamp("fecha_respuesta", { mode: 'string' }),
	respondidoPor: integer("respondido_por"),
}, (table) => [
	index("idx_reclamaciones_estado_limite").using("btree", table.estado.asc().nullsLast().op("date_ops"), table.fechaLimite.asc().nullsLast().op("date_ops")),
	index("idx_reclamaciones_respondido_por").using("btree", table.respondidoPor.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.respondidoPor],
			foreignColumns: [usuarios.id],
			name: "fk_reclamaciones_respondido_por"
		}).onDelete("set null"),
	unique("uq_reclamaciones_codigo").on(table.codigo),
	check("chk_reclamaciones_bien_tipo", sql`(bien_tipo)::text = ANY ((ARRAY['producto'::character varying, 'servicio'::character varying])::text[])`),
	check("chk_reclamaciones_doc_tipo", sql`(consumidor_doc_tipo)::text = 'DNI'::text`),
	check("chk_reclamaciones_estado", sql`(estado)::text = ANY ((ARRAY['pendiente'::character varying, 'respondido'::character varying])::text[])`),
	check("chk_reclamaciones_tipo", sql`(tipo)::text = ANY ((ARRAY['reclamo'::character varying, 'queja'::character varying])::text[])`),
]);
