-- Revocación de sesiones: cada usuario tiene un contador que se sube en
-- logout, cambio de contraseña y restablecimiento de contraseña. Todo
-- access/refresh token lleva grabado el valor de este contador al
-- momento en que se emitió (claim "sv"), y si ese valor no coincide con el
-- valor actual en esta columna, el token se trata como revocado sin
-- importar que su firma y su fecha de expiración sigan siendo válidas.

ALTER TABLE usuarios
    ADD COLUMN sesion_version INT NOT NULL DEFAULT 1;