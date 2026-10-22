import React from "react";
import { IconFacebook, IconInstagram, IconTikTok, IconWhatsApp } from "./Icons.jsx";
import useConfigTienda, { linkWhatsApp } from "../hooks/useConfigTienda.js";

const CLASE_POR_DEFECTO = "text-plum-soft transition hover:text-berry";

// Íconos de redes de la tienda (páginas de acceso y pie de página).
// `clase` permite cambiar el estilo de cada enlace según el fondo donde se use.
// Los enlaces salen de Configuración de la tienda; si un dato está vacío,
// ese ícono no se muestra (así no quedan enlaces muertos con href="#").
export default function RedesAuth({ clase = CLASE_POR_DEFECTO }) {
  const c = useConfigTienda();
  const wa = linkWhatsApp(c.whatsapp);
  return (
    <>
      {c.facebook_url && (
        <a href={c.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={clase}>
          <IconFacebook />
        </a>
      )}
      {c.instagram_url && (
        <a href={c.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={clase}>
          <IconInstagram />
        </a>
      )}
      {c.tiktok_url && (
        <a href={c.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={clase}>
          <IconTikTok />
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={clase}>
          <IconWhatsApp />
        </a>
      )}
    </>
  );
}
