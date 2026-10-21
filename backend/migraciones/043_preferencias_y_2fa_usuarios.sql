-- Mi Cuenta > Configuración: preferencias de correo, verificación en dos pasos
-- (TOTP) y marca de cuenta eliminada (anonimizada).

ALTER TABLE usuarios
    ADD COLUMN acepta_promociones TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN totp_secreto VARCHAR(255) NULL,
    ADD COLUMN totp_activo TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN totp_ultimo_paso BIGINT NULL,
    ADD COLUMN codigos_respaldo TEXT NULL,
    ADD COLUMN eliminado_en DATETIME NULL;
