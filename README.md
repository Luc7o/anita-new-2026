# Anita New Style

Tienda en línea completa para una tienda de moda de Huancayo, Perú: catálogo,
carrito, checkout con pago real, pedidos con seguimiento, panel de
administración y venta presencial.

- **Backend**: Flask + SQLAlchemy + MySQL, autenticación con JWT
- **Frontend**: React + Vite + Tailwind
- **Pagos**: Culqi (tarjeta y Yape)
- **Correos**: Resend
- **Imágenes**: Vercel Blob (se convierten a WebP con miniaturas)
- **Hosting**: Vercel (frontend y backend por separado) + Railway (MySQL y Redis)

```
anita-new-2026/
  backend/   → API Flask
  frontend/  → React + Vite + Tailwind
```

La tienda vive en `anita-new-style.xyz` y el panel de administración puede
publicarse aparte en `admin.anita-new-style.xyz` (ver
[Tienda y panel en dominios separados](#tienda-y-panel-en-dominios-separados)).

## Puesta en marcha local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate
pip install -r requirements.txt
# Crea un archivo .env con las variables de la tabla de abajo
python aplicar_migraciones.py   # crea/actualiza las tablas
python run.py
```

Corre en `http://localhost:5000`. Prueba: `http://localhost:5000/api/salud`

Para cargar productos de ejemplo (sin imágenes; las subes después desde el
panel) puedes usar `python seed_productos_reales.py`. Requiere que las
categorías ya existan.

### Frontend

```bash
cd frontend
npm install
# Crea un archivo .env con las variables de la tabla de abajo
npm run dev
```

Corre en `http://localhost:5173`.

### Variables de entorno — backend (`.env`)

| Variable | Para qué |
|---|---|
| `SECRET_KEY` / `JWT_SECRET_KEY` | Firma de sesión y de los tokens JWT |
| `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` / `DB_NAME` | Conexión a MySQL |
| `FRONTEND_TIENDA_URL` | URL del frontend de la tienda (enlaces de los correos) |
| `COOKIE_DOMAIN` | Opcional. Con `.anita-new-style.xyz` la cookie de sesión se comparte entre tienda y admin. Vacío en local |
| `REDIS_URL` | Backend del rate limiter. En local puede quedar vacío; en producción es obligatorio (ver más abajo) |
| `REQUIRE_REDIS_EN_PROD` | Opcional. En `true`, el backend no arranca en producción sin `REDIS_URL` |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Envío de correos vía [Resend](https://resend.com). Si `RESEND_API_KEY` queda vacío, los correos se imprimen en la consola de `python run.py` |
| `API_PERU_TOKEN` / `API_PERU_BASE_URL` | Autocompletar datos con DNI/RUC. Si el token queda vacío, el registro funciona igual sin autocompletar |
| `CULQI_SECRET_KEY` / `CULQI_BASE_URL` | Llave privada de Culqi (cobros y reembolsos) |
| `MINUTOS_LIMITE_PAGO` | Minutos que tiene el cliente para pagar con tarjeta o Yape antes de que el pedido se cancele (por defecto 20) |
| `GOOGLE_CLIENT_ID` | Inicio de sesión con Google |
| `CRON_SECRET` | Clave que protege los endpoints de tareas programadas |
| `CACHE_EDGE` | Opcional. En `true` permite que el CDN guarde en caché respuestas públicas |
| `PROVEEDOR_RAZON_SOCIAL` / `PROVEEDOR_RUC` / `PROVEEDOR_DOMICILIO` / `RECLAMOS_EMAIL_DESTINO` | Datos de la Hoja de Reclamación (deben coincidir con lo registrado en Indecopi) |
| `BOLETA_EMAIL` / `BOLETA_TELEFONO` / `BOLETA_POLITICA_CAMBIOS` | Textos que aparecen en la boleta en PDF |
| `KPI_LATENCIA_SAMPLE_RATE` | Opcional. Porcentaje (0 a 1) de peticiones cuya latencia se registra para los KPI |

El token de Vercel Blob para subir imágenes lo configura la propia
integración de Blob en el proyecto de Vercel.

### Variables de entorno — frontend (`.env`)

| Variable | Para qué |
|---|---|
| `VITE_API_URL` | URL del backend (`http://localhost:5000/api` en local) |
| `VITE_CULQI_PUBLIC_KEY` | Llave pública de Culqi, para tokenizar la tarjeta en el navegador |
| `VITE_GOOGLE_CLIENT_ID` | Inicio de sesión con Google |
| `VITE_WHATSAPP_SOPORTE` | Número de WhatsApp de soporte (con código de país) |
| `VITE_ADMIN_URL` | Solo tienda, opcional: URL del panel si está en su propio dominio |
| `VITE_APP_MODE` | Solo proyecto del panel: `admin` |
| `VITE_TIENDA_URL` | Solo proyecto del panel, opcional: botón "Ver tienda" |

### Redis en producción (rate limiter)

En Vercel el backend corre como funciones serverless: cada invocación puede
caer en una instancia distinta, así que un rate limiter en memoria no cumple
de verdad los límites de intentos. En producción `REDIS_URL` debe apuntar a un
Redis compartido (por ejemplo el de Railway). Si no está configurado, el
backend arranca igual pero avisa por logs que quedó en modo memoria.

## Tienda y panel en dominios separados

El mismo código del frontend se despliega como dos proyectos de Vercel:

- **Tienda** (`anita-new-style.xyz`): sin variables especiales. Si defines
  `VITE_ADMIN_URL`, el enlace "Panel admin" apunta al otro dominio y el build
  de la tienda no incluye el código del panel.
- **Panel** (`admin.anita-new-style.xyz`): con `VITE_APP_MODE=admin`. Este
  build no incluye la tienda (carrito, favoritos, checkout).

Para que la sesión funcione entre los dos subdominios, el backend usa
`COOKIE_DOMAIN=.anita-new-style.xyz`.

## Autenticación y seguridad

- El **access token** dura 15 minutos, viaja por el header `Authorization` y
  el frontend lo guarda solo en memoria (nunca en `localStorage`).
- El **refresh token** dura 30 días y viaja en una cookie `httpOnly` con
  protección CSRF: el frontend nunca puede leerla, lo que reduce el impacto
  de un eventual XSS. Al recargar la página, la app pide un access token nuevo
  usando esa cookie, de forma transparente.
- Las contraseñas se guardan con hash PBKDF2-SHA256.
- Después de 5 intentos fallidos de inicio de sesión la cuenta se bloquea 15
  minutos. Además hay límites de peticiones por ruta (login, registro,
  recuperación de contraseña, checkout, pago, consulta de documentos).
- **Verificación en dos pasos (2FA)** con app de autenticación (TOTP) y
  códigos de respaldo. Los códigos TOTP no se pueden reutilizar.
- **Inicio de sesión con Google** y registro solo con correo.
- Los enlaces de recuperación de contraseña son de un solo uso.
- Cada consulta de pedidos filtra por el usuario autenticado (sin acceso a
  pedidos ajenos) y todas las consultas a la base de datos son parametrizadas.
- `POST /api/auth/logout` limpia la cookie de refresh del lado del servidor.

## Sistema de roles

6 roles, definidos en `backend/app/roles.py`:

| Rol | Qué puede hacer |
|---|---|
| **Super administrador** | Todo: incluida la configuración de la tienda y la gestión de usuarios y roles |
| **Administrativo** | Gestiona productos, categorías, promociones, proveedores y reclamaciones; ve los pedidos y el dashboard completo |
| **Ventas** | Se encarga de las ventas en línea: gestiona los pedidos online con delivery (incluye cancelar y reembolsar) y puede consultar todos los tipos de pedido (delivery, recojo en tienda y venta en tienda), estos dos últimos solo en lectura; ve productos y su dashboard de ventas. No registra ventas presenciales |
| **Almacén** | Edita el stock, gestiona proveedores y prepara o despacha pedidos; ve su dashboard de stock |
| **Cajero** | Registra las ventas en tienda (venta presencial), entrega los recojos en tienda y descarga sus boletas; sin dashboard, reportes, cancelaciones ni reembolsos |
| **Cliente** | Rol normal de quien compra en la tienda (no entra al panel) |

El menú del panel solo muestra las secciones a las que cada rol tiene acceso,
pero el control real vive en el backend (`app/roles.py` + `@requiere_roles(...)`
en cada ruta): aunque alguien manipule el frontend, la API rechaza lo que no
le corresponde a su rol.

Crear el primer superadmin:

```bash
cd backend
python crear_admin.py tucorreo@ejemplo.com "TuPassword123" Tu Nombre
```

Desde ahí, un superadmin puede crear al resto del personal (con su rol) en
**Usuarios y roles**, sin volver a tocar la terminal.

## Pagos (Culqi)

Checkout con **Yape** y **tarjeta**, procesados por Culqi:

- La tarjeta (o el código de Yape) se tokeniza en el navegador: el backend
  nunca recibe ni guarda el número completo ni el CVV.
- El frontend envía el token a `POST /api/pedidos/<id>/pagar` y el backend crea
  el cargo en Culqi con la llave privada. La respuesta es **síncrona**
  (aprobado o rechazado), sin redirecciones ni webhooks.
- El monto que se cobra siempre se calcula en el servidor a partir del
  pedido, nunca de lo que mande el cliente.
- Si el cobro se rechaza, el pedido sigue pendiente y el cliente puede
  reintentar con otro medio.
- Protección contra doble cobro: la fila del pedido se bloquea mientras se
  procesa el pago y se usa una clave de idempotencia para los reintentos.
- Cada intento de pago (aprobado o rechazado) queda registrado.
- **Plazo de pago**: el cliente tiene `MINUTOS_LIMITE_PAGO` minutos (20 por
  defecto). Pasado ese tiempo, el pedido se cancela y el stock se libera. Esto
  ocurre al consultar los pedidos, al intentar pagar y también con una tarea
  programada diaria en Vercel (`/api/jobs/cancelar-pedidos-vencidos`).
- Los reembolsos de pedidos pagados se hacen desde el panel, contra el cargo
  original de Culqi.

## Catálogo y stock

- Cada producto necesita mínimo 4 imágenes; se pueden asignar por color (la
  imagen principal cambia sola cuando el cliente elige ese color). Las
  imágenes se convierten a WebP con miniaturas para los listados.
- Productos con talla y/o color llevan **stock independiente por combinación**
  (variantes); los productos sin talla ni color usan un solo campo de stock.
- El descuento de stock al crear un pedido es **atómico a nivel de base de
  datos**: si dos personas compran el último producto casi al mismo tiempo,
  solo una de las dos compras se confirma.
- Búsqueda, filtros por precio, color y talla, y guía de tallas.

## Pedidos

- Compra con envío a domicilio (S/ 10.00) o recojo en tienda (gratis). La
  dirección se elige con listas en cascada de departamento, provincia y
  distrito.
- Historial y detalle con seguimiento visual de estado (Pendiente →
  Confirmado → Preparando → Enviado → Entregado), empresa de envío y número
  de seguimiento. Los cambios de estado quedan en un historial.
- El cliente puede cancelar su pedido mientras no esté pagado, enviado ni
  entregado. Si ya pagó, contacta a la tienda y un administrador gestiona el
  reembolso. Al cancelar, el stock se devuelve automáticamente.
- Si un pedido con pago verificado se cancela, el pago pasa a "Reembolso
  pendiente"; ventas lo marca como reembolsado desde el detalle del pedido.
- Boleta de venta en PDF por cada pedido.
- Venta presencial (en tienda) desde el panel, con búsqueda por código SKU y
  DNI del cliente. La registran el cajero y el superadmin; el rol Ventas no
  tiene acceso (ni en el menú ni en la API), aunque sí puede ver esas ventas
  en la lista de pedidos.

## Reseñas

Solo puede reseñar quien compró el producto (pedido no cancelado); una reseña
por producto y cliente. Las reseñas con compra confirmada muestran "Compra
verificada".

## Libro de Reclamaciones

Libro de Reclamaciones virtual en `/libro-reclamaciones`, con hoja de
reclamación en PDF y envío por correo. El personal de administración los
responde desde el panel (plazo legal de 15 días hábiles).

## Panel admin

- **Dashboard**: ventas, pedidos pendientes, clientes, productos y bajo
  stock, con reporte de ventas en PDF
- **Productos**, **Categorías** y **Promociones**: gestión completa, con
  subida de imágenes
- **Proveedores**: datos de contacto y productos que suministran
- **Pedidos**: ver todos, filtrar, cambiar estado, boletas (el rol Ventas ve
  todos los tipos, pero solo gestiona los de delivery; el resto en modo lectura)
- **Venta presencial** (cajero y superadmin): registro de ventas en el mostrador
- **Reclamaciones**: responder reclamos y quejas
- **Configuración** (solo superadmin): datos y logo de la tienda
- **Usuarios y roles** (solo superadmin): crear personal, cambiar rol,
  activar o desactivar cuentas

## Migraciones de base de datos

Cada cambio de esquema queda como un archivo `.sql` numerado en
`backend/migraciones/`. Para aplicar las que falten (en orden, sin repetir las
ya corridas):

```bash
cd backend
python aplicar_migraciones.py
```

Los valores válidos de estados y métodos de pago también están como
restricciones en la base de datos: si agregas uno nuevo en el código, agrega
una migración que lo permita.

## Scripts útiles (carpeta `backend/`)

| Script | Para qué |
|---|---|
| `crear_admin.py` | Crea el primer superadmin |
| `seed_productos_reales.py` | Carga productos de la tienda sin imágenes |
| `optimizar_imagenes_existentes.py` | Convierte a WebP las imágenes ya subidas |
| `generar_skus_faltantes.py` | Genera el código SKU de productos que no lo tienen |
| `probar_correo.py` | Envía un correo de prueba con Resend |

## Diseño

- Fondo claro en tonos marfil y rosado suave, con tarjetas y paneles en vidrio
  esmerilado (`.glass` y `.glass-strong` en `theme.css`).
- Tipografía: **DM Serif Display** (títulos) + **DM Sans** (texto).
- Paleta: ciruela oscuro (`#2C0107`) para fondos y texto, y berry (`#C42759`)
  como color de acento.
- El logo y el nombre "Anita New Style" son la marca del cliente y no deben
  reemplazarse: el logo oficial está en `frontend/public/` (junto con los
  favicons) y se muestra junto al nombre en el encabezado y el pie.

## Flujo de trabajo con Git

```bash
git status
git add .
git commit -m "Describe brevemente el cambio"
git push origin main

git pull origin main
```

El repositorio usa la rama `main`; cada push despliega automáticamente en
Vercel.

## Próximos pasos sugeridos

- Módulo de almacén e inventario más completo.
- Separar tienda y administrador en proyectos independientes.
- Cachear productos y páginas para consultar menos la base de datos.
