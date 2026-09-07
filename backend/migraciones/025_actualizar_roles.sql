-- ============================================================================
-- 023_actualizar_roles.sql
-- Agrega los roles nuevos del rediseño por área de negocio: Administrativo,
-- Ventas, Almacén y RRHH. Ya no se usan en el código (backend/app/roles.py)
-- los roles "moderador" y "editor", pero esta migración NO los borra ni
-- reasigna ningún usuario — eso se hace manualmente desde el panel
-- "Usuarios y roles" una vez que el rol de destino (ej. Administrativo) ya
-- existe en la tabla.
--
-- Sin esta migración, el backend rechaza cualquier intento de asignar estos
-- roles nuevos (ValueError: "Rol inválido"), porque usuario.py valida el
-- código contra esta tabla, no contra el diccionario ROLES de Python.
-- ============================================================================

INSERT IGNORE INTO roles (codigo, nombre) VALUES
    ('administrativo', 'Administrativo'),
    ('ventas', 'Ventas'),
    ('almacen', 'Almacén'),
    ('rrhh', 'RRHH');

-- Nota para más adelante (NO se ejecuta acá): una vez que ya no quede
-- ningún usuario con rol_id apuntando a "moderador" o "editor" (confirmar
-- con la consulta de abajo), esas dos filas se pueden borrar de "roles"
-- sin problema, porque ya no están en el diccionario ROLES del backend.
--
--   SELECT u.id, u.email, r.codigo
--   FROM usuarios u JOIN roles r ON r.id = u.rol_id
--   WHERE r.codigo IN ('moderador', 'editor');