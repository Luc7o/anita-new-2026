-- Recojo en tienda con verificación: nuevo estado "listo_recojo" y un código
-- de 6 dígitos que el cliente le dice al personal para retirar su pedido.
-- Ejecutar con aplicar_migraciones.py (se aplica una sola vez).

ALTER TABLE pedidos
    ADD COLUMN codigo_recojo CHAR(6) NULL;

-- La restricción CHECK del estado no conocía "listo_recojo": se reemplaza.
ALTER TABLE pedidos DROP CONSTRAINT chk_pedidos_estado;

ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_estado CHECK (estado IN ('pendiente','confirmado','preparando','listo_recojo','enviado','entregado','cancelado'));
