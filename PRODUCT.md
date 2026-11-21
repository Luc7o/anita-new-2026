# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Clientas de la tienda (principal):** mujeres adultas, de 25 a 50 años aproximadamente, de Huancayo (Junín, Perú). Buscan carteras, calzado, mochilas y accesorios para el día a día. Compran desde el celular y desde la computadora en proporción parecida.
- **Personal del panel de administración:** el uso se reparte por igual entre dos escenas:
  - Mostrador: cajera en tablet o celular, haciendo venta presencial y entregando recojos con prisa y con la clienta delante.
  - Gestión: dueña o administración en computadora, revisando dashboard, productos, pedidos, compras, almacén y reportes.
- **Roles del panel:** superadmin, administrativo, ventas (pedidos online), almacén (stock, kardex, compras) y cajero (venta presencial y recojos). Cada rol ve solo lo que le corresponde (`frontend/src/roles.js`).

## Product Purpose

Tienda en línea completa de Anita New Style: catálogo, carrito, checkout con pago real, pedidos con seguimiento, panel de administración y venta presencial. El éxito es que la clienta de Huancayo compre con la misma confianza que en el local, y que el equipo atienda pedidos online y ventas de mostrador desde un solo sistema.

## Positioning

Lo que una tienda genérica o un marketplace no puede copiar con verdad:

- **Tienda física real en Huancayo:** se puede ver el producto, recogerlo en el local y confiar porque el negocio existe.
- **Selección curada:** pocas piezas elegidas con criterio, no un catálogo infinito.
- **Precio accesible:** moda que se ve bien a precios que la clienta local puede pagar.
- **Atención cercana:** trato personal por WhatsApp y delivery local rápido.

## Operating Context

- **Compra online:** registro opcional con autocompletado por DNI/RUC; inicio de sesión con Google; compra sin cuenta.
- **Pago:** con Culqi, por tarjeta o Yape. El pedido se cancela si no se paga en el tiempo límite (20 minutos por defecto).
- **Entrega:**
  - delivery a domicilio (S/ 10);
  - recojo en tienda con código de 6 dígitos;
  - venta en mostrador.
- **Seguimiento:** el pedido se sigue por estados (pendiente → confirmado → preparando → enviado / listo para recoger → entregado, o cancelado). Hay boleta en PDF y correos vía Resend.
- **Libro de Reclamaciones:** obligatorio por Indecopi, con plazo legal de respuesta.
- **Separación de dominios:** la tienda vive en `anita-new-style.xyz` y el panel puede publicarse aparte en `admin.anita-new-style.xyz`.

## Capabilities and Constraints

- **Stack:** React + Vite + Tailwind v4 (frontend), Flask + PostgreSQL (backend), en Vercel + Neon.
- **Tipos de producto:** con variantes (talla, color), ofertas y precio tachado, promociones de temporada, favoritos y reseñas con estrellas.
- **Panel:**
  - dashboard con KPI, pedidos, productos, categorías, compras y proveedores;
  - almacén (stock, kardex, inventario físico);
  - promociones, reclamaciones, usuarios y roles, reportes;
  - venta presencial (POS), recojos en tienda y configuración.
- **Temas:** tanto la tienda como el panel tienen modo claro y oscuro.
- **Idioma y moneda:** todo el texto de la interfaz está en español (Perú), con moneda en soles (`S/ 0.00`).

## Brand Commitments

- **Nombre:** "Anita New Style".
- **Logo:** existente, en `frontend/public/logo-anita-new-style.png`, con el magenta como color del logo.
- **Voz:** cercana, en tuteo ("Pide hoy y recíbelo en Huancayo").

## Evidence on Hand

- **Productos reales:** con fotos en Vercel Blob (convertidas a WebP con miniaturas).
- **Fotos de campaña:** en `frontend/src/assets/auth/` (por ejemplo, `login-hero.webp`).
- **Datos del proveedor:** para la Hoja de Reclamación y la boleta, configurados por variables de entorno.
- **Sin testimonios publicados ni cifras de ventas públicas:** no inventarlos.

## Product Principles

1. **Confianza local primero:** la tienda física, el recojo y la atención por WhatsApp son prueba, no adorno.
2. **Curado, no infinito:** mostrar menos piezas, mejor presentadas.
3. **Precio claro siempre:** el precio, el descuento y el costo de envío se ven antes de decidir.
4. **El mostrador no espera:** en el panel, la venta presencial y los recojos deben poder hacerse rápido y con el dedo.
5. **Un sistema, dos escenas:** el panel sirve igual de bien en tablet de mostrador que en laptop de gestión.

## Accessibility & Inclusion

- Contraste WCAG AA en ambos temas.
- Áreas táctiles de 44 px en celular y tablet.
- Respeto a "reducir movimiento".
- Formularios con etiquetas visibles: hay clientas mayores entre el público.
