-- ============================================================================
-- 051_rol_cajero.sql
-- Agrega el rol "cajero": solo registra ventas presenciales (Nueva venta) y
-- consulta pedidos/boletas. No ve el dashboard, reportes, productos (como
-- sección), usuarios ni configuración.
--
-- Sin esta migración el backend rechaza asignar el rol (ValueError: "Rol
-- inválido"), porque usuario.py valida el código contra la tabla `roles`.
-- Es seguro ejecutarla más de una vez (INSERT IGNORE).
-- ============================================================================

INSERT IGNORE INTO roles (codigo, nombre) VALUES
    ('cajero', 'Cajero');
