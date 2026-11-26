// Ayudas compartidas por las pruebas E2E.
import { execFileSync } from "node:child_process";
import { expect } from "@playwright/test";

const PY = process.env.E2E_PYTHON || "../backend/venv/Scripts/python.exe";

/** Vacía la base E2E y carga el catálogo mínimo. Devuelve ids y credenciales de prueba. */
export function prepararBase() {
  const salida = execFileSync(PY, ["e2e/servidor/preparar_base.py"], { encoding: "utf-8" });
  return JSON.parse(salida.trim().split("\n").pop());
}

/** Corre SQL de apoyo en la base E2E (p. ej. adelantar el vencimiento de un pago). */
export function sql(consulta) {
  execFileSync(PY, ["e2e/servidor/sql.py", consulta], { encoding: "utf-8" });
}

/**
 * Reemplaza el widget de Culqi (script externo) por uno falso: no hay iframe real ni
 * datos de tarjeta. Entrega el token que diga window.__tokenE2E (por defecto, aprobado);
 * los tokens que empiezan con "tkn_e2e_rechazo" los rechaza la Culqi falsa del backend.
 */
export async function simularCulqi(page, token = "tkn_e2e_ok") {
  await page.addInitScript((t) => { window.__tokenE2E = t; }, token);
  await page.route("https://js.culqi.com/**", (ruta) =>
    ruta.fulfill({
      contentType: "application/javascript",
      body: `
        window.CulqiCheckout = class {
          constructor(llave, config) { this.config = config; this.token = null; this.error = null; }
          open() {
            const marco = document.createElement("iframe");
            marco.src = "about:blank#culqi-e2e";
            marco.style.cssText = "position:fixed;inset:0;width:10px;height:10px;opacity:0.01";
            document.body.appendChild(marco);
            this.marco = marco;
            setTimeout(() => {
              this.token = { id: window.__tokenE2E, email: this.config.client.email };
              this.culqi();
            }, 300);
          }
          close() { this.marco?.remove(); }
        };`,
    })
  );
}

/** El aviso de privacidad aparece un instante después de cargar y, en celular, tapa
 * los botones de abajo: cada vez que se interponga, se rechaza. */
export async function rechazarCookies(page) {
  await page.addLocatorHandler(page.getByRole("region", { name: "Tu privacidad y cookies" }), async (aviso) => {
    await aviso.getByRole("button", { name: "Rechazar" }).click();
  });
}

export async function ingresar(page, email, clave) {
  await rechazarCookies(page);
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(clave);
  await page.getByLabel(/He leído y acepto/).check();
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).not.toHaveURL(/\/ingresar/);
}

/** Llena el checkout para recojo en tienda con el método de pago indicado y confirma. */
export async function pagarConRecojo(page, metodo = "Tarjeta") {
  await expect(page).toHaveURL(/\/checkout/);
  await page.getByRole("radio", { name: "Recojo en tienda" }).check();
  await page.getByLabel("Número de DNI").fill("12345678");
  await page.getByLabel("Teléfono").fill("987654321");
  await page.getByRole("radio", { name: metodo }).check();
  await page.getByRole("button", { name: "Confirmar y pagar" }).click();
}
