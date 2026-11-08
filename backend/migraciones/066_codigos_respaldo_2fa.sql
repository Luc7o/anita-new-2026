-- Los codigos de respaldo del 2FA vivian como una LISTA dentro de una sola columna
-- (usuarios.codigos_respaldo, un JSON). Eso rompe la primera forma normal (varios
-- valores en un campo) y ademas gastar un codigo era leer la lista, quitar uno y
-- volver a guardarla: dos intentos simultaneos con el mismo codigo podian pasar
-- los dos. Ahora hay una tabla con una fila por codigo (solo su hash). Gastar un
-- codigo es un UPDATE que solo funciona si todavia no se uso, asi que pasa uno solo.
-- Los codigos que cada usuario tiene hoy se copian a la tabla nueva antes de
-- eliminar la columna: siguen sirviendo.
-- Despliega el backend DESPUES de aplicar esta migracion (el codigo nuevo usa la tabla).

CREATE TABLE IF NOT EXISTS codigos_respaldo (
    id INT NOT NULL AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    codigo_hash VARCHAR(64) NOT NULL,
    usado_en DATETIME NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_codigos_respaldo_usuario_hash UNIQUE (usuario_id, codigo_hash),
    CONSTRAINT fk_codigos_respaldo_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT chk_codigos_respaldo_hash CHECK (CHAR_LENGTH(codigo_hash) = 64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO codigos_respaldo (usuario_id, codigo_hash) SELECT u.id, jt.hash_codigo FROM usuarios u, JSON_TABLE(IF(JSON_VALID(u.codigos_respaldo), u.codigos_respaldo, '[]'), '$[*]' COLUMNS (hash_codigo VARCHAR(64) PATH '$')) jt WHERE u.codigos_respaldo IS NOT NULL;

ALTER TABLE usuarios DROP COLUMN codigos_respaldo;
