-- Antes: borrar un usuario borraba en cascada TODOS sus pedidos (y con ellos
-- sus pagos e historial). Ahora la base de datos lo impide mientras existan
-- pedidos: las cuentas se desactivan o se anonimizan, nunca se borran.

ALTER TABLE pedidos DROP FOREIGN KEY pedidos_ibfk_1;

ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT;
