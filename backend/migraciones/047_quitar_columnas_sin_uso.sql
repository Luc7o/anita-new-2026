-- Quita 14 columnas que ya no usa nadie: restos de versiones anteriores del
-- sistema (pagos manuales por comprobante, TuPay, ubicación en texto libre,
-- tallas y colores como texto). Se comprobó que están vacías en todas las filas
-- y el código que las leía ya no existe. La imagen del producto sale de la tabla
-- imagenes_producto.

ALTER TABLE carrito DROP COLUMN talla_legacy;

ALTER TABLE carrito DROP COLUMN color_legacy;

ALTER TABLE imagenes_producto DROP COLUMN color_legacy;

ALTER TABLE pedidos DROP COLUMN comprobante_url;

ALTER TABLE pedidos DROP COLUMN tarjeta_titular;

ALTER TABLE pedidos DROP COLUMN tarjeta_ultimos4;

ALTER TABLE pedidos DROP COLUMN tupay_deposit_id;

ALTER TABLE usuarios DROP COLUMN distrito_legacy;

ALTER TABLE usuarios DROP COLUMN provincia_legacy;

ALTER TABLE usuarios DROP COLUMN departamento_legacy;

ALTER TABLE usuarios DROP COLUMN rol_legacy;

ALTER TABLE variantes_producto DROP COLUMN talla_legacy;

ALTER TABLE variantes_producto DROP COLUMN color_legacy;

ALTER TABLE productos DROP COLUMN imagen_url;

