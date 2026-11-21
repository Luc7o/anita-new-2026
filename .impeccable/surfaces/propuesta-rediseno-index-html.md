---
version: 1
slug: "propuesta-rediseno-index-html"
primary_target: "propuesta-rediseno/index.html"
related_targets: ["propuesta-rediseno/panel.html","propuesta-rediseno/mostrador.html"]
---

# Propuesta de rediseño: tienda y panel

Scope: prototipo navegable en `propuesta-rediseno/` con estas pantallas:

- portada de la tienda (Persuade);
- ficha de producto;
- bolsa y checkout en celular;
- panel de gestión (Operate);
- mostrador de venta presencial en tablet (Operate);
- hoja del sistema.

Es una propuesta para aprobar antes de llevarla al código React.

- **Audiencia de la tienda:** mujeres de 25 a 50 años de Huancayo, en celular y computadora.
- **Audiencia del panel:** la cajera en tablet y la dueña en laptop.
- **Acción principal de la tienda:** agregar a la bolsa con el precio, el envío y el total a la vista.
- **Acción principal del panel:** atender pedidos y cobrar en mostrador rápido.

Las fotos de producto son de referencia (stock) porque los productos aún no tienen fotos propias. Las dos fotos de campaña son reales.

## Direction contract

**THESIS:** La tienda online es la compra en el local de Anita: la pieza se envuelve en papel seda magenta, lleva su etiqueta de precio colgada y sale con su boleta. Versión **calmada** (elegida por el usuario el 21 nov 2026, entre esta dirección y la tienda clásica): la base es una tienda clásica y clara, y el mundo de la bolsa aparece solo donde tiene un trabajo.

**OWN-WORLD:**
- **Base clara:** la tienda va en blanco (#ffffff), sin franja de avisos arriba (el usuario la quitó el 21 nov 2026), con navegación blanca y una grilla pareja de productos con el precio como texto.
- **Papel seda:** el magenta del logo (#a53694 / #c24fae) solo en la portada, en la acción principal y en lo elegido.
- **Boleta y etiqueta:** la boleta (#fbfaf8) y la etiqueta kraft (#b98b5e) solo donde hay precio y entrega, pago, recojo o caja: portada, ficha, bolsa, «Cómo compras», código de recojo y mostrador.
- **Bolsa negra:** la bolsa negra mate (#16131a) queda en el botón «Mi bolsa», el pie y el riel del panel.
- **Fondo del panel:** papel gris lavanda (#efedf0), para que las cajas de boleta se lean como objetos aparte.
- **Tipografía:** Bricolage Grotesque en titulares, Manrope en el cuerpo y una mono de boleta solo para importes.
- **Componentes:** etiquetas colgantes con ojal, boletas con borde perforado, botones de cinta.

**STORY:**
1. La clienta ve la pieza de la semana envuelta.
2. Entiende el precio con envío o recojo antes de decidir.
3. Confía porque hay tienda física en Huancayo y WhatsApp.
4. Agrega a su bolsa.

El panel cuenta la misma compra desde el mostrador: cada venta es una boleta que se imprime mientras se arma.

**FIRST VIEWPORT:**
- **Tienda:** a la izquierda, un campo de papel seda magenta de unos dos tercios con el titular grande y la foto de campaña recortada dentro, y la etiqueta de la pieza colgando de la foto. A la derecha, la boleta de la pieza con color, recojo/delivery, total y «Agregar a mi bolsa».
- **Panel:** riel negro de bolsa, área de trabajo en papel boleta y, a la derecha, la boleta del día.

**FORM:**
- **Forma:** «La bolsa de Anita», candidata 6 de 7 de la lista propia (seed:5fea8a066fe66ae6).
- **Interacción firma:** al agregar, la etiqueta baja a la bolsa y la boleta suma la línea con su importe.
- **Movimiento:** el papel seda se despliega una sola vez al entrar.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
