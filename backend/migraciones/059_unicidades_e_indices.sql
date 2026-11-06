-- Unicidades que faltaban y limpieza de indices repetidos.
-- (1) Proveedores: un RUC identifica a una sola empresa. Antes de exigirlo se
--     limpian los vacios (''), que cuentan como valor y chocarian entre si.
-- (2) Compras: el mismo documento (tipo + numero) de un proveedor no puede
--     registrarse dos veces, porque duplicaria el ingreso de stock. Una compra
--     ANULADA no cuenta, asi se puede volver a registrar la factura correcta.
--     MySQL no tiene indices parciales, por eso se usa una columna calculada
--     que solo tiene valor cuando la compra esta recibida y tiene documento.
-- (3) promocion_uso: una promocion no se aplica dos veces al mismo pedido.
-- (4) Indices que otro indice ya cubre (mismo inicio de columnas) se eliminan.

UPDATE proveedores SET ruc = NULL WHERE ruc IS NOT NULL AND TRIM(ruc) = '';

UPDATE proveedores SET ruc = TRIM(ruc) WHERE ruc IS NOT NULL AND ruc <> TRIM(ruc);

ALTER TABLE proveedores ADD CONSTRAINT uq_proveedores_ruc UNIQUE (ruc);

UPDATE compras SET tipo_documento = NULL WHERE tipo_documento IS NOT NULL AND TRIM(tipo_documento) = '';

UPDATE compras SET numero_documento = NULL WHERE numero_documento IS NOT NULL AND TRIM(numero_documento) = '';

ALTER TABLE compras ADD COLUMN documento_unico VARCHAR(80) GENERATED ALWAYS AS (CASE WHEN estado = 'recibida' AND tipo_documento IS NOT NULL AND numero_documento IS NOT NULL THEN CONCAT(tipo_documento, '|', numero_documento) ELSE NULL END) VIRTUAL;

ALTER TABLE compras ADD CONSTRAINT uq_compras_documento UNIQUE (proveedor_id, documento_unico);

ALTER TABLE compras DROP INDEX idx_compras_proveedor;

ALTER TABLE promocion_uso ADD CONSTRAINT uq_promocion_uso_promocion_pedido UNIQUE (promocion_id, pedido_id);

ALTER TABLE promocion_uso DROP INDEX promocion_id;

ALTER TABLE movimiento_stock DROP INDEX idx_producto;
