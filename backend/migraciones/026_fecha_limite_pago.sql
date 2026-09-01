-- Ventana de pago: los pedidos de pasarela (tarjeta/Yape) reservan stock
-- solo hasta fecha_limite_pago. Pasado ese momento se cancelan y el stock
-- vuelve (job de cron y/o chequeo lazy al consultar el pedido).

ALTER TABLE pedidos
    ADD COLUMN fecha_limite_pago DATETIME NULL;
