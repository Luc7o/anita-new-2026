-- Guarda el deposit_id que TuPay asigna a cada pedido pagado con tarjeta o
-- Yape vía la pasarela, para poder consultar su estado (endpoint de estado,
-- o cuando llega la notificación del webhook) sin depender de nada más.
ALTER TABLE pedidos ADD COLUMN tupay_deposit_id INT;
