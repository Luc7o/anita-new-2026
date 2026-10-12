import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Identifica a quién pertenece la tienda (razón social, RUC y domicilio). Los
// datos salen de las variables PROVEEDOR_* del backend, las mismas que
// aparecen en la hoja del Libro de Reclamaciones, así hay una sola fuente.
export default function DatosProveedor() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    api.reclamacionesInfo().then(setInfo).catch(() => setInfo(null));
  }, []);

  if (!info || (!info.razon_social && !info.ruc)) {
    return <p><strong className="text-plum">Anita New Style</strong>, tienda de moda con sede en Huancayo, Perú.</p>;
  }
  return (
    <ul className="space-y-1">
      {info.razon_social && <li><strong className="text-plum">Razón social:</strong> {info.razon_social}</li>}
      {info.ruc && <li><strong className="text-plum">RUC:</strong> {info.ruc}</li>}
      {info.domicilio && <li><strong className="text-plum">Domicilio:</strong> {info.domicilio}</li>}
    </ul>
  );
}
