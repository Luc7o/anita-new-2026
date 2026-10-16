# Admin separado de la tienda

Es el MISMO repositorio y el MISMO código, pero se despliega dos veces:

| Proyecto en Vercel | Dominio | Variables de entorno |
|---|---|---|
| Tienda | www.anita-new-style.xyz | `VITE_API_URL`, `VITE_ADMIN_URL=https://admin.anita-new-style.xyz` (+ las que ya tenías) |
| Admin  | admin.anita-new-style.xyz | `VITE_API_URL`, `VITE_APP_MODE=admin`, `VITE_TIENDA_URL=https://www.anita-new-style.xyz` |

Ambos proyectos apuntan a la carpeta `frontend` del mismo repo.

## Backend (variables que ya existen en config.py)
- `FRONTEND_ORIGIN=https://www.anita-new-style.xyz,https://admin.anita-new-style.xyz` (CORS para los dos)
- `FRONTEND_TIENDA_URL=https://www.anita-new-style.xyz` (los correos abren la tienda)
- `COOKIE_DOMAIN=.anita-new-style.xyz` (con el punto inicial; la sesión se comparte)

## Desarrollo local
- Tienda: `npm run dev` (http://localhost:5173)
- Admin:  `npm run dev:admin` (http://localhost:5174, ya está permitido en CORS)

## Cómo se comporta
- Admin (`admin.…`): rutas desde la raíz (`/pedidos`, `/productos`…), login propio en `/login`, sin carrito ni tienda.
- Tienda con `VITE_ADMIN_URL`: `/admin/*` redirige al subdominio y el código del panel no se incluye.
- Sin ninguna variable: todo funciona como antes (panel en `/admin` dentro de la tienda).
