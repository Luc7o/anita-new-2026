-- El kardex (movimiento_stock) guarda la talla y el color de la variante en el
-- propio movimiento, igual que ya hacen detalles_pedido y detalle_compra. Antes, si
-- se eliminaba una variante, variante_id pasaba a NULL y el movimiento quedaba sin
-- decir de que talla y color era.
-- Los movimientos que ya existen se rellenan desde su variante. Los que ya
-- perdieron su variante antes de esta migracion no se pueden recuperar.
-- Despliega el backend DESPUES de aplicar esta migracion: el codigo nuevo usa las
-- columnas nuevas.

ALTER TABLE movimiento_stock ADD COLUMN talla VARCHAR(20) NULL AFTER variante_id;

ALTER TABLE movimiento_stock ADD COLUMN color VARCHAR(50) NULL AFTER talla;

UPDATE movimiento_stock m JOIN variantes_producto v ON v.id = m.variante_id JOIN tallas t ON t.id = v.talla_id JOIN colores c ON c.id = v.color_id SET m.talla = NULLIF(t.nombre, ''), m.color = NULLIF(c.nombre, '') WHERE m.talla IS NULL AND m.color IS NULL;
