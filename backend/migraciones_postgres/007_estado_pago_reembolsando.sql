-- Estado de pago intermedio "reembolsando".
--
-- Se guarda ANTES de pedirle el reembolso a Culqi. Si Culqi reembolsa pero algo falla después
-- (timeout, error al guardar), el pedido queda en "reembolsando" y no en "reembolso_pendiente":
-- así nadie vuelve a apretar "Marcar como reembolsado" y le devuelve el dinero dos veces. Desde
-- el panel se revisa en Culqi y se confirma.

ALTER TABLE pedidos DROP CONSTRAINT chk_pedidos_estado_pago;
ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_estado_pago CHECK (
    estado_pago IN ('pendiente', 'en_revision', 'verificado', 'rechazado', 'no_aplica',
                    'reembolso_pendiente', 'reembolsando', 'reembolsado')
);
