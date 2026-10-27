import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { claseSelect } from "../estilos.js";
import CampoUbicacion from "./CampoUbicacion.jsx";

// Delivery solo en Huancayo (Junín). El backend ya solo ofrece esa zona en
// GET /api/ubicaciones/* y la vuelve a validar al crear el pedido
// (app/utils/zona_entrega.py); acá se buscan por nombre en vez de fijar ids,
// así no dependen de cómo quedó numerada la tabla en cada base de datos.
const DEPARTAMENTO_FIJO = "JUNIN";
const PROVINCIA_FIJA = "HUANCAYO";

const normalizar = (texto) =>
  (texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();

// Selects de entrega para el checkout: departamento y provincia fijos; el
// cliente elige únicamente el distrito.
//
// onChange({ envio_dpto, envio_provincia, envio_distrito, distrito_id })
// se llama cada vez que cambia algo; el distrito y su id quedan vacíos
// hasta que el usuario elige uno.
export default function UbicacionEntrega({ onChange }) {
  const [departamento, setDepartamento] = useState(null);
  const [provincia, setProvincia] = useState(null);
  const [distritos, setDistritos] = useState([]);
  const [distritoId, setDistritoId] = useState("");
  const [errorCarga, setErrorCarga] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const deps = await api.departamentos();
        const dep = deps.find((d) => normalizar(d.nombre) === DEPARTAMENTO_FIJO);
        if (!dep) throw new Error("Departamento no encontrado");
        const provs = await api.provincias(dep.id);
        const prov = provs.find((p) => normalizar(p.nombre) === PROVINCIA_FIJA);
        if (!prov) throw new Error("Provincia no encontrada");
        const lista = await api.distritos(prov.id);
        if (!activo) return;
        setDepartamento(dep);
        setProvincia(prov);
        setDistritos(lista);
        onChange?.({
          envio_dpto: dep.nombre,
          envio_provincia: prov.nombre,
          envio_distrito: "",
          distrito_id: null,
        });
      } catch {
        if (activo) setErrorCarga(true);
      }
    })();
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elegirDistrito = (e) => {
    const id = e.target.value;
    setDistritoId(id);
    const elegido = distritos.find((d) => String(d.id) === String(id));
    onChange?.({
      envio_dpto: departamento?.nombre || "",
      envio_provincia: provincia?.nombre || "",
      envio_distrito: elegido?.nombre || "",
      distrito_id: id ? Number(id) : null,
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="chk-dpto" className="sr-only">Departamento</label>
          <select id="chk-dpto" value={departamento?.id || ""} disabled className={claseSelect}>
            <option value={departamento?.id || ""}>{departamento ? "Junín" : "Cargando..."}</option>
          </select>
        </div>
        <div>
          <label htmlFor="chk-provincia" className="sr-only">Provincia</label>
          <select id="chk-provincia" value={provincia?.id || ""} disabled className={claseSelect}>
            <option value={provincia?.id || ""}>{provincia ? "Huancayo" : "Cargando..."}</option>
          </select>
        </div>
        <CampoUbicacion
          id="chk-distrito"
          etiqueta="Distrito"
          valor={distritoId}
          onChange={elegirDistrito}
          opciones={distritos}
          disabled={!distritos.length}
        />
      </div>
      <p className="mt-2 text-xs text-plum-soft">Delivery disponible solo en Huancayo.</p>
      {errorCarga && (
        <p className="mt-1 text-xs text-berry-dark">
          No pudimos cargar las ubicaciones. Recarga la página e inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}
