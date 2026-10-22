-- Reglas que hasta ahora vivían solo en el código, ahora también en la base:
-- (1) los campos de sí/no y las fechas de creación ya no aceptan vacío,
-- (2) el precio del producto usa el mismo tamaño que el resto del dinero,
-- (3) estados, métodos de pago, entrega, origen y género solo aceptan los
-- valores válidos, y el stock y los precios no pueden ser negativos.
-- Si algún día agregas un valor nuevo en el código (por ejemplo un estado de
-- pedido), agrégalo también en la restricción correspondiente.

UPDATE categorias SET activo = 1 WHERE activo IS NULL;
UPDATE productos SET destacado = 0 WHERE destacado IS NULL;
UPDATE productos SET es_nuevo = 1 WHERE es_nuevo IS NULL;
UPDATE productos SET activo = 1 WHERE activo IS NULL;
UPDATE promociones SET activo = 1 WHERE activo IS NULL;
UPDATE proveedor_productos SET activo = 1 WHERE activo IS NULL;
UPDATE proveedores SET activo = 1 WHERE activo IS NULL;
UPDATE resenas SET compra_verificada = 0 WHERE compra_verificada IS NULL;
UPDATE usuarios SET activo = 1 WHERE activo IS NULL;
UPDATE usuarios SET es_admin = 0 WHERE es_admin IS NULL;
UPDATE pedidos SET fecha_creacion = NOW() WHERE fecha_creacion IS NULL;
UPDATE productos SET fecha_creacion = NOW() WHERE fecha_creacion IS NULL;
UPDATE usuarios SET fecha_registro = NOW() WHERE fecha_registro IS NULL;

ALTER TABLE categorias MODIFY activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE productos MODIFY destacado TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE productos MODIFY es_nuevo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE productos MODIFY activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE promociones MODIFY activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE proveedor_productos MODIFY activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE proveedores MODIFY activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE resenas MODIFY compra_verificada TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE usuarios MODIFY activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE usuarios MODIFY es_admin TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE pedidos MODIFY fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE productos MODIFY fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE usuarios MODIFY fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE productos MODIFY precio DECIMAL(10,2) NOT NULL;

ALTER TABLE productos MODIFY precio_oferta DECIMAL(10,2) NULL DEFAULT NULL;

ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_estado CHECK (estado IN ('pendiente','confirmado','preparando','enviado','entregado','cancelado'));

ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_estado_pago CHECK (estado_pago IN ('pendiente','en_revision','verificado','rechazado','no_aplica','reembolso_pendiente','reembolsado'));

ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_metodo_pago CHECK (metodo_pago IN ('yape','tarjeta','efectivo'));

ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_tipo_entrega CHECK (tipo_entrega IN ('delivery','recojo'));

ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_origen CHECK (origen IN ('online','presencial'));

ALTER TABLE productos ADD CONSTRAINT chk_productos_genero CHECK (genero IS NULL OR genero IN ('mujer','hombre','unisex','nina','nino'));

ALTER TABLE productos ADD CONSTRAINT chk_productos_precio CHECK (precio >= 0 AND (precio_oferta IS NULL OR precio_oferta >= 0));

ALTER TABLE productos ADD CONSTRAINT chk_productos_stock CHECK (stock >= 0);

ALTER TABLE variantes_producto ADD CONSTRAINT chk_variantes_stock CHECK (stock >= 0);
