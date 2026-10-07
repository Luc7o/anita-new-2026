-- Checkout como invitado (sprint 1, tarea 4).
--
-- La arquitectura actual ata el carrito y el checkout a un usuario_id
-- autenticado en CADA endpoint (@requiere_activo exige JWT desde que se
-- agrega el primer producto al carrito, no solo al pagar). Reconstruir eso
-- para que funcione sin ninguna cuenta de por medio (carrito anónimo por
-- sesión, fusión de carritos, etc.) es un cambio de arquitectura grande.
--
-- Como alternativa mínima: la cuenta se sigue creando por dentro, pero SIN
-- pedir contraseña — la persona solo da nombre/apellido/email y ya puede
-- comprar (recibe sesión JWT igual que en un registro normal, así el resto
-- del sitio no necesita saber que es una cuenta de invitado). Ponerle
-- contraseña a esa cuenta para poder volver a entrar después se ofrece
-- recién en la confirmación del pedido, nunca se exige antes de comprar.
ALTER TABLE usuarios
    MODIFY COLUMN password_hash VARCHAR(255) NULL,
    ADD COLUMN es_invitado BOOLEAN NOT NULL DEFAULT FALSE;
