-- pedidos.empresa_envio y pedidos.numero_seguimiento venian del proyecto anterior
-- (migraciones 000 y 010) y ya no las usa ni el backend ni el frontend: el
-- seguimiento del pedido vive en su estado y en historial_estado_pedido.
-- Antes de quitarlas se confirmo que estaban vacias en todos los pedidos.

ALTER TABLE pedidos DROP COLUMN empresa_envio;

ALTER TABLE pedidos DROP COLUMN numero_seguimiento;
