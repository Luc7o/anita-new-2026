-- ============================================================================
-- 050_quitar_roles_rrhh_auditor_soporte.sql
-- Elimina los roles "rrhh", "auditor" y "soporte": ya no existen en
-- backend/app/roles.py ni en el frontend (frontend/src/roles.js).
--
-- IMPORTANTE: antes de aplicar esta migración conviene revisar si algún
-- usuario todavía usa esos roles y reasignarlo desde el panel
-- "Usuarios y roles" al rol que corresponda:
--
--   SELECT u.id, u.email, r.codigo
--   FROM usuarios u JOIN roles r ON r.id = u.rol_id
--   WHERE r.codigo IN ('rrhh', 'auditor', 'soporte')
--
-- Si aun así queda alguno, el paso 1 lo pasa a "cliente": pierde el acceso al
-- panel admin pero conserva su cuenta y sus pedidos. No se borra ningún usuario.
-- ============================================================================

-- 1) Los usuarios que todavía tengan alguno de estos roles pasan a "cliente".
UPDATE usuarios
SET rol_id = (SELECT id FROM roles WHERE codigo = 'cliente'),
    es_admin = 0
WHERE rol_id IN (SELECT id FROM roles WHERE codigo IN ('rrhh', 'auditor', 'soporte'));

-- 2) Ya sin usuarios apuntando a ellos, se borran del catálogo de roles.
DELETE FROM roles WHERE codigo IN ('rrhh', 'auditor', 'soporte');
