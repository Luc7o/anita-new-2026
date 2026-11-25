// Pruebas de las utilidades puras del panel (filtros de formularios y formato).
//     npm test
import test from "node:test";
import assert from "node:assert/strict";

import { soloTexto, soloNumeros, soloDni, soloRuc, soloDireccion } from "../src/validacion.js";
import { soles } from "../src/formato.js";

// ------------------------------------------------------------ filtros de formularios
test("los filtros de texto dejan letras con tildes y ñ, y quitan lo demás", () => {
  assert.equal(soloTexto("José Ñañez<script>1"), "José Ñañezscript");
  assert.equal(soloTexto("O'Higgins-Pérez"), "O'Higgins-Pérez");
});

test("teléfono, DNI y RUC: solo dígitos y largo máximo", () => {
  assert.equal(soloNumeros("987-654-321-999"), "987654321");
  assert.equal(soloDni("12a345678 9"), "12345678");
  assert.equal(soloRuc("20-123456789-01"), "20123456789");
});

test("la dirección acepta solo . * ° # además de letras y números (igual que el backend)", () => {
  assert.equal(soloDireccion("Jr. Real N° 123 #4 *esq.; <b>"), "Jr. Real N° 123 #4 *esq. b");
});

// ------------------------------------------------------------------------ formato
test("soles siempre muestra dos decimales y trata lo vacío como 0", () => {
  assert.equal(soles(12.5), "S/ 12.50");
  assert.equal(soles("7"), "S/ 7.00");
  assert.equal(soles(null), "S/ 0.00");
  assert.equal(soles(undefined), "S/ 0.00");
  assert.equal(soles(NaN), "S/ 0.00");
});
