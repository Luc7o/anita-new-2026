-- Esta columna ya estaba en 000_esquema_base.sql, pero eso solo crea la tabla
-- completa en una base NUEVA (CREATE TABLE IF NOT EXISTS no toca tablas que ya
-- existen). En una base que ya tenía la tabla "pedidos" de antes, esa columna
-- nunca se agregó. Esta migración lo corrige para bases existentes.
ALTER TABLE pedidos ADD COLUMN idempotency_key VARCHAR(64) UNIQUE;
