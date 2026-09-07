# Anita New Style

Ecommerce completo: tienda + carrito + checkout + panel admin, con estilo
**glassmorphism**.

- **Backend**: Flask + MySQL (SQLAlchemy), JWT
- **Frontend**: React + Vite + Tailwind
- **Pagos**: Culqi (tarjeta y Yape)
- **Hosting**: Vercel (frontend y backend por separado) + Railway (MySQL)

```
anita-new/
  backend/   → API Flask
  frontend/  → React + Vite + Tailwind
```

## Puesta en marcha local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # completa las variables (ver abajo)
python aplicar_migraciones.py   # crea/actualiza las tablas
python seed.py                  # datos de ejemplo (categorías + productos demo)
python run.py
```
Corre en `http://localhost:5000`. Prueba: `http://localhost:5000/api/salud`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Corre en `http://localhost:5173`.

### Variables de entorno — backend (`.env`)

| Variable | Para qué |
|---|---|
| `SECRET_KEY` / `JWT_SECRET_KEY` | Firma de sesión y de los tokens JWT |
| `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` / `DB_NAME` | Conexión a MySQL |
| `FRONTEND_ORIGIN` | Origen permitido en CORS (URL del frontend) |
| `REDIS_URL` | Backend del rate limiter (login, registro, recuperación de contraseña, consulta de documentos). En local puede quedar vacío; en producción es obligatorio — ver más abajo |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Envío de correos (registro, recuperación de contraseña) vía [Resend](https://resend.com). Si `RESEND_API_KEY` queda vacío, los correos se imprimen en la consola de `python run.py` en vez de enviarse — sirve para probar el flujo sin tener la cuenta lista |
| `API_PERU_TOKEN` / `API_PERU_BASE_URL` | Autocompletar datos con DNI/RUC al registrarse. Si `API_PERU_TOKEN` queda vacío, el botón "validar" simplemente no autocompleta nada, pero el registro sigue funcionando |
| `CULQI_SECRET_KEY` | Llave privada de Culqi (cobro real) |

### Variables de entorno — frontend (`.env`)

| Variable | Para qué |
|---|---|
| `VITE_API_URL` | URL del backend (`http://localhost:5000/api` en local) |
| `VITE_CULQI_PUBLIC_KEY` | Llave pública de Culqi, para tokenizar la tarjeta en el navegador |

### Redis en producción (rate limiter)

En Vercel el backend corre como funciones serverless: cada invocación puede caer
en una instancia distinta, así que un rate limiter en memoria no cumple de
verdad los límites de intentos. En producción `REDIS_URL` debe apuntar a un
Redis compartido (por ejemplo el add-on de Redis de Railway). Si no está
configurado, el backend arranca igual pero avisa por logs que quedó en modo
memoria.

## Autenticación

- El **access token** dura 1 hora, viaja por header `Authorization` y el
  frontend lo guarda solo en memoria (nunca en `localStorage`).
- El **refresh token** dura 30 días y viaja en una cookie `httpOnly` — el
  frontend nunca puede leerlo directamente, lo que reduce el impacto de un
  eventual XSS. Al recargar la página, la app pide un access token nuevo
  usando esa cookie, de forma transparente.
- `POST /api/auth/logout` limpia la cookie de refresh del lado del servidor.

## Sistema de roles

6 roles, definidos en `backend/app/roles.py`:

| Rol | Qué puede hacer |
|---|---|
| **Super administrador** | Todo: productos, categorías, proveedores, pedidos, y gestionar otros usuarios/roles |
| **Moderador** | Ver/gestionar productos, categorías y pedidos; solo ver proveedores |
| **Editor / Creador** | Crear/editar productos, categorías y proveedores; no ve pedidos ni usuarios |
| **Soporte** | Ver y cambiar el estado de los pedidos; no toca productos ni usuarios |
| **Auditor** | Solo lectura: productos, pedidos, proveedores y dashboard — no puede editar nada |
| **Cliente** | Rol normal de quien compra en la tienda (no entra al panel admin) |

El sidebar del panel admin solo muestra las secciones a las que cada rol tiene
acceso, pero el control real vive en el backend (`app/roles.py` +
`@requiere_roles(...)` en cada ruta) — aunque alguien manipule el frontend, la
API rechaza lo que no le corresponde a su rol.

Crear el primer superadmin:
```bash
cd backend
python crear_admin.py tucorreo@ejemplo.com "TuPassword123" Tu Nombre
```
Desde ahí, un superadmin puede crear al resto del staff (con su rol) en
**Usuarios y roles**, sin volver a tocar la terminal.

## Pagos (Culqi)

Checkout con **Yape** y **tarjeta**, procesados vía Culqi:
- La tarjeta se tokeniza en el navegador — el backend nunca recibe ni guarda
  el número completo ni el CVV.
- El monto que se cobra siempre se calcula del lado del servidor a partir del
  pedido, nunca de lo que mande el cliente.
- El webhook de Culqi actualiza el estado de pago automáticamente.

## Catálogo y stock

- Cada producto necesita mínimo 4 imágenes; se pueden asignar por color (la
  imagen principal cambia sola cuando el cliente elige ese color).
- Productos con talla y/o color llevan **stock independiente por
  combinación** (variantes); productos sin talla ni color usan un solo campo
  de stock total.
- El descuento de stock al confirmar un pedido es **atómico a nivel de base
  de datos**: si dos personas compran el último producto casi al mismo
  tiempo, solo una de las dos compras se confirma.

## Pedidos

- Historial y detalle con stepper visual de estado (Pendiente → Confirmado →
  Preparando → Enviado → Entregado), empresa de envío y número de
  seguimiento.
- El cliente puede cancelar su propio pedido mientras no esté enviado,
  entregado o ya cancelado; el admin puede cancelar cualquiera. En ambos
  casos el stock se devuelve automáticamente.
- Si un pedido con pago ya verificado se cancela, el pago pasa a "Reembolso
  pendiente"; el admin lo marca como reembolsado desde el detalle del pedido.
- Venta presencial (en tienda) y generación de boletas/reportes en PDF desde
  el panel admin.

## Reseñas

Solo puede reseñar quien compró el producto (pedido no cancelado); una
reseña por producto y cliente. Las reseñas con compra confirmada muestran
"Compra verificada".

## Panel admin

- **Dashboard**: ventas, pedidos pendientes, clientes, productos y bajo stock
- **Productos** y **Categorías**: CRUD, con subida de imágenes
- **Proveedores**: datos de contacto
- **Pedidos**: ver todos, filtrar, cambiar estado, boletas y reportes en PDF
- **Usuarios y roles** (solo superadmin): crear staff, cambiar rol,
  activar/desactivar cuentas

## Migraciones de base de datos

Cada cambio de esquema queda como un archivo `.sql` numerado en
`backend/migraciones/`. Para aplicar las que falten (en orden, sin repetir
las ya corridas):
```bash
cd backend
python aplicar_migraciones.py
```

## Diseño

- Modo claro, fondo degradado suave (marfil → lila), "blobs" de color como
  firma visual del hero.
- Tarjetas y paneles en vidrio esmerilado (`.glass`, `.glass-strong` en
  `theme.css`).
- Tipografía: **Fraunces** (títulos) + **Manrope** (texto).
- Paleta: berry (`#8C2F5B`) como color principal, gold (`#C9A227`) como
  acento secundario.

## Próximos pasos sugeridos

- Módulo de almacén/inventario.
- 2FA para cuentas.


git status

git add .
git commit -m "Describe brevemente el cambio"
git push origin main

git pull origin main