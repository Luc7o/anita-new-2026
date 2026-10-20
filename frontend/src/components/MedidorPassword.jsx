import React from "react";
import { evaluarPassword, NIVELES } from "../utils/passwordFuerza.js";
import { IconCheck } from "./Icons.jsx";

// Barra de seguridad de la contraseña + sugerencias de lo que le falta.
export default function MedidorPassword({ password, minimo = 6 }) {
  const { nivel, sugerencias } = evaluarPassword(password, minimo);
  const info = NIVELES[nivel];

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${n <= info.barras ? info.barra : "bg-plum/10"}`}
          />
        ))}
      </div>

      {nivel === 0 ? (
        <p className="mt-1.5 text-xs text-plum-soft">
          Usa al menos {minimo} caracteres. Combina mayúsculas, minúsculas, números y símbolos para que sea más segura.
        </p>
      ) : (
        <>
          <p className="mt-1.5 text-xs text-plum-soft">
            Seguridad: <strong className={info.texto}>{info.etiqueta}</strong>
          </p>
          {sugerencias.length > 0 ? (
            <ul className="mt-1 space-y-0.5 text-xs text-plum-soft">
              {sugerencias.map((texto) => (
                <li key={texto} className="flex gap-1.5">
                  <span aria-hidden="true">•</span>
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-green-700">
              <IconCheck size={12} /> ¡Excelente! Tu contraseña es segura.
            </p>
          )}
        </>
      )}
    </div>
  );
}
