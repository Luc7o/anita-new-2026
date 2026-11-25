// Los flujos que dan plata: comprar con tarjeta y con Yape, pago rechazado con
// reintento, y la última unidad que queda libre cuando otro pedido vence.
import { test, expect } from "@playwright/test";
import { prepararBase, simularCulqi, ingresar, pagarConRecojo, sql } from "./ayudas.mjs";

let datos;
test.beforeEach(() => {
  datos = prepararBase();
});

test("compra con tarjeta: queda confirmada y baja el stock", async ({ page }) => {
  await simularCulqi(page);
  await ingresar(page, datos.clientes[0], datos.clave);

  await page.goto(`/producto/${datos.producto}`);
  await expect(page).toHaveTitle(/Polo E2E básico · Anita New Style/);
  await page.getByRole("button", { name: "Comprar ahora" }).click();
  await pagarConRecojo(page, "Tarjeta");

  await expect(page).toHaveURL(/\/pedidos\/\d+/);
  await expect(page.getByText("¡Compra realizada! Gracias por tu pedido")).toBeVisible();
  await expect(page.getByText(/confirmad/i).first()).toBeVisible();

  const r = await page.request.get(`http://127.0.0.1:5055/api/productos/${datos.producto}`);
  expect((await r.json()).stock).toBe(4);
});

test("compra con Yape", async ({ page }) => {
  await simularCulqi(page, "ype_e2e_ok");
  await ingresar(page, datos.clientes[0], datos.clave);
  await page.goto(`/producto/${datos.producto}`);
  await page.getByRole("button", { name: "Comprar ahora" }).click();
  await pagarConRecojo(page, "Yape");
  await expect(page).toHaveURL(/\/pedidos\/\d+/);
  await expect(page.getByText("¡Compra realizada! Gracias por tu pedido")).toBeVisible();
});

test("tarjeta rechazada: se avisa el motivo y el pedido queda pendiente de pago", async ({ page }) => {
  await simularCulqi(page, "tkn_e2e_rechazo");
  await ingresar(page, datos.clientes[0], datos.clave);
  await page.goto(`/producto/${datos.producto}`);
  await page.getByRole("button", { name: "Comprar ahora" }).click();
  await pagarConRecojo(page, "Tarjeta");

  await expect(page.getByRole("alert").getByText("Tu tarjeta no tiene fondos suficientes.")).toBeVisible();
  await expect(page).toHaveURL(/\/pedidos\/\d+/);
  await expect(page.getByText("¡Pedido registrado! Completa el pago para confirmarlo")).toBeVisible();
});

test("la última unidad vuelve a la venta cuando el pedido de otra persona vence", async ({ browser }) => {
  // Ana reserva la última unidad y abandona el pago.
  const ana = await browser.newPage();
  await simularCulqi(ana, "tkn_e2e_rechazo");
  await ingresar(ana, datos.clientes[0], datos.clave);
  await ana.goto(`/producto/${datos.ultimaUnidad}`);
  await ana.getByRole("button", { name: "Comprar ahora" }).click();
  await pagarConRecojo(ana, "Tarjeta");
  await expect(ana).toHaveURL(/\/pedidos\/\d+/);
  await ana.close();

  // Pasan los 20 minutos del plazo de pago.
  sql("UPDATE pedidos SET fecha_limite_pago = now() at time zone 'utc' - interval '1 minute' WHERE estado = 'pendiente'");

  // Beto la puede comprar sin que nadie corra el cron.
  const beto = await browser.newPage();
  await simularCulqi(beto);
  await ingresar(beto, datos.clientes[1], datos.clave);
  await beto.goto(`/producto/${datos.ultimaUnidad}`);
  await beto.getByRole("button", { name: "Comprar ahora" }).click();
  await pagarConRecojo(beto, "Tarjeta");
  await expect(beto.getByText("¡Compra realizada! Gracias por tu pedido")).toBeVisible();
  await beto.close();
});
