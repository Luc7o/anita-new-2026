-- Venta presencial (mostrador): un pedido registrado por un admin en la
-- tienda física, pagado ahí mismo (efectivo, Yape o tarjeta física), sin
-- pasar por el checkout ni la pasarela Culqi.
--
-- usuario_id pasa a ser opcional porque una venta presencial puede no tener
-- una cuenta de cliente detrás (cliente que entra, compra y se va, sin
-- registrarse) — en ese caso el nombre/teléfono quedan en
-- envio_nombre/envio_telefono igual que cualquier pedido, solo que sin
-- cuenta asociada.
--
-- origen distingue "online" (checkout público) de "presencial" (mostrador),
-- para poder filtrar y desglosar el reporte de ventas por canal.
ALTER TABLE pedidos MODIFY COLUMN usuario_id INT NULL;
ALTER TABLE pedidos ADD COLUMN origen VARCHAR(20) NOT NULL DEFAULT 'online';
