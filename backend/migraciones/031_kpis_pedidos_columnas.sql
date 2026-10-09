-- KPIs: columnas nuevas en pedidos para medir tiempos (pago, entrega),
-- motivo de cancelación y ubicación normalizada del envío.
--
-- NOTA: NO se agrega pedido_invitado_origen_id. En este proyecto el
-- checkout de invitado no crea un pedido "huérfano" que luego se re-ligue
-- a una cuenta nueva: crea la cuenta (usuarios.es_invitado=TRUE) desde el
-- primer momento y el pedido ya queda con ese usuario_id real (ver
-- 024_agregar_checkout_invitado.sql). No hay nada que cruzar después.
ALTER TABLE pedidos
    ADD COLUMN fecha_pago DATETIME NULL,
    ADD COLUMN fecha_entregado DATETIME NULL,
    ADD COLUMN motivo_cancelacion VARCHAR(50) NULL,
    ADD COLUMN distrito_id INT NULL,
    ADD FOREIGN KEY (distrito_id) REFERENCES ubigeo_distritos(id);
