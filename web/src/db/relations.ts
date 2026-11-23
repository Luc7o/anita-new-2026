import { relations } from "drizzle-orm/relations";
import { usuarios, favoritos, productos, categorias, pedidos, ubigeoDistritos, ubigeoDepartamentos, ubigeoProvincias, colores, imagenesProducto, promociones, eventoAnalitica, proveedorProductos, proveedores, detalleCompra, variantesProducto, compras, detallesPedido, historialEstadoPedido, codigosRespaldo, carrito, tallas, intentoPago, resenas, promocionUso, movimientoStock, refreshTokens, roles, tokensRecuperacion, reclamaciones } from "./schema";

export const favoritosRelations = relations(favoritos, ({one}) => ({
	usuario: one(usuarios, {
		fields: [favoritos.usuarioId],
		references: [usuarios.id]
	}),
	producto: one(productos, {
		fields: [favoritos.productoId],
		references: [productos.id]
	}),
}));

export const usuariosRelations = relations(usuarios, ({one, many}) => ({
	favoritos: many(favoritos),
	pedidos: many(pedidos),
	eventoAnaliticas: many(eventoAnalitica),
	historialEstadoPedidos: many(historialEstadoPedido),
	codigosRespaldos: many(codigosRespaldo),
	carritos: many(carrito),
	resenas: many(resenas),
	promocionUsos: many(promocionUso),
	compras_anuladaPor: many(compras, {
		relationName: "compras_anuladaPor_usuarios_id"
	}),
	compras_usuarioId: many(compras, {
		relationName: "compras_usuarioId_usuarios_id"
	}),
	movimientoStocks: many(movimientoStock),
	refreshTokens: many(refreshTokens),
	ubigeoDistrito: one(ubigeoDistritos, {
		fields: [usuarios.distritoId],
		references: [ubigeoDistritos.id]
	}),
	role: one(roles, {
		fields: [usuarios.rolId],
		references: [roles.id]
	}),
	tokensRecuperacions: many(tokensRecuperacion),
	reclamaciones: many(reclamaciones),
}));

export const productosRelations = relations(productos, ({one, many}) => ({
	favoritos: many(favoritos),
	categoria: one(categorias, {
		fields: [productos.categoriaId],
		references: [categorias.id]
	}),
	imagenesProductos: many(imagenesProducto),
	promociones: many(promociones),
	eventoAnaliticas: many(eventoAnalitica),
	proveedorProductos: many(proveedorProductos),
	detalleCompras: many(detalleCompra),
	detallesPedidos: many(detallesPedido),
	variantesProductos: many(variantesProducto),
	resenas: many(resenas),
	movimientoStocks: many(movimientoStock),
}));

export const categoriasRelations = relations(categorias, ({many}) => ({
	productos: many(productos),
}));

export const pedidosRelations = relations(pedidos, ({one, many}) => ({
	usuario: one(usuarios, {
		fields: [pedidos.usuarioId],
		references: [usuarios.id]
	}),
	ubigeoDistrito: one(ubigeoDistritos, {
		fields: [pedidos.distritoId],
		references: [ubigeoDistritos.id]
	}),
	detallesPedidos: many(detallesPedido),
	historialEstadoPedidos: many(historialEstadoPedido),
	intentoPagos: many(intentoPago),
	promocionUsos: many(promocionUso),
	movimientoStocks: many(movimientoStock),
}));

export const ubigeoDistritosRelations = relations(ubigeoDistritos, ({one, many}) => ({
	pedidos: many(pedidos),
	ubigeoProvincia: one(ubigeoProvincias, {
		fields: [ubigeoDistritos.provinciaId],
		references: [ubigeoProvincias.id]
	}),
	usuarios: many(usuarios),
}));

export const ubigeoProvinciasRelations = relations(ubigeoProvincias, ({one, many}) => ({
	ubigeoDepartamento: one(ubigeoDepartamentos, {
		fields: [ubigeoProvincias.departamentoId],
		references: [ubigeoDepartamentos.id]
	}),
	ubigeoDistritos: many(ubigeoDistritos),
}));

export const ubigeoDepartamentosRelations = relations(ubigeoDepartamentos, ({many}) => ({
	ubigeoProvincias: many(ubigeoProvincias),
}));

export const imagenesProductoRelations = relations(imagenesProducto, ({one}) => ({
	colore: one(colores, {
		fields: [imagenesProducto.colorId],
		references: [colores.id]
	}),
	producto: one(productos, {
		fields: [imagenesProducto.productoId],
		references: [productos.id]
	}),
}));

export const coloresRelations = relations(colores, ({many}) => ({
	imagenesProductos: many(imagenesProducto),
	variantesProductos: many(variantesProducto),
}));

export const promocionesRelations = relations(promociones, ({one, many}) => ({
	producto: one(productos, {
		fields: [promociones.productoId],
		references: [productos.id]
	}),
	promocionUsos: many(promocionUso),
}));

export const eventoAnaliticaRelations = relations(eventoAnalitica, ({one}) => ({
	producto: one(productos, {
		fields: [eventoAnalitica.productoId],
		references: [productos.id]
	}),
	usuario: one(usuarios, {
		fields: [eventoAnalitica.usuarioId],
		references: [usuarios.id]
	}),
}));

export const proveedorProductosRelations = relations(proveedorProductos, ({one}) => ({
	producto: one(productos, {
		fields: [proveedorProductos.productoId],
		references: [productos.id]
	}),
	proveedore: one(proveedores, {
		fields: [proveedorProductos.proveedorId],
		references: [proveedores.id]
	}),
}));

export const proveedoresRelations = relations(proveedores, ({many}) => ({
	proveedorProductos: many(proveedorProductos),
	compras: many(compras),
	movimientoStocks: many(movimientoStock),
}));

export const detalleCompraRelations = relations(detalleCompra, ({one}) => ({
	producto: one(productos, {
		fields: [detalleCompra.productoId],
		references: [productos.id]
	}),
	variantesProducto: one(variantesProducto, {
		fields: [detalleCompra.varianteId],
		references: [variantesProducto.id]
	}),
	compra: one(compras, {
		fields: [detalleCompra.compraId],
		references: [compras.id]
	}),
}));

export const variantesProductoRelations = relations(variantesProducto, ({one, many}) => ({
	detalleCompras: many(detalleCompra),
	detallesPedidos: many(detallesPedido),
	carritos: many(carrito),
	colore: one(colores, {
		fields: [variantesProducto.colorId],
		references: [colores.id]
	}),
	talla: one(tallas, {
		fields: [variantesProducto.tallaId],
		references: [tallas.id]
	}),
	producto: one(productos, {
		fields: [variantesProducto.productoId],
		references: [productos.id]
	}),
	movimientoStocks: many(movimientoStock),
}));

export const comprasRelations = relations(compras, ({one, many}) => ({
	detalleCompras: many(detalleCompra),
	usuario_anuladaPor: one(usuarios, {
		fields: [compras.anuladaPor],
		references: [usuarios.id],
		relationName: "compras_anuladaPor_usuarios_id"
	}),
	proveedore: one(proveedores, {
		fields: [compras.proveedorId],
		references: [proveedores.id]
	}),
	usuario_usuarioId: one(usuarios, {
		fields: [compras.usuarioId],
		references: [usuarios.id],
		relationName: "compras_usuarioId_usuarios_id"
	}),
	movimientoStocks: many(movimientoStock),
}));

export const detallesPedidoRelations = relations(detallesPedido, ({one}) => ({
	pedido: one(pedidos, {
		fields: [detallesPedido.pedidoId],
		references: [pedidos.id]
	}),
	producto: one(productos, {
		fields: [detallesPedido.productoId],
		references: [productos.id]
	}),
	variantesProducto: one(variantesProducto, {
		fields: [detallesPedido.varianteId],
		references: [variantesProducto.id]
	}),
}));

export const historialEstadoPedidoRelations = relations(historialEstadoPedido, ({one}) => ({
	pedido: one(pedidos, {
		fields: [historialEstadoPedido.pedidoId],
		references: [pedidos.id]
	}),
	usuario: one(usuarios, {
		fields: [historialEstadoPedido.cambiadoPor],
		references: [usuarios.id]
	}),
}));

export const codigosRespaldoRelations = relations(codigosRespaldo, ({one}) => ({
	usuario: one(usuarios, {
		fields: [codigosRespaldo.usuarioId],
		references: [usuarios.id]
	}),
}));

export const carritoRelations = relations(carrito, ({one}) => ({
	usuario: one(usuarios, {
		fields: [carrito.usuarioId],
		references: [usuarios.id]
	}),
	variantesProducto: one(variantesProducto, {
		fields: [carrito.varianteId],
		references: [variantesProducto.id]
	}),
}));

export const tallasRelations = relations(tallas, ({many}) => ({
	variantesProductos: many(variantesProducto),
}));

export const intentoPagoRelations = relations(intentoPago, ({one}) => ({
	pedido: one(pedidos, {
		fields: [intentoPago.pedidoId],
		references: [pedidos.id]
	}),
}));

export const resenasRelations = relations(resenas, ({one}) => ({
	producto: one(productos, {
		fields: [resenas.productoId],
		references: [productos.id]
	}),
	usuario: one(usuarios, {
		fields: [resenas.usuarioId],
		references: [usuarios.id]
	}),
}));

export const promocionUsoRelations = relations(promocionUso, ({one}) => ({
	promocione: one(promociones, {
		fields: [promocionUso.promocionId],
		references: [promociones.id]
	}),
	pedido: one(pedidos, {
		fields: [promocionUso.pedidoId],
		references: [pedidos.id]
	}),
	usuario: one(usuarios, {
		fields: [promocionUso.usuarioId],
		references: [usuarios.id]
	}),
}));

export const movimientoStockRelations = relations(movimientoStock, ({one}) => ({
	pedido: one(pedidos, {
		fields: [movimientoStock.pedidoId],
		references: [pedidos.id]
	}),
	compra: one(compras, {
		fields: [movimientoStock.compraId],
		references: [compras.id]
	}),
	proveedore: one(proveedores, {
		fields: [movimientoStock.proveedorId],
		references: [proveedores.id]
	}),
	usuario: one(usuarios, {
		fields: [movimientoStock.usuarioId],
		references: [usuarios.id]
	}),
	variantesProducto: one(variantesProducto, {
		fields: [movimientoStock.varianteId],
		references: [variantesProducto.id]
	}),
	producto: one(productos, {
		fields: [movimientoStock.productoId],
		references: [productos.id]
	}),
}));

export const refreshTokensRelations = relations(refreshTokens, ({one}) => ({
	usuario: one(usuarios, {
		fields: [refreshTokens.usuarioId],
		references: [usuarios.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	usuarios: many(usuarios),
}));

export const tokensRecuperacionRelations = relations(tokensRecuperacion, ({one}) => ({
	usuario: one(usuarios, {
		fields: [tokensRecuperacion.usuarioId],
		references: [usuarios.id]
	}),
}));

export const reclamacionesRelations = relations(reclamaciones, ({one}) => ({
	usuario: one(usuarios, {
		fields: [reclamaciones.respondidoPor],
		references: [usuarios.id]
	}),
}));