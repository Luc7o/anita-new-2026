-- Refresh tokens de un solo uso (rotación real).
--
-- Antes, cada /auth/refrescar-token emitía un refresh nuevo pero el anterior seguía valiendo
-- sus 30 días: una cookie robada servía todo ese tiempo aunque la dueña siguiera usando la suya.
-- Ahora cada refresh emitido queda anotado por su jti (identificador único del JWT):
--  * al usarse, se marca usado_en y se emite uno nuevo;
--  * si alguien presenta uno YA usado (fuera de un margen corto para pestañas que refrescan a la
--    vez), se toma como robo: se cierran todas las sesiones de esa cuenta.
-- Las filas vencidas se borran en el cron diario de mantenimiento.

CREATE TABLE refresh_tokens (
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (jti),
    jti varchar(64) NOT NULL,
    usuario_id integer NOT NULL,
    creado_en timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    expira_en timestamp NOT NULL,
    usado_en timestamp,
    CONSTRAINT fk_refresh_tokens_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
);
CREATE INDEX idx_refresh_tokens_usuario ON refresh_tokens (usuario_id);
CREATE INDEX idx_refresh_tokens_expira ON refresh_tokens (expira_en);
