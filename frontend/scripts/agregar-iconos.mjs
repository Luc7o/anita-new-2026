// Descarga íconos animados del registro de Animate UI y los convierte de TSX a JSX con esbuild.
// (El CLI de shadcn, al convertir a JavaScript, rompía los SVG: "0 0 24 24" -> "0 24".)
// Uso (desde frontend/): npm run iconos -- bell heart shopping-cart
//   (los nombres son los de https://animate-ui.com/docs/icons/lucide-icons)
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const [, , carpeta, ...nombres] = process.argv;
const frontend = path.resolve(carpeta);
const requerir = createRequire(path.join(frontend, "package.json"));
const esbuild = requerir(requerir.resolve("esbuild", { paths: [path.dirname(requerir.resolve("vite"))] }));
const destino = path.join(frontend, "src", "components", "animate-ui", "icons");
fs.mkdirSync(destino, { recursive: true });

for (const nombre of nombres) {
  const resp = await fetch(`https://animate-ui.com/r/icons-lucide-${nombre}.json`);
  if (!resp.ok) {
    console.log(`${nombre}: no existe en el registro (${resp.status})`);
    continue;
  }
  const item = await resp.json();
  const deps = [...(item.dependencies || []), ...(item.registryDependencies || [])];
  for (const archivo of item.files) {
    const { code } = await esbuild.transform(archivo.content, {
      loader: "tsx",
      jsx: "preserve",
      format: "esm",
      target: "es2022",
    });
    const salida = path.join(destino, `${nombre}.jsx`);
    fs.writeFileSync(salida, code.replace(/^(['"])use client\1;?\s*/m, ""));
    const caja = code.match(/viewBox="[^"]*"/)?.[0];
    console.log(`${nombre}: ok ${caja} deps=${JSON.stringify(deps)}`);
  }
}
