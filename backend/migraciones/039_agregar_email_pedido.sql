-- Correo de contacto del pedido, obligatorio en el checkout desde ahora.
-- Se guarda en el pedido (no solo en la cuenta) porque cada compra puede
-- hacerse con un correo distinto. Es NULL-able porque los pedidos
-- anteriores y las ventas presenciales del admin no tienen este dato.
ALTER TABLE pedidos ADD COLUMN envio_email VARCHAR(120) NULL;
