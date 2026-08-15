-- Solo guardamos el titular y los últimos 4 dígitos como referencia visual.
-- El número completo de tarjeta y el CVV nunca se guardan en la base de datos.
ALTER TABLE pedidos ADD COLUMN tarjeta_titular VARCHAR(160);
ALTER TABLE pedidos ADD COLUMN tarjeta_ultimos4 VARCHAR(4);
