-- Registro de la aceptacion de Terminos y Condiciones y Politica de Privacidad.
--
-- Guarda CUANDO acepto la persona y QUE version de los textos vio, para poder demostrarlo.
-- Las cuentas creadas antes de esta migracion quedan en NULL (no hay registro de su aceptacion):
-- no se inventa una fecha. La version es la de app/utils/legal.py (VERSION_TERMINOS).

ALTER TABLE usuarios ADD COLUMN acepto_terminos_en timestamp;
ALTER TABLE usuarios ADD COLUMN version_terminos varchar(20);

-- Si hay fecha, tiene que haber version (y al reves).
ALTER TABLE usuarios ADD CONSTRAINT chk_usuarios_aceptacion_completa
    CHECK ((acepto_terminos_en IS NULL) = (version_terminos IS NULL));
