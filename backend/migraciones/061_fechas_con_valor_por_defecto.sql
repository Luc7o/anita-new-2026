-- Todas las fechas de creacion quedan NOT NULL con valor por defecto, como ya
-- estaban pedidos, productos y usuarios (migracion 046). Asi un INSERT directo
-- (una migracion, un script) no falla ni deja la fecha vacia.

ALTER TABLE favoritos MODIFY fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE imagenes_producto MODIFY fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE proveedores MODIFY fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE proveedor_productos MODIFY fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE resenas MODIFY fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE resenas MODIFY fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE promociones MODIFY fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE promociones MODIFY fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE tokens_recuperacion MODIFY creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE compras SET fecha_creacion = NOW() WHERE fecha_creacion IS NULL;

ALTER TABLE compras MODIFY fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
