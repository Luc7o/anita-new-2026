---
name: Anita New Style
description: La bolsa de Anita, en calma. Una tienda clara y clásica donde el papel seda, la etiqueta kraft y la boleta aparecen solo donde tienen un trabajo.
colors:
  bolsa: "#16131a"
  bolsa-2: "#24202a"
  bolsa-linea: "rgb(255 255 255 / 0.14)"
  seda: "#a53694"
  seda-claro: "#c24fae"
  seda-hondo: "#7e2470"
  seda-niebla: "#f4e4f0"
  boleta: "#fbfaf8"
  papel: "#efedf0"
  blanco: "#ffffff"
  kraft: "#b98b5e"
  kraft-claro: "#d9b48c"
  tinta: "#1c1a1d"
  tinta-suave: "#5c5660"
  linea: "rgb(28 26 29 / 0.14)"
  linea-fuerte: "rgb(28 26 29 / 0.32)"
  sobre-oscuro: "#f6f2f5"
  sobre-oscuro-suave: "#c9c0c8"
  exito: "#15803d"
  exito-fondo: "#e6f4ea"
  aviso: "#92400e"
  aviso-fondo: "#fdf1dc"
  peligro: "#b91c1c"
  peligro-fondo: "#fdeaea"
  oscuro-fondo: "#141117"
  oscuro-superficie: "#1f1b23"
  oscuro-texto: "#eee8ee"
  oscuro-linea: "#2c2730"
  exito-oscuro: "#86efac"
  aviso-oscuro: "#fcd34d"
  peligro-oscuro: "#fca5a5"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 6.2vw, 5.6rem)"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque, Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.6vw, 3rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title-panel:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0em"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.06em"
  precio-etiqueta:
    fontFamily: "Bricolage Grotesque, Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  importe:
    fontFamily: "Spline Sans Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "28px"
    fontWeight: 600
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
rounded:
  pieza: "4px"
  chip: "6px"
  item: "8px"
  control: "10px"
  caja: "12px"
  pastilla: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "72px"
  gutter-movil: "16px"
  gutter-ancho: "40px"
components:
  cinta:
    backgroundColor: "{colors.seda}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.control}"
    padding: "0 22px"
    height: "48px"
  cinta-hover:
    backgroundColor: "{colors.seda-hondo}"
  cinta-oscuro:
    backgroundColor: "{colors.seda}"
    textColor: "{colors.blanco}"
  boton-bolsa:
    backgroundColor: "{colors.bolsa}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.control}"
    padding: "0 22px"
    height: "48px"
  boton-borde:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "0 22px"
    height: "48px"
  campo:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "48px"
  opcion-elegida:
    backgroundColor: "{colors.seda-niebla}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
    height: "52px"
  etiqueta:
    backgroundColor: "{colors.kraft}"
    textColor: "{colors.tinta}"
    typography: "{typography.precio-etiqueta}"
    padding: "26px 16px 14px"
  boleta:
    backgroundColor: "{colors.boleta}"
    textColor: "{colors.tinta}"
    padding: "30px 28px 36px"
  chip-exito:
    backgroundColor: "{colors.exito-fondo}"
    textColor: "{colors.exito}"
    rounded: "{rounded.chip}"
    padding: "4px 10px"
  chip-aviso:
    backgroundColor: "{colors.aviso-fondo}"
    textColor: "{colors.aviso}"
    rounded: "{rounded.chip}"
    padding: "4px 10px"
  chip-peligro:
    backgroundColor: "{colors.peligro-fondo}"
    textColor: "{colors.peligro}"
    rounded: "{rounded.chip}"
    padding: "4px 10px"
  chip-rosa:
    backgroundColor: "{colors.seda-niebla}"
    textColor: "{colors.seda-hondo}"
    rounded: "{rounded.chip}"
    padding: "4px 10px"
  riel-item:
    backgroundColor: "transparent"
    textColor: "{colors.sobre-oscuro-suave}"
    rounded: "{rounded.item}"
    padding: "0 10px"
    height: "40px"
  riel-item-activo:
    backgroundColor: "{colors.seda}"
    textColor: "{colors.blanco}"
  caja-panel:
    backgroundColor: "{colors.boleta}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.caja}"
    padding: "18px"
---

# Design System: Anita New Style

<!-- Fuente: propuesta-rediseno/index.html (seis vistas: tienda, producto, bolsa, panel, mostrador, sistema). La barra negra «Propuesta de rediseño» es envoltorio de la propuesta, no del sistema. Este mundo reemplaza los tokens actuales de frontend/src/styles/theme.css («Galería Carbón»). -->

## Overview

**Creative North Star: "La bolsa de Anita, en calma"**

La tienda online es una tienda clásica y clara, con fondo blanco, navegación blanca y una grilla pareja de productos con el precio como texto. El mundo de la compra en el local de Anita aparece solo donde tiene un trabajo. El papel seda magenta envuelve la pieza de la semana en la portada y marca la acción y lo elegido. La etiqueta kraft cuelga de esa pieza y lleva el código de recojo. La boleta con borde perforado aparece donde hay precio y entrega, pago, recojo o caja: portada, ficha, bolsa, «Cómo compras» y mostrador. La bolsa negra mate queda en el botón «Mi bolsa», el pie y el riel del panel. El panel cuenta la misma compra desde el mostrador, y cada venta es una boleta que se imprime mientras se arma.

La densidad cambia según la escena. La tienda es tranquila: blanco, titulares grandes y una sola zona de color fuerte (la seda del hero), con la boleta al lado de la pieza para que la entrega y el total estén a la vista. El panel es denso y táctil: cajas de papel boleta sobre fondo papel, cifras en mono tabular y controles de 44 a 60 px para usar con el dedo.

**Modo oscuro obligatorio.** La propuesta se dibuja en claro, pero la app (tienda y panel) tiene que salir también en oscuro. La vista Sistema fija el par oscuro: la bolsa pasa a ser el fondo (`oscuro-fondo`, `oscuro-superficie`), el texto se aclara (`oscuro-texto`, `sobre-oscuro-suave`), la cinta conserva `seda` con texto blanco (5.9:1; `seda-claro` con blanco daba unos 4.2:1 y no llegaba a AA) y los estados cambian a sus tonos claros sobre fondos translúcidos. Lo que la vista no muestra (la boleta, la etiqueta y las tablas en oscuro) queda **[por resolver en la implementación]**, siguiendo ese par.

**Key Characteristics:**
- Tienda en blanco y panel en papel. Papel seda magenta solo en la portada, la acción y lo elegido. Boleta donde hay precio y entrega. Kraft para la etiqueta de la portada y los códigos de recojo. Bolsa negra en «Mi bolsa», el pie y el riel.
- Tres voces tipográficas: Bricolage Grotesque para titulares, Manrope para trabajar y Spline Sans Mono para importes.
- Objetos con forma propia: etiqueta con esquinas cortadas y ojal, y boleta con dientes perforados.
- Una sola acción principal por vista: la cinta magenta.
- Estados (éxito, aviso, peligro) con significado fijo en los dos temas.

## Colors

La paleta es la de los materiales de la compra: bolsa, papel seda, boleta, kraft y tinta, más tres colores de estado que no se tocan.

### Primary
- **Papel seda** (`seda`): el magenta del logo. Se usa en la cinta (botón principal), el ítem activo del riel, el contador de la bolsa, la opción elegida (borde de 2px), el foco y el campo del hero, que envuelve la pieza de la semana. Al pasar el cursor baja a **Seda honda** (`seda-hondo`), que también sirve de texto sobre **Niebla de seda** (`seda-niebla`), el fondo de lo elegido y de la insignia de descuento.
- **Seda clara** (`seda-claro`): la seda sobre fondo oscuro. Solo es el anillo de foco dentro de la bolsa. La cinta oscura no la usa (ver modo oscuro).

### Secondary
- **Etiqueta kraft** (`kraft`): la etiqueta colgante de la pieza de la semana, la etiqueta del código de recojo, el campo del código en el panel y la serie «mostrador» del gráfico de ventas. Siempre con texto en tinta. **Kraft claro** (`kraft-claro`) solo bordea el ojal. Las tarjetas de producto no llevan etiqueta kraft.

### Neutral
- **Bolsa** (`bolsa`): el botón «Mi bolsa» de la tienda, el pie, el riel del panel, la barra de pago y el fondo del ticket del mostrador. **Bolsa 2** (`bolsa-2`) es el relieve dentro de la bolsa (hover del riel). **Línea de bolsa** (`bolsa-linea`) separa dentro de lo oscuro.
- **Blanco** (`blanco`): el fondo de la tienda (portada, sistema), la navegación de la tienda, y además los campos, el buscador, las tarjetas de producto del mostrador, los filtros y el hover de filas.
- **Boleta** (`boleta`): la superficie de lectura. Boletas, cajas del panel, barra de compra en celular y franja de campaña.
- **Papel** (`papel`): el fondo del panel, del mostrador y de las pantallas de celular, gris lavanda, para que las cajas de boleta se lean como objetos aparte.
- **Tinta** (`tinta`): el texto. **Tinta suave** (`tinta-suave`) es el texto secundario, las ayudas y los encabezados de tabla.
- **Línea** (`linea`) y **Línea fuerte** (`linea-fuerte`): bordes de caja y separadores. La fuerte es la de los guiones de la boleta y los bordes de los controles.
- **Sobre oscuro** (`sobre-oscuro`, `sobre-oscuro-suave`): el texto dentro de la bolsa.

### Estados
- **Éxito** (`exito` sobre `exito-fondo`), **Aviso** (`aviso` sobre `aviso-fondo`) y **Peligro** (`peligro` sobre `peligro-fondo`): insignias de pedido y pago, el «Quedan 3», errores de campo y «Quitar». En oscuro usan `exito-oscuro`, `aviso-oscuro` y `peligro-oscuro` como texto, sobre ese mismo tono al 14 % de opacidad.
- La app actual también tiene un estado **info**. La propuesta no lo dibuja, así que su valor en este mundo queda **[por resolver en la implementación]**.

### Named Rules
**The Seda Envuelve Rule.** El magenta solo envuelve lo activo y la acción: la cinta, el ítem actual, lo elegido, el foco y la pieza de la semana. Nunca es fondo de sección fuera del hero, ni texto de cuerpo, ni color de estado.

**The Estados Fijos Rule.** Verde es éxito, ámbar es aviso y rojo es peligro, en la tienda, en el panel y en los dos temas. El magenta nunca comunica un estado, y un estado nunca se pinta de magenta.

**The Tienda Blanca, Panel Papel Rule.** La tienda va sobre `blanco`. El panel va sobre `papel`, con cajas de `boleta`. Toda boleta de la tienda descansa sobre una cama de `papel` (columna del hero, área de la ficha, banda «Cómo compras»): la máscara del borde perforado recorta su propia sombra, así que sobre blanco la boleta no se lee como objeto.

**The Mundo Con Trabajo Rule.** La seda, la etiqueta kraft y la boleta solo aparecen donde hacen algo. La seda envuelve la pieza de la semana y marca la acción. La etiqueta lleva un precio destacado o un código. La boleta muestra precio con entrega, pago, recojo o caja. En el resto, la tienda queda en blanco y tinta.

## Typography

**Display Font:** Bricolage Grotesque (con Manrope y system-ui de respaldo), ejes opsz 12 a 96, pesos 500, 700 y 800.
**Body Font:** Manrope (con ui-sans-serif y system-ui), pesos 400 a 700.
**Label/Mono Font:** Spline Sans Mono (con ui-monospace), pesos 400 y 600, siempre con `tabular-nums`.

**Character:** Bricolage da a los titulares una voz ancha y con carácter. Manrope es la voz de trabajo, clara para clientas mayores. La mono de boleta hace que cada importe se lea como impreso.

### Hierarchy
- **Display** (800, clamp(3rem, 6.2vw, 5.6rem), 0.94): solo el titular del hero de la tienda. En celular baja a 2.7rem.
- **Headline** (800, clamp(2rem, 3.6vw, 3rem), 1): títulos de sección de la tienda («Lo nuevo de la semana», «Cómo compras», campaña) y de la hoja del sistema. El título de la ficha usa clamp(2rem, 3vw, 2.6rem) y el h1 del panel, 32px.
- **Title** (Bricolage 700, 26px, 1.15): nombre de la pieza en la boleta y cabeceras de boleta (de 18 a 20px, 800).
- **Title de panel** (Manrope 700, 17px): encabezados de caja en el panel («Pedidos», gráfico, recojos). En el panel los títulos de caja no usan la display.
- **Body** (400, 16px, 1.55): texto corriente. Las bajadas de sección van a 46 a 64ch y las reseñas a 62ch. Nombres de pieza en la grilla en Manrope 600, 16px (14px en celular), con la categoría debajo en 14px `tinta-suave`.
- **Label** (700, de 12 a 13px, de 0.04 a 0.08em, MAYÚSCULAS): grupos de formulario («Color», «Entrega»), grupos del riel, encabezados de tabla y títulos del pie. Rotulan controles o columnas. Nunca van sobre un titular.
- **Importe** (Spline Sans Mono 600): totales de boleta a 28px, precio de ficha a 38px, KPI del panel a 26px, precio en la grilla a 16px (14px en celular, con el precio anterior tachado en 400 13px `tinta-suave`), y líneas y cantidades de 14 a 15px.
- **Precio en etiqueta** (Bricolage 800, 30px, 1): solo el precio colgado de la pieza de la semana. El código de recojo en etiqueta vuelve a la mono (600, 36px, 0.06em).

### Named Rules
**The Importe Impreso Rule.** Todo importe, cantidad, código o contador va en Spline Sans Mono con cifras tabulares. La única excepción es el precio grande dentro de la etiqueta kraft de la portada, que va en Bricolage 800.

**The Una Display Rule.** Bricolage es para titulares de la tienda, nombres de pieza en boleta y precios en etiqueta. En el panel, los títulos de caja van en Manrope 700.

## Layout

- **Márgenes laterales:** 16px en celular y 40px desde 900px, respetando `safe-area-inset`.
- **Ritmo:** pasos de 8, 12, 16, 24, 32, 48 y 72px. Las secciones de la tienda llevan 72px de padding vertical («Cómo compras», 80px; en celular, 56px).
- **Hero de la tienda:** grid de campo seda (1fr) y boleta fija (420px; 380px por debajo de 1180px), con la columna de la boleta en `papel` como cama. El campo seda es la única zona de color fuerte de la tienda. Dentro de la seda, el texto va a la izquierda y la foto envuelta a la derecha (máximo 470px, 4:5), con la etiqueta colgando de la foto. Por debajo de 980px todo se apila, la boleta queda inset con 16px de `papel` alrededor, y la acción baja a una barra fija con aspecto de tira de boleta.
- **Grilla de productos («Lo nuevo»):** 4 columnas iguales con separación de 32px × 20px, y 2 columnas por debajo de 980px (24px × 12px en celular). Cada pieza lleva una foto 4:5 con radio de 4px sobre gris #ecebee y, debajo, el nombre, la categoría y el precio en mono. Sobre la foto van las insignias apiladas arriba a la izquierda (descuento en rosa, poco stock en aviso) y el favorito arriba a la derecha. No hay marco ni tarjeta, solo la foto y el texto.
- **Bandas:** «Cómo compras» va en `papel`, con texto en tinta. «Cómo compras» conserva su boleta porque lleva el precio y la entrega.
- **Ficha:** galería (1.25fr) con miniaturas de 84px y boleta fija con `sticky` (0.9fr), separadas por 48px. Se apila por debajo de 900px.
- **Panel:** riel de 248px más área de trabajo. El cuerpo es contenido (1fr) más la boleta del día (340px, con `sticky`). Por debajo de 1180px la boleta del día baja; por debajo de 900px el riel se vuelve una fila horizontal con scroll. En celular las tablas se convierten en filas apiladas y los recojos suben arriba.
- **Mostrador:** catálogo con rejilla `auto-fill, minmax(150px, 1fr)` y ticket de 380px. Se apila por debajo de 980px, y en celular el cobro baja a una barra fija.
- **Puntos de corte observados:** 520/560, 680/720/760, 900, 980 y 1180px.

## Elevation & Depth

Es un sistema híbrido: casi plano en el panel y con objetos de papel levantados en la tienda. Las cajas del panel se separan con un borde interior de 1px (`linea`), no con sombra. Solo los objetos de papel (boleta, etiqueta) y la cinta proyectan sombra, siempre difusa, con desplazamiento vertical negativo en el difuminado y tintada con la bolsa.

### Shadow Vocabulary
- **Sombra de objeto** (`box-shadow: 0 18px 40px -22px rgb(22 19 26 / 0.55)`): boletas del hero, de la ficha, de «Cómo compras» y del día.
- **Sombra baja** (`box-shadow: 0 6px 16px -10px rgb(22 19 26 / 0.45)`): etiqueta kraft y segmento elegido.
- **Brillo de cinta** (`box-shadow: 0 10px 22px -12px #7e2470`): debajo de la cinta.
- **Tira inferior** (`box-shadow: 0 -10px 30px -12px rgb(22 19 26 / .45)`): barra de compra fija en celular.

### Named Rules
**The Papel Levanta Rule.** Solo levanta lo que es papel (boleta, etiqueta) o la acción (cinta). Las cajas, tablas y tarjetas del panel quedan planas con borde de 1px, y las piezas de la grilla de la tienda no llevan sombra.

## Shapes

- **Esquinas:** casi rectas en lo que es papel o foto (`pieza`, 4px), suaves en los controles (`control`, 10px), 12px en las cajas del panel y en pastilla (`pastilla`) para el botón de la bolsa, los botones de icono, los filtros del mostrador y las muestras de color.
- **Boleta:** sin radio. Su borde inferior lleva dientes semicirculares de 9px, hechos con máscara radial. Los separadores internos van en guiones de 1px (`linea-fuerte`).
- **Etiqueta:** rectángulo con las dos esquinas superiores cortadas a 14px (clip-path) y un ojal de 11px en color bolsa, con aro kraft claro. Cuelga girada entre -6 y 4 grados desde su borde superior.
- **Bordes de control:** anillo interior de 1.5px (`linea` o `linea-fuerte`) que pasa a 2px `seda` al elegirse.
- **Iconos:** SVG de trazo a 1.8, con extremos redondeados, de 20px (18px en el riel).

## Components

### Buttons
Táctiles y directos, con una sola voz de color.
- **Shape:** esquinas suaves (10px), 48px de alto como mínimo y 22px de padding horizontal. Manrope 700, 16px.
- **Cinta (principal):** fondo seda y texto blanco, con brillo de cinta. Es la única acción principal: «Agregar a mi bolsa», «Pagar», «Cobrar» (60px y 18px en el mostrador).
- **Hover / Focus:** al pasar el cursor, la cinta baja a seda honda y el botón bolsa pasa a negro. Al pulsar, `scale(0.98)` en 150ms con la curva `salida`. Foco: contorno de 2.5px en seda con 3px de separación (seda clara dentro de la bolsa).
- **Botón bolsa (secundario):** fondo bolsa y texto blanco, para acciones de trabajo («Buscar»).
- **Botón borde (terciario):** transparente, con anillo interior de 1.5px en `linea-fuerte` que pasa a tinta al pasar el cursor. Sobre la seda, el anillo es blanco al 55 %.
- **Deshabilitado:** opacidad .5 y cursor `not-allowed`.

### Chips
- **Style:** radio de 6px, padding de 4px 10px, 13px 700. Fondo suave con texto del mismo tono (éxito, aviso, peligro), un neutro (tinta al 7 %) y uno rosa (niebla con seda honda) solo para descuentos.
- **Sobre la foto:** en la grilla, el descuento va en un chip rosa y el poco stock («Quedan 3») en un chip de aviso, apilados arriba a la izquierda.
- **State:** son informativos, no se pulsan. Los filtros pulsables del mostrador son pastillas de 44px: blancas con anillo, y en bolsa con texto blanco cuando están activas.

### Cards / Containers
- **Corner Style:** 12px en las cajas del panel y 10px en las tarjetas de producto del mostrador.
- **Background:** `boleta` (blanco en las tarjetas del mostrador).
- **Shadow Strategy:** planas (ver The Papel Levanta Rule).
- **Border:** anillo interior de 1px en `linea`. Los KPI comparten una caja dividida por líneas verticales, no son tarjetas separadas.
- **Internal Padding:** 18px. Las filas de lista y tabla llevan de 12 a 14px por 18px.

### Inputs / Fields
- **Style:** fondo blanco, borde de 1.5px en `linea-fuerte`, 10px de radio, 48px de alto y 16px de texto. Etiqueta visible arriba (13px 700) y ayuda debajo (13px, `tinta-suave`).
- **Focus:** el borde pasa a seda, con un halo de 3px en seda al 18 %.
- **Error:** borde y ayuda en `peligro`, y la ayuda en 600 dice qué falta («El DNI tiene 8 dígitos. Te faltan 4.»).
- **Código de recojo:** campo kraft sin borde, en mono 600 de 20px, con 0.2em de espaciado y centrado.

### Opciones y muestras
- **Opción (entrega, pago):** fila de 52px como mínimo, con anillo de 1.5px en `linea` (`linea-fuerte` al pasar el cursor). Al elegirse lleva anillo de 2px en seda y fondo niebla de seda. El importe va a la derecha, en mono.
- **Muestra de color:** pastilla de 44px con un círculo de 24px. Al elegirse lleva anillo de 2px en seda.
- **Segmento:** pista de tinta al 6 % y botón elegido blanco, con sombra baja.

### Navigation
- **Tienda:** arriba de todo va una barra blanca de 72px (64px en celular), con una línea de 1px debajo. La marca va en Bricolage 800 (21px), en tinta, con «NEW» en seda. Categorías en Manrope 600 de 15px, en `tinta-suave`, que pasan a tinta al pasar el cursor. Se ocultan por debajo de 980px. Los botones de icono de 44px se oscurecen con tinta al 7 % al pasar el cursor. El botón «Mi bolsa» es una pastilla negra de bolsa con contador seda en mono: cuando llega una pieza, el contador late (escala 1.35, 600ms).
- **Panel (riel):** fondo bolsa, ítems de 40px con radio de 8px, en Manrope 600 de 14px. Al pasar el cursor, bolsa-2. El ítem actual va en seda con texto blanco. Contadores en mono sobre blanco al 12 %. Grupos rotulados en Label, color #8f8692.

### Etiqueta colgante (firma)
Etiqueta kraft con esquinas cortadas, ojal y giro. Lleva el precio de la pieza de la semana en el hero (con el precio anterior tachado en mono 13px) y el código de 6 dígitos en la confirmación de recojo. No se cuelga de cada tarjeta de producto. En el hero entra balanceándose una vez (`cuelga`, 1.4s). Al agregar a la bolsa, una copia de la etiqueta vuela hasta «Mi bolsa» (700ms, `cubic-bezier(.5,-0.2,.6,1)`), gira, se encoge a .18 y la bolsa suma uno.

### Boleta perforada (firma)
Es la superficie donde se decide. Cada línea va en fila con concepto y, a la derecha, el importe en mono, separadas por guiones. El total va en Bricolage 800 con el importe en mono 600 de 28px. Aparece junto a la pieza en el hero y en la ficha, en «Cómo compras», en la bolsa, como boleta del día en el panel y como ticket en el mostrador. En el ticket cada línea nueva se «imprime»: se revela con clip-path de arriba abajo en 450ms.

### Movimiento
- **Curva `salida`:** `cubic-bezier(0.16, 1, 0.3, 1)` para todo lo que entra o responde.
- **Entrada del hero, una sola vez:** la foto se desenvuelve (clip-path de 30 % / 22 % a 0, 1.1s), el texto sube 14px en cascada de 80ms y la etiqueta se balancea.
- **Reducir movimiento:** con `prefers-reduced-motion: reduce` se quitan todas las animaciones y transiciones, y el contador suma al instante.

## Do's and Don'ts

### Do:
- **Do** usar la cinta seda como única acción principal de cada vista, y el botón bolsa o el de borde para todo lo demás.
- **Do** poner la boleta al lado de la pieza en la portada y en la ficha, con la entrega (recojo gratis o delivery a S/ 10.00) y el total antes de «Agregar a mi bolsa».
- **Do** escribir todo importe en Spline Sans Mono con cifras tabulares y el formato `S/ 0.00`.
- **Do** separar las cajas del panel con un borde interior de 1px en `linea` sobre `boleta`, y dejar la sombra solo a la boleta, la etiqueta y la cinta.
- **Do** mantener áreas táctiles de 44px como mínimo (48px en controles de compra, 60px en «Cobrar»).
- **Do** implementar el modo oscuro con el par de la vista Sistema: `oscuro-fondo` y `oscuro-superficie`, cinta en `seda` con texto blanco y estados en sus tonos claros al 14 %.
- **Do** llevar estos tokens a `frontend/src/styles/theme.css` como propiedades del `@theme` de Tailwind v4, reemplazando los de «Galería Carbón».

### Don't:
- **Don't** usar el magenta como color de estado, de sección ni de texto de cuerpo, ni un color de estado como acento de marca.
- **Don't** colgar etiquetas kraft de cada tarjeta de producto ni poner boletas donde no hay precio con entrega, pago, recojo o caja.
- **Don't** extender el campo de papel seda fuera del hero, ni volver a pintar de bolsa negra la navegación o las bandas de la tienda. Tampoco va una franja de avisos sobre la navegación: el recojo, el delivery y los pagos se dicen en la portada y en la boleta.
- **Don't** poner etiquetas en mayúsculas encima de los titulares. Las mayúsculas pequeñas solo rotulan controles, columnas y grupos.
- **Don't** poner el panel sobre blanco. Su fondo es `papel` y sus cajas, `boleta`.
- **Don't** repetir la entrada del papel seda. Se despliega una vez al entrar y no en cada scroll ni en cada vista.
