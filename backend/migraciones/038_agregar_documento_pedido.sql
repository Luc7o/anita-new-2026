-- Documento de identidad (DNI o RUC) de quien recibe/compra el pedido.
-- Se guarda en el pedido (no en el usuario) porque cada compra puede
-- hacerse con un documento distinto, por ejemplo con RUC para factura.
-- Son NULL-ables porque los pedidos anteriores y las ventas presenciales
-- del admin no tienen este dato.
ALTER TABLE pedidos ADD COLUMN envio_tipo_documento VARCHAR(10) NULL;
ALTER TABLE pedidos ADD COLUMN envio_numero_documento VARCHAR(15) NULL;
