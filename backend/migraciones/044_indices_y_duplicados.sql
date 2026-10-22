-- Orden de índices. (1) Quita dos índices repetidos: ya existe un UNIQUE sobre
-- la misma columna, así que cada escritura los mantenía dos veces sin ganar nada.
-- (2) Agrega los índices que faltan para las consultas del dashboard y los
-- reportes (por fecha y por estado), y la limpieza de métricas antiguas.
-- (3) Hace único el id de cargo de Culqi para que un mismo cobro no se pueda
-- asociar a dos pedidos (los vacíos no cuentan: varios pedidos pueden no tener cargo).

ALTER TABLE usuarios DROP INDEX idx_usuarios_email;

ALTER TABLE tokens_recuperacion DROP INDEX idx_token_recuperacion;

ALTER TABLE pedidos ADD INDEX idx_pedidos_fecha_creacion (fecha_creacion);

ALTER TABLE pedidos ADD INDEX idx_pedidos_estado (estado, estado_pago);

ALTER TABLE pedidos ADD UNIQUE KEY uq_pedidos_culqi_cargo_id (culqi_cargo_id);

ALTER TABLE latencia_requests ADD INDEX idx_latencia_fecha (fecha_creacion);

ALTER TABLE evento_analitica ADD INDEX idx_evento_creado_en (creado_en);

ALTER TABLE movimiento_stock ADD INDEX idx_movimiento_stock_fecha (fecha_creacion);
