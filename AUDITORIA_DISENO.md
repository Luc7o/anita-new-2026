# Auditoría de diseño: tienda y panel de administración

Fecha: 20 nov 2026. La hicieron tres agentes en paralelo: uno revisó la tienda, otro el panel admin y otro el sistema de diseño compartido. Es **solo lectura** del código; nada se probó en el navegador. Las rutas son relativas a `frontend/src/`.

---

## Resumen: los 5 problemas de fondo

1. **El modo oscuro se mantiene a parches.** `styles/theme.css` sobrescribe clases sueltas (`.bg-white`, `.text-red-700`, `.bg-[#ece7e0]`…) en unas 94 reglas, en lugar de usar tokens semánticos. Cualquier clase nueva sale rota en oscuro. Ya pasa en unas 20 clases de color, en `.panel` del admin, en `bg-berry/10`, `ring-white`, `fill-white`, etc.
2. **No hay componentes base reales.** Hay unos 70 patrones distintos de botón, 9 copias del estilo de campo de texto y dos sistemas de modal: `Dialog.jsx` frente a 8 ventanas hechas a mano. Los insignias se escriben a mano. Ya existen `.btn-*` y `.campo-texto`, pero casi no se usan.
3. **Faltan colores semánticos de estado.**
   - `--color-gold` hoy es gris (`#ababab`) y se usa como "aviso", así que "Pago en revisión" y "Vence hoy" se ven neutros.
   - El rosa de marca (`berry-dark`) se usa también para errores e incluso para mensajes de éxito.
   - Faltan `success`, `warning`, `danger` e `info`.
4. **Errores de red mudos.** Varias cargas no tienen `.catch`, así que la pantalla se queda en esqueleto para siempre o muestra "no hay datos" cuando en realidad falló. Pasa en PedidoDetalle (tienda y admin), AdminPedidos, Favoritos y AdminProductos.
5. **Acciones irreversibles sin confirmar.** Reembolsar (Culqi devuelve dinero real), rechazar un pago, cambiar el rol de un usuario y desactivar un usuario se hacen con un solo clic.

---

## Arreglos rápidos (mucho impacto, poco esfuerzo)

| # | Arreglo | Dónde | Esfuerzo |
|---|---|---|---|
| 1 | Confirmar reembolso, rechazo de pago, cambio de rol y desactivar usuario con `useConfirm` (tono `danger`, con el monto en el texto) | `pages/admin/AdminPedidoDetalle.jsx:285-308`, `AdminUsuarios.jsx:70-73,141-143` | Bajo |
| 2 | `catch` + toast + botón "Reintentar" en las cargas | `PedidoDetalle.jsx:53`, `AdminPedidoDetalle.jsx:40-68`, `AdminPedidos.jsx:60-66`, `Favoritos.jsx:23-26` | Bajo |
| 3 | `body` con el color del tema: `color: rgb(var(--c-plum)); background: rgb(var(--c-ivory))` | `styles/theme.css:192-197` | 1 línea |
| 4 | Añadir `.panel` al modo oscuro del admin (hoy esqueletos y estados vacíos salen blancos) | `styles/theme.css:345-349` y `:560-581` | 1 línea |
| 5 | Variable para la altura de la cabecera del admin (está fija en 57px, pero mide unos 69px) | `components/admin/AdminLayout.jsx:190,257` | Bajo |
| 6 | `overflow-x-auto` en las 9 tablas del admin, y montos con `text-right tabular-nums` + `soles()` | `AdminPedidos.jsx:117` y demás | Bajo |
| 7 | Letra de 16px en el buscador y el filtro de precio (evita el zoom en iPhone) | `components/Navbar.jsx:173`, `FiltroPrecio.jsx:16` | 2 clases |
| 8 | Foco visible en los filtros de la tienda (`peer-focus-visible:ring-2`) | `pages/Tienda.jsx:44-60,245-266` | Bajo |
| 9 | Corregir el contenido: "Plin" en la FAQ (ya no se acepta), "S/ 10.00" escrito a mano y "Quienes somos" sin tilde | `FAQ.jsx:17`, `Checkout.jsx:546`, `MetodosEnvio.jsx:18`, `Footer.jsx` | Bajo |
| 10 | Que "Reducir movimiento" cubra también `::before`/`::after` y `scroll-behavior` | `styles/theme.css:293-298` | 1 línea |

---

## 1. Sistema de diseño (compartido)

### Alta
- **A1. Texto oscuro sobre fondo oscuro en el admin.** El `body` fija `color:#1f1e1c`, y el admin oscuro solo cambia el fondo. Todo texto sin clase de color queda con contraste de aprox. 1,1:1. `theme.css:192-197,546`.
- **A2. Unas 20 clases de color de Tailwind sin versión oscura.** Hay 107 usos de la paleta cruda. Contraste sobre `#1c1b19`: `text-amber-800` 2,4:1, `text-emerald-700` 3,1:1 y `text-yellow-700` 3,5:1. Donde más aparecen: `estadosPedido.js` (14), `passwordFuerza.js`, `AdminDashboard.jsx`. **Arreglo:** tokens `--c-success/danger/warning/info` con `-fg` y `-bg` por tema.
- **A3. El acento de marca tiene dos definiciones:** `--color-berry` (hex fijo) y `--c-berry`. En oscuro no se ajustan `bg-berry/10` (25 usos), `border-berry`, `ring-berry*` ni `hover:bg-berry/10`. `theme.css:14,145`.
- **A4. "Reducir movimiento" a medias.** `*` no alcanza `::before`/`::after` (brillo de `.btn-primary`, `.subrayado`, `.btn-relleno`). El smooth scroll nunca se apaga. Además hay tres formas distintas de detectar la preferencia: `useReducirMovimiento`, `useReducedMotion` de motion y un `matchMedia` en Home.
- **A5. Se rehace lo mismo en cada pantalla.**
  - Solo 39 de 229 `<button>` usan `.btn*`, y hay 7 radios distintos en botones.
  - `.campo-texto` se usa 11 veces frente a 9 constantes locales que lo copian.
  - Hay dos sistemas de modal, y `AdminProveedorDetalle.jsx:171` no tiene `role="dialog"`, ni foco atrapado, ni Escape.

### Media
- **M1. Radios.** `rounded-2xl` vale 20px en la tienda y 12px en el admin (`theme.css:626`). `rounded-[10px]` aparece 70 veces. Hay más de 10 radios en uso.
- **M2. Valores arbitrarios: 198.** Hay hex sueltos como `#ece7e0`, `#f1eee9`, `#f7f5f5`, `#ff4d7a` y `#ffb454`. `CargandoPagina` destella en claro en el admin oscuro.
- **M3. Tipografía.** Hay 16 tamaños (`text-[10px]` y `[11px]` son ilegibles) y 13 espaciados de letra. **Propuesta:** 7 pasos, una clase `.eyebrow` y nada por debajo de 12px.
- **M4. Syne/Manrope.** Se usan bien en general, pero las familias están escritas como texto literal en vez de `var(--font-*)` (`theme.css:193,204,214`, `admin-motion.css:70`).
- **M5. Contraste que falla.**
  - Estrellas `text-gold`: 2,3:1.
  - Bordes de campo `plum/16`–`/20`: aprox. 1,4–1,5:1; se necesitan 3:1.
  - Foco `#a53694` sobre la superficie oscura: 2,9:1.
  - `text-plum/40`: 2,5:1.
- **M6.** No existe `@custom-variant dark`. El primer `dark:` que alguien escriba seguirá al sistema operativo y no al botón de tema.
- **M7.** `radix-ui` y `@base-ui/react` solo están por dependencias de Animate UI. Conviene fijar una sola base (Base UI) para los componentes nuevos.
- **M8. Iconos.** 17 son de Lucide y 28 SVG dibujados a mano. Hay 14 tamaños distintos. Casi ninguno tiene `aria-hidden`. Toast y ConfirmDialog traen sus propios SVG.
- **M9. Movimiento sin tokens.** Hay 22 duraciones, 4 curvas casi iguales y keyframes duplicados (`fade-in`, `adm-fade` y `adm-page-in` son iguales).
- **M10.** La excepción del admin no quita `backdrop-blur-xs`. El `border-color: gray-200` global (`theme.css:133`) brilla en oscuro.

### Baja
- Los nombres heredados confunden: `plum` es carbón, `gold` es gris y `chrome` es lo mismo que `plum`.
- Sombras y espaciado: hay valores intermedios, y la altura de los controles va de h-8 a h-14.
- Anchos máximos mezclados: `max-w-7xl`, `6xl` y `5xl`.
- El admin carga las 8 hojas de fuentes aunque casi no usa Syne, y falta el preload de Syne para la portada.
- El admin oscuro destella en claro al cargar (`index.html:20`), y falta `theme-color`.
- `.btn*`, `.panel` y `.glass` están fuera de `@layer components`.

### Tokens y componentes base propuestos
- **Tokens de color:** `--c-bg`, `--c-surface`, `--c-surface-2`, `--c-surface-photo`, `--c-fg`, `--c-fg-muted`, `--c-border` (contraste de 3:1 o más), `--c-accent`, `--c-accent-hover`, `--c-accent-fg` y `--c-focus`. Además `success`, `danger`, `warning` e `info`, cada uno con `-fg` y `-bg`.
- **Radios:** `--radius-control` 10px, `--radius-card` 16px y `--radius-pill`.
- **Movimiento:** `--dur-fast` 150ms, `--dur-base` 250ms, `--dur-slow` 400ms y `--ease-out`.
- **Componentes base (`components/ui/`):**
  - `Button`: primary, secondary, dark, ghost y danger, en tres tamaños, con `loading`.
  - `IconButton`.
  - `Input`, `Select` y `Textarea`, con densidad compacta para el admin, y `Field` (etiqueta + ayuda + error).
  - `Badge` por tono.
  - `Card`.
  - `Modal`, una sola base.
  - `Icon`: tamaños sm 16, md 20 y lg 24.

---

## 2. Tienda

### Alta
1. **Los filtros no muestran el foco con teclado.** El input `sr-only` recibe el foco, pero la casilla que se ve es un `<span>`. `Tienda.jsx:44-60,245-266`.
2. **Hay 4 estilos distintos de campo de texto**: Checkout, Login, Perfil/PedidoDetalle/reseña y Registro. Hay que unificarlos en `.campo-texto`.
3. **Campos que desaparecen en oscuro.** `bg-white/70` sin borde se vuelve del mismo color que la tarjeta. `Perfil.jsx`, `PedidoDetalle.jsx:247`, `ProductoDetalle.jsx:592`.
4. **El hover de "Ingresar" y "Crear cuenta" no se lee en oscuro** (contraste de aprox. 2:1). `Login.jsx:161`, `Registro.jsx:141`. Usar `btn-primary`.
5. **Dos estilos de botón.** Hay pastillas `rounded-full bg-berry` de unos 40px en ProductoDetalle, SelectorRapido, PedidoDetalle, Perfil, BannerPrivacidad y MapaTienda.
6. **"Cancelar pedido" se ve igual que "Descargar boleta".** `PedidoDetalle.jsx:359-378`.
7. **Si falla la carga del pedido, la página se queda en esqueleto para siempre.** Es justo la página a la que se llega después de pagar. `PedidoDetalle.jsx:53`.
8. **La búsqueda y el filtro de precio hacen zoom en iOS** (letra de 14px). `Navbar.jsx:173`, `FiltroPrecio.jsx:16`.
9. **Filtros en el celular.** El panel se abre encima de la grilla, sin "Ver N resultados", y el orden queda escondido. `Tienda.jsx:213-230`. Mejor una hoja inferior.
10. **Las páginas de cuenta y acceso no tienen Navbar ni carrito.** Desde Favoritos se puede "Agregar", pero no abrir el carrito. `App.jsx:122-156`.

### Media
11. **El selector rápido y la ficha de producto no coinciden** en el color de la talla elegida, el anillo del color, la cantidad de 32px y el "S/12.00" sin espacio. Conviene sacar `SelectorTalla`, `Cantidad` y `formatoPrecio()` compartidos.
12. **Botones táctiles de menos de 44px**: tallas, paginación, cantidad del carrito lateral, flechas, redes del footer, el ojo de la contraseña y el cierre del visor.
13. **"Delivery (S/ 10.00)" escrito a mano** en vez de `COSTO_ENVIO_DELIVERY`. `Checkout.jsx:546`, `MetodosEnvio.jsx:18`.
14. **Las líneas del resumen del checkout no se ven** (`border-white/50` sobre blanco). `Checkout.jsx:471,481`.
15. **En el celular, "Confirmar y pagar" queda al final del formulario.** Conviene ponerlo en la barra fija. `Checkout.jsx:789-808`.
16. **Checkout: títulos y validación.**
    - El `h2` "Compra sin cuenta" va antes del `h1`.
    - No hay errores por campo (`aria-invalid` / `aria-describedby`).
17. **"DNI válido" con `text-emerald-700`** tiene contraste de 3:1 en oscuro. `Checkout.jsx:231`.
18. **AuthLayout en oscuro.** `bg-plum/25` aclara la foto, y la etiqueta "Regresar" queda con texto blanco sobre crema. `AuthLayout.jsx:46,59`.
19. **`ring-offset` blanco en oscuro.** `SelectorRapido.jsx:256`.
20. **En el celular, el formulario de acceso queda debajo del pliegue.** También conviene `min-h-dvh`. `AuthLayout.jsx:55-66`.
21. **Reseñas y relacionados de la ficha.**
    - El formulario va antes de las reseñas.
    - No hay promedio.
    - El textarea no tiene etiqueta.
    - Las tarjetas de relacionados están duplicadas a mano, sin descuento.
    - Los títulos saltan de nivel.
22. **El error al agregar al carrito no tiene `role="alert"`**, y se usa el rosa de marca como color de error. `ProductoDetalle.jsx:564`.
23. **En Perfil, el éxito se ve igual que un error** (`text-berry-dark`).
24. **Los errores de carga parecen listas vacías**: Favoritos, ListaPedidos (dice "Ir a iniciar sesión" ante cualquier error) y Home.
25. **Campos de ubicación sin etiqueta visible**: UbicacionEntrega, CampoUbicacion y Perfil.
26. **La grilla salta en cada filtro** porque se reemplaza por el esqueleto. Mejor dejar los resultados con `opacity-60`. `Tienda.jsx:435`.
27. **El carrito lateral dice "Total" sin aclarar el envío.** `/carrito` sí dice "sin envío". `CartDrawer.jsx:224-230`.

### Baja
28. **El título de la portada puede desbordar a 320–360px** (`whitespace-nowrap` con `text-5xl`). `Home.jsx:141`.
29. **Las pestañas de "Lo nuevo"** se doblan en dos filas con forma de cápsula. `Home.jsx:297`.
30. **El carrusel de ofertas no tiene flechas ni foco** en computadora. `Home.jsx:351`.
31. **La foto del hero es un `background-image`**, sin `alt` ni `fetchpriority`, y retrasa el LCP. `Home.jsx:70-73`.
32. **Los precios tachados no tienen contexto** para el lector de pantalla (falta "Precio anterior").
33. **Colores escritos a mano** (`#ece7e0`, `#f1eee9`, `#57534e`) y `rounded-[20px]`.
34. **Footer.**
    - Hay `h4` sin jerarquía.
    - Las mayúsculas son inconsistentes.
    - "Quienes somos" va sin tilde.
    - No hay logos de pago (Yape, Visa, Mastercard).
35. **La FAQ ofrece Plin**, que ya no se acepta, y salta de `h1` a `h3`. `FAQ.jsx:17`.
36. **CuentaLayout.** Falta `aria-current`, y "Ofertas" no pertenece a la cuenta.
37. **Paginador duplicado** en Tienda frente a `Paginador.jsx`.
38. **El hover de `.tarjeta` se queda "pegado" en táctiles.** Falta `@media (hover:hover)`. `theme.css:460`.
39. **`vh` en lugar de `dvh`** y sin `safe-area-inset-bottom` en el carrito lateral, el selector y el checkout.

---

## 3. Panel de administración

### Alta
1. **La altura de la cabecera está fija en 57px, pero mide unos 69px.** Las pestañas del celular quedan debajo de la cabecera y "Cerrar sesión" se sale de la pantalla. `AdminLayout.jsx:151,167,190,257`.
2. **Las tablas recortan columnas entre 768 y 1023px** (`overflow-hidden`) en 9 páginas. Pedidos tiene 8 columnas.
3. **Marcar un reembolso y rechazar un pago no piden confirmación**, aunque mueven dinero real. `AdminPedidoDetalle.jsx:285-308`.
4. **Cambiar el estado no avisa cuando falla**: el select se queda con un estado que no se guardó (`AdminPedidoDetalle.jsx:61-68`). El rol cambia en el `onChange`, y desactivar usuario no tiene ni toast ni confirmación (`AdminUsuarios.jsx`).
5. **Errores de carga.**
   - El detalle se queda en esqueleto para siempre.
   - La lista dice "No hay pedidos" aunque haya fallado.
   - El dashboard pide recargar la página, sin botón Reintentar.

   El patrón correcto ya existe en `AdminRecojosCajero.jsx:47-49`.
6. **`.panel` es blanco en el admin oscuro.** Esqueletos y estados vacíos destellan en blanco. `theme.css:345`.
7. **El token `gold` ahora es gris**, así que lo urgente se ve neutro: "Pago en revisión", "Reembolso pendiente", "Vence hoy" (reclamaciones) y el borde de los KPI destacados.
8. **Los colores del estado de pago no coinciden** entre la lista y el detalle (en el detalle, "rechazado" se ve igual que "verificado"). Falta un `InsigniaEstadoPago` compartido.
9. **Venta presencial: botones − y + de 24px**, y la papelera pegada al subtotal sin opción de deshacer. `AdminVentaPresencial.jsx:487-496`.
10. **Formularios que se pierden** al tocar el fondo o pulsar Escape: producto (largo, con imágenes) y respuesta a un reclamo (3000 caracteres).
11. **La ventana de AdminProveedorDetalle no es accesible**: no tiene `role`, ni foco atrapado, ni Escape, y los campos no tienen etiqueta.
12. **"Agregar imagen" no funciona con teclado** (input `hidden` dentro de un label), y las imágenes son obligatorias. `AdminProductos.jsx:697-707`.

### Media
13. **El dashboard compara un mes a medias con el mes anterior completo**, así que la tendencia sale siempre en rojo. `AdminDashboard.jsx:268-280`.
14. **Demasiado movimiento para una herramienta diaria.**
    - Saludo animado letra por letra.
    - Contadores de 1,65s que se reinician al cambiar de periodo.
    - `adm-pulse` infinito en todos los avisos.
15. **Gráficos.**
    - Los textos quedan en unos 6px en el celular.
    - El valor de cada barra solo aparece al pasar el mouse.
    - En oscuro, los puntos usan `fill-white`.
16. **Cifras de dinero.** Están alineadas a la izquierda y no usan `tabular-nums` (0 usos). En varios lugares se usa `toFixed(2)` en vez de `soles()`, así que faltan los separadores de miles.
17. **Filas no clicables.** Las acciones de ícono tienen unos 16px de área táctil, y los pedidos recientes del dashboard no son enlaces.
18. **Los filtros y la página de Pedidos y Productos se pierden al volver del detalle.** Conviene `useSearchParams`.
19. **Al filtrar, la tabla salta al esqueleto.** En Productos no hay indicación de carga y se busca en cada tecla, sin esperar.
20. **El formulario de producto queda apretado** en `max-w-lg`. Le faltan una barra de acciones fija, errores por campo y una apertura instantánea.
21. **El botón principal está escrito a mano unas 30 veces**, en lugar de `.btn-primary`. Pierde el mínimo de 44px en pantallas táctiles, y el secundario `bg-white` casi no se ve en oscuro.
22. **Siete ventanas hechas a mano** en lugar de `Dialog`.
23. **Tres estilos de pestañas.** Las de Almacén tienen ARIA a medias.
24. **Falta la ruta de navegación en los detalles**, y los nombres del menú no coinciden con los títulos (Nueva venta / Venta presencial, etc.).
25. **Navegación del celular.**
    - 14 pestañas, y la activa no se lleva a la vista.
    - No aparece el usuario ni se puede cambiar de cuenta.
    - El botón de salir mide unos 36px.
26. **Venta presencial lenta.**
    - No se puede recorrer los resultados con ↑/↓ ni elegir con Enter.
    - El buscador no tiene etiqueta.
    - En el celular, el total queda al fondo.
    - Faltan botones rápidos de monto.
    - Falta `role="alert"` en el error.
27. **"Entregado" con confirmación en Recojos, pero no en el detalle del pedido.**
28. **El color de "Activo" y de los errores cambia entre páginas** (verde o berry; rojo o berry).

### Baja
29. **Línea de avance.** `ring-white` en oscuro, y un estado desconocido se muestra como "nada hecho".
30. **Estados de pedido que se ven iguales**: "Listo para recoger" igual que "Enviado", y "Confirmado" casi igual que "Preparando". `estadosPedido.js:30-37`.
31. **Paginador** de 32px, y solo arriba.
32. **El buscador cambia de ancho al enfocarlo.** `admin-motion.css:141`.
33. **"Necesita tu atención" usa hex fijos** y se funde con la superficie oscura.
34. **El contorno de foco berry sobre la cabecera oscura** tiene contraste de 2,9:1. "Reducir movimiento" sí está bien cubierto en el admin.

---

## Orden sugerido para trabajarlo

1. **Seguridad y dinero (1 PR):** confirmaciones, `catch` en las cargas y en `cambiarEstado`, y estados de error con Reintentar.
2. **CSS base (1 PR):**
   - color del `body`
   - `.panel` en oscuro
   - variable de la cabecera
   - "reducir movimiento" completo
   - foco por tema
   - `@custom-variant dark`
   - `overflow-x-auto` en las tablas
   - letra de 16px en los campos
3. **Tokens semánticos de estado:** `success`, `warning`, `danger` e `info`, reemplazando `gold` y las clases rojo/verde/ámbar crudas. Esto elimina buena parte de los parches oscuros.
4. **Componentes base:** `Button`, `Field`/`Input`, `Badge`, `Modal` y `Pestanas`. Después, migrar página por página.
5. **UX puntual:** filtros de la tienda en hoja inferior, CTA fijo en el checkout, venta presencial con teclado, filtros del admin en la URL y comparación de mes justa en el dashboard.
