-- Bloqueo de cuenta por intentos fallidos de login. A propósito NO usa
-- Redis ni memoria: vive en la misma MySQL de producción, así que
-- funciona igual sin importar si REDIS_URL está configurado, y es
-- consistente entre todas las instancias serverless (a diferencia de un
-- contador en memoria, que cada instancia lleva por su cuenta).

ALTER TABLE usuarios
    ADD COLUMN intentos_fallidos_login INT NOT NULL DEFAULT 0,
    ADD COLUMN bloqueado_hasta DATETIME NULL;
