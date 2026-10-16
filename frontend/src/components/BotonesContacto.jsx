import React from "react";
import { Link } from "react-router-dom";
import { IconWhatsApp, IconMail } from "./Icons.jsx";
import useConfigTienda, { linkWhatsApp } from "../hooks/useConfigTienda.js";

const principal = "flex flex-1 items-center justify-center gap-2 rounded-2xl bg-berry px-5 py-3 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark";
const secundario = "flex flex-1 items-center justify-center gap-2 rounded-2xl border border-plum/15 bg-white/70 px-5 py-3 text-sm font-medium text-plum shadow-glass transition hover:bg-white";

// Botones de contacto que leen WhatsApp y correo de Configuración de la tienda.
// Si falta un dato, ese botón no se muestra; si faltan los dos, lleva a /contacto.
export default function BotonesContacto({ mensaje, asunto }) {
  const c = useConfigTienda();
  const base = linkWhatsApp(c.whatsapp);
  const wa = base ? `${base}?text=${encodeURIComponent(mensaje || "")}` : null;
  const mailto = c.correo_contacto
    ? `mailto:${c.correo_contacto}${asunto ? `?subject=${encodeURIComponent(asunto)}` : ""}`
    : null;
  if (!wa && !mailto) return <Link to="/contacto" className={principal}>Ir a Contacto</Link>;
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={principal}><IconWhatsApp size={18} />Escribir por WhatsApp</a>}
      {mailto && <a href={mailto} className={wa ? secundario : principal}><IconMail size={18} />Enviar correo</a>}
    </div>
  );
}
