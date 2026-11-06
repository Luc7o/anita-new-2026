-- Reglas que la base no hacia cumplir y solo vivian en el codigo (como en la
-- migracion 046): cantidades positivas, importes no negativos, calificacion de
-- reseña entre 1 y 5, oferta menor al precio, fechas de promocion en orden y
-- valores validos en el libro de reclamaciones.
-- Si algun dia agregas un valor nuevo en el codigo (por ejemplo un tipo de
-- documento en reclamaciones), agregalo tambien en la restriccion que corresponda.

ALTER TABLE resenas ADD CONSTRAINT chk_resenas_calificacion CHECK (calificacion BETWEEN 1 AND 5);

ALTER TABLE carrito ADD CONSTRAINT chk_carrito_cantidad CHECK (cantidad > 0);

ALTER TABLE detalles_pedido ADD CONSTRAINT chk_detalles_pedido_cantidad CHECK (cantidad > 0);

ALTER TABLE detalles_pedido ADD CONSTRAINT chk_detalles_pedido_importes CHECK (precio_unit >= 0 AND subtotal >= 0);

ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_importes CHECK (subtotal >= 0 AND total >= 0 AND (costo_envio IS NULL OR costo_envio >= 0));

ALTER TABLE intento_pago ADD CONSTRAINT chk_intento_pago_monto CHECK (monto >= 0);

ALTER TABLE promocion_uso ADD CONSTRAINT chk_promocion_uso_monto CHECK (monto_descuento >= 0);

ALTER TABLE compras ADD CONSTRAINT chk_compras_total CHECK (total >= 0);

ALTER TABLE detalle_compra ADD CONSTRAINT chk_detcompra_subtotal CHECK (subtotal >= 0);

ALTER TABLE productos ADD CONSTRAINT chk_productos_oferta CHECK (precio_oferta IS NULL OR precio_oferta < precio);

ALTER TABLE promociones ADD CONSTRAINT chk_promociones_fechas CHECK (fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin >= fecha_inicio);

ALTER TABLE reclamaciones ADD CONSTRAINT chk_reclamaciones_tipo CHECK (tipo IN ('reclamo','queja'));

ALTER TABLE reclamaciones ADD CONSTRAINT chk_reclamaciones_bien_tipo CHECK (bien_tipo IN ('producto','servicio'));

ALTER TABLE reclamaciones ADD CONSTRAINT chk_reclamaciones_estado CHECK (estado IN ('pendiente','respondido'));

ALTER TABLE reclamaciones ADD CONSTRAINT chk_reclamaciones_doc_tipo CHECK (consumidor_doc_tipo IN ('DNI'));
