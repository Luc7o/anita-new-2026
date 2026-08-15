ALTER TABLE pedidos ADD COLUMN estado_pago VARCHAR(20) NOT NULL DEFAULT 'pendiente';
ALTER TABLE pedidos ADD COLUMN comprobante_url VARCHAR(400);

-- Los pedidos que ya existían con tarjeta/efectivo no necesitan comprobante
UPDATE pedidos SET estado_pago = 'no_aplica' WHERE metodo_pago IN ('tarjeta', 'efectivo');
