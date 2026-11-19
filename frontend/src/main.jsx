import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ConfirmProvider } from "./components/ConfirmDialog.jsx";
import { AnimateUIProvider } from "@animate-ui/react/provider";
// Fuentes alojadas en nuestro propio sitio (paquetes @fontsource, licencia OFL):
// así no se le envía la IP de cada visitante a Google Fonts. Solo el subconjunto
// latino, que cubre español (tildes, ñ, ¿ ¡).
// «Galería Carbón»: Manrope para textos y Syne (geométrica, como el logo) para títulos.
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "@fontsource/syne/latin-600.css";
import "@fontsource/syne/latin-700.css";
import "@fontsource/syne/latin-800.css";
import "./styles/theme.css";
import "./styles/admin-motion.css";
import { importarConReintento, recargarUnaVez } from "./utils/lazyConReintento.js";

// Vite avisa con este evento cuando no puede descargar un archivo que una página necesita
// (pasa justo después de un despliegue). Se recarga una sola vez para traer la versión nueva.
window.addEventListener("vite:preloadError", (evento) => {
  if (recargarUnaVez()) evento.preventDefault();
});

// Si aun así la tienda no puede arrancar, en vez de dejar la página en blanco se muestra un
// aviso con un botón para recargar (sin React: es justo lo que pudo fallar al cargar).
function mostrarErrorDeCarga(error) {
  console.error(error);
  const raiz = document.getElementById("root");
  if (!raiz) return;
  raiz.innerHTML = "";
  const caja = document.createElement("div");
  caja.setAttribute("role", "alert");
  caja.style.cssText =
    "min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;" +
    "padding:24px;text-align:center;font-family:Manrope,system-ui,sans-serif;background:#f6f3ee;color:#1f1e1c";
  const titulo = document.createElement("p");
  titulo.textContent = "Estamos actualizando la tienda";
  titulo.style.cssText = "margin:0;font-size:22px;font-weight:800";
  const texto = document.createElement("p");
  texto.textContent = "Hubo una versión nueva mientras cargaba la página. Vuelve a cargarla para continuar.";
  texto.style.cssText = "margin:0;max-width:360px;color:#6b6863";
  const boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = "Volver a cargar";
  boton.style.cssText =
    "min-height:48px;padding:0 24px;border:0;border-radius:12px;background:#a53694;color:#fff;font-weight:700;font-size:15px;cursor:pointer";
  boton.addEventListener("click", () => window.location.reload());
  caja.append(titulo, texto, boton);
  raiz.append(caja);
}

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
      {/* Ritmo común de las animaciones de Animate UI; con "reducir movimiento" quedan quietas. */}
      <AnimateUIProvider reducedMotion="user">
      <BrowserRouter>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>{raiz}</AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </BrowserRouter>
      </AnimateUIProvider>
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

arrancar().catch(mostrarErrorDeCarga);
