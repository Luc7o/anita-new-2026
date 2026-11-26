// Entorno de diseño: la tienda (Next, http://localhost:3000) con su API Flask local y la
// base anita_diseno, todo en esta computadora. No toca producción ni usa claves reales
// (Culqi es simulado). Primero, una sola vez: npm run diseno:preparar
//
// Uso (desde web/): npm run diseno   (Ctrl+C lo apaga todo)
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAIZ = path.resolve(WEB, "..");
const BASE = process.env.DISENO_DATABASE_URL || "postgresql://postgres:test@localhost:54329/anita_diseno";
const PY = process.env.E2E_PYTHON || path.join(RAIZ, "backend", "venv", "Scripts", "python.exe");
// Postgres local (carpeta fija fuera del repo). Si ya está corriendo, no se toca.
const PG = process.env.ANITA_PG || path.join(process.env.LOCALAPPDATA || "", "anita-pg");
const API = 5000;

const puertoAbierto = (puerto) =>
  new Promise((ok) => {
    const s = net.connect(puerto, "127.0.0.1");
    s.once("connect", () => (s.destroy(), ok(true)));
    s.once("error", () => ok(false));
  });

async function asegurarPostgres() {
  if (await puertoAbierto(54329)) return;
  const pgCtl = path.join(PG, "pgsql", "bin", process.platform === "win32" ? "pg_ctl.exe" : "pg_ctl");
  if (!fs.existsSync(pgCtl)) {
    console.error(`No hay Postgres en 54329 ni en ${PG}. Levanta tu Postgres local o define ANITA_PG.`);
    process.exit(1);
  }
  console.log("Iniciando Postgres local…");
  // pg_ctl start deja el servidor corriendo solo; no se espera su salida.
  spawn(pgCtl, ["-D", path.join(PG, "data"), "-l", path.join(PG, "log.txt"), "-o", "-p 54329 -c listen_addresses=localhost", "start"], {
    detached: true,
    stdio: "ignore",
  }).unref();
  for (let i = 0; i < 40 && !(await puertoAbierto(54329)); i++) await new Promise((r) => setTimeout(r, 250));
}

const hijos = [];
function lanzar(nombre, comando, argumentos, opciones) {
  const hijo = spawn(comando, argumentos, { stdio: ["ignore", "pipe", "pipe"], ...opciones });
  const prefijo = (linea) => `[${nombre}] ${linea}`;
  for (const flujo of [hijo.stdout, hijo.stderr]) {
    flujo.setEncoding("utf8");
    flujo.on("data", (t) => t.split(/\r?\n/).filter(Boolean).forEach((l) => console.log(prefijo(l))));
  }
  hijo.on("exit", (codigo) => {
    console.log(prefijo(`terminó (${codigo})`));
    apagar();
  });
  hijos.push(hijo);
}

let apagando = false;
function apagar() {
  if (apagando) return;
  apagando = true;
  for (const h of hijos) {
    if (h.exitCode !== null) continue;
    // En Windows hay que cerrar también los procesos hijos (next dev lanza varios).
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(h.pid), "/T", "/F"], { stdio: "ignore" });
    else h.kill("SIGTERM");
  }
  process.exit(0);
}
process.on("SIGINT", apagar);
process.on("SIGTERM", apagar);

await asegurarPostgres();

lanzar("api", PY, [path.join(WEB, "e2e", "servidor", "api.py")], {
  cwd: WEB,
  env: {
    ...process.env,
    PYTHONIOENCODING: "utf-8",
    E2E_DATABASE_URL: BASE,
    E2E_PUERTO_API: String(API),
    E2E_PUERTO_CULQI: "5001",
    E2E_PUERTO_TIENDA: "3000",
  },
});

lanzar("tienda", process.platform === "win32" ? "npx.cmd" : "npx", ["next", "dev", "--port", "3000"], {
  cwd: WEB,
  shell: process.platform === "win32",
  env: {
    ...process.env,
    DATABASE_URL: BASE,
    // Mismo "sitio" que la página (localhost) para que la cookie de sesión viaje.
    NEXT_PUBLIC_API_URL: `http://localhost:${API}/api`,
    NEXT_PUBLIC_TIENDA_URL: "http://localhost:3000",
    NEXT_PUBLIC_CULQI_PUBLIC_KEY: "pk_test_diseno",
  },
});
