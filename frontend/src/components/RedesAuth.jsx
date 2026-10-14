import React from "react";
import { IconFacebook, IconInstagram, IconWhatsApp } from "./Icons.jsx";
import useConfigTienda, { linkWhatsApp } from "../hooks/useConfigTienda.js";

const clase = "text-plum-soft transition hover:text-berry";

// Íconos de redes de las páginas de acceso (Login, Registro, etc.).
// Los enlaces salen de Configuración de la tienda; si un dato está vacío,
// ese ícono no se muestra (así no quedan enlaces muertos con href="#").
export default function RedesAuth() {
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
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={clase}>
          <IconWhatsApp />
        </a>
      )}
    </>
  );
}
