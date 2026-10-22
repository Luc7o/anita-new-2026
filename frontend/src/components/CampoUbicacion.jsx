import React from "react";
import { claseSelect } from "../estilos.js";

// Un select de la cascada departamento -> provincia -> distrito.
// `opciones` es una lista de { id, nombre }; la etiqueta queda oculta (solo para lectores
// de pantalla) y también se usa como texto de la opción vacía.
export default function CampoUbicacion({ id, etiqueta, valor, onChange, opciones, disabled = false }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{etiqueta}</label>
      <select id={id} required disabled={disabled} value={valor} onChange={onChange} className={claseSelect}>
        <option value="">{etiqueta}</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>{o.nombre}</option>
        ))}
      </select>
    </div>
  );
}
