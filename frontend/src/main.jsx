import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ConfirmProvider } from "./components/ConfirmDialog.jsx";
// Fuentes alojadas en nuestro propio sitio (paquetes @fontsource, licencia OFL):
// así no se le envía la IP de cada visitante a Google Fonts. Solo el subconjunto
// latino, que cubre español (tildes, ñ, ¿ ¡).
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/dm-sans/latin-800.css";
import "@fontsource/dm-serif-display/latin-400.css";
import "@fontsource/dm-serif-display/latin-400-italic.css";
import "./styles/theme.css";
import "./styles/admin-motion.css";
import { importarConReintento } from "./utils/lazyConReintento.js";

// La comparación se hace directo con import.meta.env para que Vite la resuelva al
// construir y descarte la rama que no se usa: el build del admin NO incluye la
// tienda (carrito, favoritos, checkout…) y el build de la tienda con VITE_ADMIN_URL
// NO incluye el panel.
async function arrancar() {
  const raiz =
    import.meta.env.VITE_APP_MODE === "admin"
      ? await arrancarAdmin()
      : await arrancarTienda();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>{raiz}</AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

async function arrancarAdmin() {
  const { default: AdminRaiz } = await importarConReintento(() => import("./AdminRaiz.jsx"));
  return <AdminRaiz />;
}

async function arrancarTienda() {
  const [{ default: App }, { default: BannerPrivacidad }, { FavoritosProvider }, { CarritoProvider }] = await Promise.all([
    importarConReintento(() => import("./App.jsx")),
    importarConReintento(() => import("./components/BannerPrivacidad.jsx")),
    importarConReintento(() => import("./context/FavoritosContext.jsx")),
    importarConReintento(() => import("./context/CarritoContext.jsx")),
  ]);
  return (
    <FavoritosProvider>
      <CarritoProvider>
        <App />
        <BannerPrivacidad />
      </CarritoProvider>
    </FavoritosProvider>
  );
}

arrancar();
