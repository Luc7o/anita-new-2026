// `npm run e2e:web`: corre las mismas pruebas entrando por la app nueva (web/).
import { spawnSync } from "node:child_process";

const r = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, E2E_APP: "web" },
});
process.exit(r.status ?? 1);
