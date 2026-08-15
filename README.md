# Anita New Style — Reescritura 2026

Reescritura completa del proyecto: backend nuevo en **Flask** (API REST + MySQL)
y frontend nuevo en **React** (Vite + Tailwind) con estilo **glassmorphism en modo claro**.

Alcance de esta primera versión: **tienda online + carrito + checkout** (núcleo).
El panel admin, almacén, 2FA, etc. XZdel proyecto anterior no están incluidos todavía —
se agregan en una siguiente fase sobre esta misma base.

## Estructura

```
anita-new/
  backend/   → API Flask (MySQL, JWT)
  frontend/  → React + Vite + Tailwind (glassmorphism)
```

## 1. Backend (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Base de datos en AlwaysData

1. En el panel de AlwaysData ve a **Databases → MySQL** y crea ahí la base de datos y el
   usuario (en AlwaysData esto **no se puede hacer desde phpMyAdmin ni otra herramienta
   externa**, solo desde su panel o su API).
2. AlwaysData te mostrará los datos de conexión ya armados en esa misma pantalla:
   - Host: `mysql-[tu_cuenta].alwaysdata.net`
   - Puerto: `3306`
   - Usuario y nombre de base de datos: los que hayas creado (a veces vienen
     prefijados con el nombre de tu cuenta, ej. `tucuenta_anita_new_style`)
3. Copia `.env.example` a `.env` y pega ahí esos datos reales:
   ```bash
   cp .env.example .env
   ```
4. Puedes probar la conexión por SSH/CLI antes de correr la app:
   ```bash
   mysql -h mysql-tu_cuenta.alwaysdata.net -u tu_usuario -p tu_base_de_datos
   ```
5. Crea las tablas y llena datos de ejemplo (categorías + productos demo):
   ```bash
   python seed.py
   ```
6. Levanta la API:
   ```bash
   python run.py
   ```
   Corre en `http://localhost:5000`. Prueba: `http://localhost:5000/api/salud`

> Nota: si vas a desplegar el backend también en AlwaysData (no solo la base de datos),
> me avisas y ajustamos `run.py`/WSGI para su forma de hosting Python.

## 2. Frontend (React)

```bash
cd  frontend
npm install
cp .env.example .env    # VITE_API_URL apuntando al backend
npm run dev
```

Corre en `http://localhost:5173`.

## Flujo funcional incluido

- Registro / login de clientes (JWT), con confirmación de contraseña, ver/ocultar contraseña
  y recuperación de contraseña por correo ("olvidé mi contraseña")
- Perfil de cliente: actualizar datos personales y cambiar contraseña
- Catálogo con categorías, búsqueda y orden por precio
- Tarjetas de producto con botones directos de "Agregar" y "Comprar"
- Detalle de producto con talla/color/cantidad y botones de agregar / comprar ahora
- Carrito persistente en BD (drawer lateral)
- Checkout con delivery o recojo en tienda, y métodos de pago (Yape / tarjeta / contra entrega)
- Historial y detalle de pedidos del cliente

## Diseño

- Modo claro con fondo degradado suave (marfil → lila) y "blobs" de color como firma visual del hero.
- Tarjetas y paneles en vidrio esmerilado (`.glass`, `.glass-strong` en `theme.css`).
- Tipografía: **Fraunces** (display, para títulos) + **Manrope** (texto).
- Paleta: berry (`#8C2F5B`) como color principal, gold (`#C9A227`) como acento secundario.

## Recuperación de contraseña sin correo configurado

Si no llenas `MAIL_SERVER` en el `.env` del backend, el flujo de "olvidé mi contraseña"
sigue funcionando, pero en vez de enviar un correo real, el enlace de recuperación se
imprime en la consola donde corre `python run.py`. Cópialo desde ahí para probar el flujo
completo mientras desarrollas.

Para usar correos reales con el SMTP de AlwaysData:

1. En el panel de AlwaysData ve a **E-mails** y crea una cuenta de correo
   (ej. `no-responder@tudominio.com`), con su propia contraseña (distinta a la de tu
   cuenta de AlwaysData).
2. En tu `.env` del backend completa:
   ```env
   MAIL_SERVER=smtp-tu_cuenta.alwaysdata.net
   MAIL_PORT=465
   MAIL_USE_TLS=false
   MAIL_USE_SSL=true
   MAIL_USERNAME=no-responder@tudominio.com
   MAIL_PASSWORD=la_password_de_esa_cuenta_de_correo
   MAIL_DEFAULT_SENDER=no-responder@tudominio.com
   ```
   AlwaysData usa **SSL en el puerto 465** para SMTP (no TLS/587 como muchos otros
   proveedores), por eso `MAIL_USE_SSL=true` y `MAIL_USE_TLS=false`.
3. Reinicia el backend. Al pedir "olvidé mi contraseña" ahora debería llegarte el correo real.

## Migraciones de base de datos

Cada vez que un cambio en el código requiera un cambio en la base de datos (una columna
nueva, una tabla nueva, etc.), te voy a dejar un archivo `.sql` numerado en
`backend/migraciones/` en vez de pedirte que lo hagas a mano.

Para aplicarlas (aplica solo las que falten, en orden, y no repite las que ya corriste):
```bash
cd backend
python aplicar_migraciones.py
```

Migraciones actuales:
- `001_agregar_es_admin.sql` — columna `es_admin` (legado)
- `002_agregar_rol_usuario.sql` — columna `rol` (sistema de roles)
- `003_crear_proveedores.sql` — tabla `proveedores`
- `004_agregar_pago_pedido.sql` — `estado_pago` y `comprobante_url` en pedidos
- `005_crear_configuracion_pagos.sql` — tabla `configuracion_pagos` (número/QR de Yape)
- `006_agregar_datos_tarjeta.sql` — `tarjeta_titular` y `tarjeta_ultimos4` en pedidos
- `007_crear_imagenes_producto.sql` — tabla `imagenes_producto` (galería, con color opcional)
- `008_crear_variantes_producto.sql` — tabla `variantes_producto` (stock por talla/color)
- `009_crear_resenas.sql` — tabla `resenas` (calificaciones y reseñas de producto)
- `010_agregar_seguimiento_envio.sql` — `empresa_envio` y `numero_seguimiento` en pedidos

Corre `python aplicar_migraciones.py` para ponerte al día con todas.

## Confirmación de pagos (Yape / tarjeta)

- **Yape**: en el panel admin → **Config. de pagos** (solo superadmin) subes tu QR y
  pones tu número/nombre de titular. Eso es lo que ve el cliente en el checkout al
  elegir Yape — el QR se muestra grande (224×224px, con fondo blanco) para que se
  pueda escanear sin problema. **Subir la captura del pago es obligatorio para
  completar la compra** con este método — el botón "Confirmar pedido" queda
  deshabilitado hasta que el cliente selecciona un archivo, y el backend también lo
  exige (rechaza el checkout con error 400 si alguien intenta saltárselo llamando a
  la API directamente). El pedido se crea ya con estado de pago "En revisión". Vos lo
  revisas en **Pedidos → (el pedido) → Comprobante de pago** y lo marcas como
  **Verificado** (el pedido pasa automáticamente a "Confirmado" si seguía "Pendiente")
  o **Rechazado** (el cliente puede volver a subir uno nuevo desde el detalle de su pedido).
- **Tarjeta**: el checkout ya pide nombre, número, vencimiento y CVV (con formato
  automático) y son obligatorios para poder confirmar el pedido. **El cobro real
  todavía no se procesa** — no tienes cuenta en una pasarela de pago (Culqi, Izipay,
  Niubiz, Mercado Pago) todavía. Por seguridad, el backend **nunca recibe ni guarda el
  número completo ni el CVV** — solo el nombre del titular y los últimos 4 dígitos,
  como referencia para coordinar el cobro con el cliente. El pedido queda con estado
  de pago "Pendiente" y lo verificas desde el mismo lugar que los de Yape
  (Pedidos → el pedido → Seguimiento de pago → Verificar/Rechazar). Cuando tengas una
  pasarela real, reemplazamos este formulario por su checkout/token para procesar el
  cobro de verdad.
- **Contra entrega**: no requiere comprobante, se paga físicamente al recibir.

## Galería de imágenes por producto

Cada producto necesita **mínimo 4 imágenes** (lo exige tanto el frontend como el
backend, al crear y al editar). En el formulario de producto del admin, cada imagen
que subes puede quedar "Sin color específico" (se muestra siempre) o asignada a uno
de los colores que hayas escrito en el campo "Colores" — cuando el cliente elige ese
color en la tienda, la imagen principal cambia automáticamente a la que le asignaste.
Las que no tienen color asignado sirven como galería general (ángulos distintos, detalle, etc).

En el detalle de producto, el cliente ve la imagen principal grande y una fila de
miniaturas debajo para navegar entre todas las fotos.

> Nota: los productos que ya tenías cargados con una sola imagen (`imagen_url`) se
> migran automáticamente como su primera foto — pero vas a necesitar editarlos y
> agregar al menos 3 más para que cumplan el mínimo la próxima vez que los edites.

## Sistema de roles

En vez de un simple admin/no-admin, ahora hay 6 roles (definidos en `backend/app/roles.py`):

| Rol | Qué puede hacer |
|---|---|
| **Super administrador** | Todo: productos, categorías, proveedores, pedidos, y gestionar otros usuarios/roles |
| **Moderador** | Ver/gestionar productos, categorías y pedidos; solo ver proveedores |
| **Editor / Creador** | Crear/editar productos, categorías y proveedores; no ve pedidos ni usuarios |
| **Soporte** | Ver y cambiar el estado de los pedidos; no toca productos ni usuarios |
| **Auditor** | Solo lectura: productos, pedidos, proveedores y dashboard — no puede editar nada |
| **Cliente** | Rol normal de quien compra en la tienda (no entra al panel admin) |

El sidebar del panel admin solo muestra las secciones a las que cada rol tiene acceso.
Las reglas reales de permisos viven en el backend (`app/roles.py` + los decoradores
`@requiere_roles(...)` en cada ruta), así que aunque alguien manipule el frontend, la
API igual rechaza lo que no le corresponde a su rol.

## Verificar que el correo de recuperación realmente se envía

Ahora hay dos formas de confirmarlo sin adivinar:

1. **Desde la terminal** (más directo, no necesita frontend):
   ```bash
   cd backend
   python probar_correo.py tucorreo@ejemplo.com
   ```
   Te dice exactamente qué servidor/puerto/usuario está usando y si el envío falló y por qué.
2. **Desde el panel admin** → **Config. de pagos** (solo superadmin) → sección
   "Probar envío de correo": pones un correo y te dice si llegó o el error exacto.

Antes, si el envío fallaba (credenciales SMTP mal, puerto equivocado, etc.), el error
quedaba oculto — el flujo de "olvidé mi contraseña" siempre respondía "listo" aunque el
correo nunca saliera. Ya no: ahora el error se imprime bien visible en la consola del
backend cuando pasa durante el flujo real, y con estas dos herramientas puedes probarlo
directamente sin tener que pasar por todo el flujo de recuperación.

## Validación de formularios

Los campos de texto y número ahora filtran lo que puedes escribir, en vez de solo
validar al enviar:
- **Nombre, apellido, titular de tarjeta, contacto de proveedor, distrito/provincia/departamento**:
  solo letras y espacios (no dejan escribir números ni símbolos raros)
- **Teléfono** (perfil, checkout, proveedores, número de Yape): solo dígitos, máximo 9
- **RUC** (proveedores): solo dígitos, máximo 11
- **SKU** (productos): letras, números y guiones, en mayúsculas automáticamente
- **Dirección, referencia, notas, descripción**: quedan libres (pueden llevar números)

Las reglas están centralizadas en `frontend/src/validacion.js` (funciones `soloTexto`,
`soloNumeros`, `soloRuc`, `soloCodigo`) para poder reusarlas si agregamos más formularios.

## Control de stock (corrección de sobreventa)

Se corrigió un bug real donde un cliente podía comprar más unidades de las que había
en stock. Pasaba en 3 puntos, y los 3 quedaron arreglados:

1. **Al agregar al carrito**: si el mismo producto ya estaba en el carrito en otra
   talla/color, no se sumaba esa cantidad al validar el stock — ahora sí se suma
   (el stock es del producto, no de cada variante).
2. **Al aumentar la cantidad desde el carrito**: antes no había ningún control de
   stock al tocar "+" — ahora si te pasas del disponible, ves el error directamente
   junto al producto en el carrito.
3. **Al confirmar el pedido (checkout)**: además de sumar bien las cantidades, el
   descuento de stock ahora es **atómico a nivel de base de datos** — si dos personas
   compran el último producto casi al mismo tiempo, solo una de las dos compras se
   confirma; la otra recibe un error claro ("se quedó sin stock justo ahora") en vez
   de dejar el stock en negativo.

No necesitas ninguna migración para esto — son correcciones de lógica, no de esquema.
Solo reinicia el backend.

## Búsqueda en mobile y color de categorías

La barra de búsqueda del navbar estaba oculta por completo en pantallas chicas (mobile).
Ahora hay un ícono de lupa siempre visible en el navbar en mobile que despliega el
buscador. También se reforzaron los estados visuales (hover, activo) de las categorías
en la tienda.

## Stock por talla y color (variantes de producto)

Ahora cada producto puede llevar **stock independiente por combinación de talla/color**,
en vez de un solo número total:

- Si un producto **tiene tallas y/o colores**, el admin tiene que definir el stock de
  cada combinación al crearlo o editarlo (aparece una grilla en el formulario). Ya no
  se puede guardar sin completar todas las combinaciones.
- Si un producto **no tiene tallas ni colores**, sigue funcionando exactamente igual
  que antes: un solo campo de stock.
- En la tienda, si el cliente elige una talla/color sin stock, ese botón queda
  deshabilitado, y la cantidad máxima se ajusta a lo disponible en esa combinación
  específica — no al stock total del producto.
- El carrito y el checkout validan y descuentan el stock de la variante exacta
  (talla+color), no del producto en general.

> Los productos que ya tenías cargados con tallas/colores **no se migran
> automáticamente** a este sistema (no hay forma segura de repartir el stock actual
> entre combinaciones sin adivinar) — van a seguir con su stock total de siempre hasta
> que los edites en el admin y definas ahí el stock por variante.

Corre la migración nueva:
```bash
cd backend
python aplicar_migraciones.py
```

## Cancelar pedidos (con devolución de stock)

- **El cliente** puede cancelar su propio pedido desde el detalle del pedido, mientras
  no esté "Enviado", "Entregado" ni ya "Cancelado". Se pide confirmación antes de
  cancelar ("Esta acción no se puede deshacer").
- **El admin** puede cancelar cualquier pedido cambiando su estado a "Cancelado" desde
  el detalle del pedido — también pide confirmación explícita
  ("¿Desea cancelar esta compra?... Si se cancela, se cancela y ya") antes de aplicarlo,
  sin vuelta atrás.
- En ambos casos, **el stock de los productos del pedido se devuelve automáticamente**
  (a la variante talla/color correspondiente, o al stock del producto si no usa
  variantes). Hay protección para no devolver el stock dos veces si el pedido ya
  estaba cancelado.
- Además, **un pedido ya cancelado queda completamente bloqueado**: ni el admin puede
  volver a cambiarle el estado o revisar su pago, ni el cliente puede subir un
  comprobante nuevo. En el admin, el selector de estado se reemplaza por un aviso fijo
  de "Cancelado — no se puede modificar".

## Calificaciones y reseñas

Cada producto ahora tiene su apartado de reseñas, en la parte de abajo del detalle:

- **Solo pueden reseñar quienes compraron el producto** (se verifica que tengan al
  menos un pedido no cancelado con ese producto) — si alguien más lo intenta, la API
  lo rechaza con un mensaje claro.
- Un cliente puede dejar **una sola reseña por producto** (calificación de 1 a 5
  estrellas + comentario opcional); si vuelve a enviarla, se actualiza la que ya tenía
  en vez de duplicarla.
- Las reseñas con compra confirmada muestran una etiqueta **"Compra verificada"**.
- El promedio de calificación y el total de reseñas se muestran tanto en el detalle
  del producto como en su tarjeta dentro del catálogo (si tiene al menos una reseña).

Corre la migración nueva:
```bash
cd backend
python aplicar_migraciones.py
```

## Pago contra entrega — eliminado

Se quitó "Pago contra entrega" como opción de pago. Ahora el checkout solo ofrece
**Yape** y **Tarjeta**. Los pedidos antiguos que ya se hicieron con contra entrega
siguen mostrando esa etiqueta correctamente en su historial (no se tocan ni se
esconden) — simplemente ya no es una opción para compras nuevas.

## Estado de reembolso

Si un pedido ya tenía el pago **verificado** y se cancela (por el cliente o el admin),
el estado de pago pasa automáticamente a **"Reembolso pendiente"** en vez de quedar
como si nada hubiera pasado. El admin ve un aviso y un botón **"Marcar como
reembolsado"** en el detalle de ese pedido — es la única acción que se puede hacer en
un pedido ya cancelado, porque justamente hace falta después de cancelarlo. El cliente
ve un mensaje explicando que le van a devolver su dinero, y luego que ya se procesó.

No hace falta migración nueva para esto — reutiliza la columna `estado_pago` que ya
existía, solo se agregaron los valores nuevos al diccionario de estados.

## Seguimiento de envío

Cada pedido ahora puede llevar una empresa de envío y un número de seguimiento
(los completa el admin desde el detalle del pedido). El cliente ve un **stepper
visual** en el detalle de su pedido (Pendiente → Confirmado → Preparando → Enviado →
Entregado) que se resalta según el estado actual, y el número de seguimiento debajo
si ya se cargó.

Corre la migración nueva:
```bash
cd backend
python aplicar_migraciones.py
```

## Optimización de rendimiento

Encontré la causa real de la lentitud: las relaciones `imagenes`, `variantes` y
`resenas` de `Producto` estaban declaradas como `lazy="dynamic"`, lo que hace que
**cada acceso vuelva a consultar la base de datos** — incluso sobre el mismo objeto,
varias veces en la misma petición. Un solo producto con reseñas y variantes disparaba
entre 8 y 10 consultas él solo; en una página de 24 productos, eso son cientos de
consultas para una sola carga de la tienda.

Cambios aplicados:
- Esas relaciones pasaron a cargarse una sola vez y reutilizarse (ya no son
  `dynamic`); las propiedades (`imagen_principal`, `stock_total`,
  `promedio_calificacion`, etc.) ahora operan sobre esa carga ya hecha, en vez de
  volver a golpear la base de datos cada vez que se leen.
- Los listados (tienda y admin) ahora usan `joinedload`/`selectinload` para traer
  categoría, imágenes, variantes y reseñas de **todos** los productos de la página en
  un puñado de consultas, en vez de una por producto.
- El modo "resumen" (tarjetas de producto en listados) ya no manda las listas
  completas de imágenes/variantes en el JSON — solo lo que la tarjeta necesita
  (imagen principal, stock total, calificación). El detalle de un producto sigue
  trayendo todo completo.
- Se corrigió el mismo patrón N+1 en el conteo de "productos con bajo stock" del
  dashboard y en el listado de pedidos del admin (antes hacía una consulta aparte
  por cada pedido para traer los datos del cliente).

No hace falta ninguna migración para esto — son cambios de cómo se consulta la base
de datos, no de su estructura. Con eso, cargar la tienda o el panel admin debería
sentirse notablemente más rápido, sobre todo a medida que crece el catálogo.

## Panel admin

1. Crea tu primer superadmin:
   ```bash
   cd backend
   python crear_admin.py tucorreo@ejemplo.com "TuPassword123" Tu Nombre
   ```
   (por defecto crea rol `superadmin`; para otro rol: `python crear_admin.py correo pass Nombre Apellido moderador`)
2. Ingresa normalmente desde `/ingresar` con ese email y password.
3. Entra a `http://localhost:5173/admin`. Desde ahí, un superadmin puede crear el resto
   del staff (con su rol) en la sección **Usuarios y roles**, sin necesidad de tocar la
   terminal de nuevo.

Secciones del panel:
- **Dashboard**: ventas totales, pedidos pendientes, clientes, productos y bajo stock
- **Productos**: CRUD con subida real de imágenes (arrastra o selecciona un archivo,
  se sube al servidor y se usa automáticamente)
- **Categorías**: CRUD
- **Proveedores**: datos de contacto de tus proveedores (nombre, RUC, teléfono, notas)
- **Pedidos**: ver todos, filtrar por estado, cambiar el estado
- **Usuarios y roles** (solo superadmin): crear miembros del staff con su rol,
  cambiar el rol de alguien existente, activar/desactivar cuentas

## Subida de imágenes de producto

Las imágenes se guardan en el propio servidor backend, en
`backend/app/static/uploads/productos/`, y se sirven en
`http://localhost:5000/static/uploads/productos/archivo.jpg`. Formatos permitidos:
png, jpg, jpeg, webp, gif — máximo 5 MB por imagen.

## Próximos pasos sugeridos

- Módulo de almacén/inventario.
- 2FA para cuentas.
- Subida real de imágenes de producto (hoy `imagen_url` es un campo libre).
