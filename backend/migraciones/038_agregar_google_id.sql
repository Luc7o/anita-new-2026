-- Login con Google: guarda el identificador ("sub") de la cuenta de Google
-- vinculada al usuario. Nullable porque las cuentas con email/contraseña y
-- las de invitado no lo tienen. UNIQUE para que una cuenta de Google solo
-- pueda estar asociada a un usuario.

ALTER TABLE usuarios
    ADD COLUMN google_id VARCHAR(40) NULL;

ALTER TABLE usuarios
    ADD UNIQUE INDEX uq_usuarios_google_id (google_id);
