// Pruebas del consentimiento de estadísticas (src/consentimiento.js). Sin dependencias nuevas:
//     npm test        (usa el ejecutor de pruebas incluido en Node)
// Simulan un navegador con un localStorage que SOBREVIVE entre "visitas": volver a importar el módulo
// equivale a recargar la página o cerrar y abrir el navegador.
import test from "node:test";
import assert from "node:assert/strict";

class AlmacenFalso {
  constructor() { this.d = new Map(); this.bloqueado = false; }
  _c() { if (this.bloqueado) throw new Error("SecurityError"); }
  getItem(k) { this._c(); return this.d.has(k) ? this.d.get(k) : null; }
  setItem(k, v) { this._c(); this.d.set(k, String(v)); }
  removeItem(k) { this._c(); this.d.delete(k); }
  get length() { return this.d.size; }
  keys() { return [...this.d.keys()]; }
}

let visita = 0;
async function abrirTienda(almacen) {
  globalThis.localStorage = almacen;
  return import(`../src/consentimiento.js?visita=${++visita}`);
}
const CONSENT = "ans_consentimiento";
const SESION = "ans_sesion_analitica";
const DIA = 24 * 60 * 60 * 1000;

test("primera visita: sin decisión no se crea identificador ni se escribe nada", async () => {
  const ls = new AlmacenFalso();
  const c = await abrirTienda(ls);
  assert.equal(c.estadoConsentimiento(), "pendiente");
  assert.equal(c.analiticaPermitida(), false);
  assert.equal(c.obtenerSesionAnalitica(), null);
  assert.equal(ls.length, 0, "no debe haber NADA guardado antes de decidir");
});

test("un identificador heredado de una versión anterior se borra al cargar si no hay consentimiento", async () => {
  const ls = new AlmacenFalso();
  ls.setItem(SESION, "id-viejo-sin-permiso");
  const c = await abrirTienda(ls);
  assert.equal(ls.getItem(SESION), null);
  assert.equal(c.obtenerSesionAnalitica(), null);
});

test("aceptar: se crea el identificador y se registran decisión, fecha y versión", async () => {
  const ls = new AlmacenFalso();
  const c = await abrirTienda(ls);
  const id = c.crearSesionAnalitica();
  assert.ok(id && id.length >= 16);
  c.guardarDecision(true);
  assert.equal(c.estadoConsentimiento(), "aceptado");
  assert.equal(c.obtenerSesionAnalitica(), id);
  const d = JSON.parse(ls.getItem(CONSENT));
  assert.equal(d.analitica, true);
  assert.equal(d.version, "2026-11");
  assert.ok(!Number.isNaN(Date.parse(d.decidido_en)));
});

test("rechazar: no hay identificador, no se crea y se recuerda la decisión", async () => {
  const ls = new AlmacenFalso();
  const c = await abrirTienda(ls);
  c.guardarDecision(false);
  assert.equal(c.estadoConsentimiento(), "rechazado");
  assert.equal(c.obtenerSesionAnalitica(), null);
  assert.equal(ls.getItem(SESION), null);
  assert.equal(JSON.parse(ls.getItem(CONSENT)).analitica, false);
});

test("retirar tras aceptar: el seguimiento se detiene y el identificador se elimina al instante", async () => {
  const ls = new AlmacenFalso();
  const c = await abrirTienda(ls);
  c.crearSesionAnalitica();
  c.guardarDecision(true);
  assert.ok(c.obtenerSesionAnalitica());

  const anterior = c.borrarSesionAnalitica(); // lo que hace retirar(): devuelve el id para pedir su borrado al servidor
  c.guardarDecision(false);
  assert.ok(anterior);
  assert.equal(c.estadoConsentimiento(), "rechazado");
  assert.equal(c.obtenerSesionAnalitica(), null);
  assert.equal(ls.getItem(SESION), null);
});

test("la elección se respeta al recargar y al cerrar y abrir el navegador (aceptada)", async () => {
  const ls = new AlmacenFalso();
  const c1 = await abrirTienda(ls);
  const id = c1.crearSesionAnalitica();
  c1.guardarDecision(true);
  const c2 = await abrirTienda(ls); // "recarga" / navegador reabierto
  assert.equal(c2.estadoConsentimiento(), "aceptado");
  assert.equal(c2.obtenerSesionAnalitica(), id, "mismo identificador, no se vuelve a preguntar");
});

test("la elección se respeta al recargar y reabrir (rechazada): sigue sin identificador", async () => {
  const ls = new AlmacenFalso();
  (await abrirTienda(ls)).guardarDecision(false);
  const c2 = await abrirTienda(ls);
  assert.equal(c2.estadoConsentimiento(), "rechazado");
  assert.equal(c2.obtenerSesionAnalitica(), null);
  assert.equal(ls.getItem(SESION), null);
});

test("iniciar y cerrar sesión no tocan la elección (la sesión no vive en estas claves)", async () => {
  const ls = new AlmacenFalso();
  const c = await abrirTienda(ls);
  c.crearSesionAnalitica();
  c.guardarDecision(true);
  // lo que hacen login/logout y el carrito en el navegador: otras claves, nunca estas
  ls.setItem("ans_carrito", "[]"); ls.setItem("ans_csrf_x", "t");
  ls.removeItem("ans_carrito"); ls.removeItem("ans_csrf_x");
  const c2 = await abrirTienda(ls);
  assert.equal(c2.estadoConsentimiento(), "aceptado");
  assert.ok(c2.obtenerSesionAnalitica());
});

test("guardar la decisión no borra ni modifica claves ajenas (carrito, sesión, etc.)", async () => {
  const ls = new AlmacenFalso();
  ls.setItem("ans_carrito", "[1]"); ls.setItem("recordar_email", "a@b.c");
  const c = await abrirTienda(ls);
  c.guardarDecision(false);
  assert.equal(ls.getItem("ans_carrito"), "[1]");
  assert.equal(ls.getItem("recordar_email"), "a@b.c");
});

test("si cambia la versión del aviso, se vuelve a preguntar y se elimina el identificador", async () => {
  const ls = new AlmacenFalso();
  ls.setItem(CONSENT, JSON.stringify({ analitica: true, decidido_en: new Date().toISOString(), version: "2025-01" }));
  ls.setItem(SESION, "id-de-otra-version");
  const c = await abrirTienda(ls);
  assert.equal(c.estadoConsentimiento(), "pendiente");
  assert.equal(ls.getItem(SESION), null);
});

test("el consentimiento vence a los 12 meses", async () => {
  const ls = new AlmacenFalso();
  const c = await abrirTienda(ls);
  c.guardarDecision(true);
  assert.equal(c.estadoConsentimiento(Date.now() + 364 * DIA), "aceptado");
  assert.equal(c.estadoConsentimiento(Date.now() + 366 * DIA), "pendiente");
});

test("un valor dañado no rompe nada y cuenta como sin decisión", async () => {
  const ls = new AlmacenFalso();
  ls.setItem(CONSENT, "{no es json");
  const c = await abrirTienda(ls);
  assert.equal(c.estadoConsentimiento(), "pendiente");
  assert.equal(c.obtenerSesionAnalitica(), null);
  ls.setItem(CONSENT, JSON.stringify({ analitica: "si", version: 1 }));
  assert.equal(c.estadoConsentimiento(), "pendiente", "tipos incorrectos no valen como consentimiento");
});

test("con el almacenamiento bloqueado no hay seguimiento y nada lanza errores", async () => {
  const ls = new AlmacenFalso();
  ls.bloqueado = true;
  const c = await abrirTienda(ls);
  assert.equal(c.estadoConsentimiento(), "pendiente");
  assert.equal(c.obtenerSesionAnalitica(), null);
  assert.equal(c.crearSesionAnalitica(), null);
  assert.doesNotThrow(() => c.guardarDecision(true));
  assert.equal(c.obtenerSesionAnalitica(), null);
});

test("los componentes se enteran de los cambios (suscripción)", async () => {
  const c = await abrirTienda(new AlmacenFalso());
  let avisos = 0;
  const baja = c.suscribir(() => avisos++);
  c.guardarDecision(true);
  c.guardarDecision(false);
  baja();
  c.guardarDecision(true);
  assert.equal(avisos, 2);
});

test("el panel de preferencias se abre y se cierra y avisa a quien lo escucha", async () => {
  const c = await abrirTienda(new AlmacenFalso());
  let avisos = 0;
  const baja = c.suscribirPanel(() => avisos++);
  assert.equal(c.panelPreferenciasAbierto(), false);
  c.abrirPreferencias();
  assert.equal(c.panelPreferenciasAbierto(), true);
  c.cerrarPreferencias();
  assert.equal(c.panelPreferenciasAbierto(), false);
  baja();
  assert.equal(avisos, 2);
});
