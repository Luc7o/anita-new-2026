-- usuarios.es_admin era una copia del rol (es_admin = el rol no es cliente) que el
-- codigo tenia que mantener a mano en cada cambio de rol: si uno cambiaba y el
-- otro no, los dos se contradecian. Los permisos ya se validan solo con el rol
-- (roles y rol_id). Ahora se deduce del rol en el modelo (Usuario.es_admin y
-- Usuario.clientes) y la columna se elimina.
-- Despliega el backend ANTES de aplicar esta migracion: el codigo nuevo ya no la usa.

ALTER TABLE usuarios DROP COLUMN es_admin;
