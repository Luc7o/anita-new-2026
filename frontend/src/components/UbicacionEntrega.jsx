import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { claseSelect } from "../estilos.js";
import CampoUbicacion from "./CampoUbicacion.jsx";

// Departamento al que por ahora se despacha. Se busca por nombre en el
// catálogo (GET /api/ubicaciones/departamentos) en vez de fijar un id, así
// no depende de cómo quedó numerada la tabla en cada base de datos.
const DEPARTAMENTO_FIJO = "JUNIN";

// Selects de entrega para el checkout: departamento fijo (Junín), provincia
// y distrito en cascada contra el catálogo normalizado.
//
// onChange({ envio_dpto, envio_provincia, envio_distrito, distrito_id })
// se llama cada vez que cambia algo; el distrito y su id quedan vacíos
// hasta que el usuario elige uno.
export default function UbicacionEntrega({ onChange }) {
  const [departamento, setDepartamento] = useState(null);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [provinciaId, setProvinciaId] = useState("");
  const [distritoId, setDistritoId] = useState("");
  const [errorCarga, setErrorCarga] = useState(false);

  const nombreDe = (lista, id) => lista.find((x) => String(x.id) === String(id))?.nombre || "";

  const avisar = (dep, provId, provLista, distId, distLista) =>
    onChange?.({
      envio_dpto: dep?.nombre || "",
      envio_provincia: nombreDe(provLista, provId),
      envio_distrito: nombreDe(distLista, distId),
      distrito_id: distId ? Number(distId) : null,
    });

  // Departamento fijo + sus provincias, una sola vez.
  useEffect(() => {
    let activo = true;
    api
      .departamentos()
      .then((lista) => {
        const dep = lista.find((d) => d.nombre === DEPARTAMENTO_FIJO);
        if (!dep) throw new Error("Departamento no encontrado");
        if (!activo) return null;
        setDepartamento(dep);
        onChange?.({ envio_dpto: dep.nombre, envio_provincia: "", envio_distrito: "", distrito_id: null });
        return api.provincias(dep.id);
      })
      .then((provs) => activo && provs && setProvincias(provs))
      .catch(() => activo && setErrorCarga(true));
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elegirProvincia = (e) => {
    const id = e.target.value;
    setProvinciaId(id);
    setDistritoId("");
    setDistritos([]);
    avisar(departamento, id, provincias, "", []);
    if (id) api.distritos(id).then(setDistritos).catch(() => setDistritos([]));
  };

  const elegirDistrito = (e) => {
    const id = e.target.value;
    setDistritoId(id);
    avisar(departamento, provinciaId, provincias, id, distritos);
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
        <CampoUbicacion
          id="chk-provincia"
          etiqueta="Provincia"
          valor={provinciaId}
          onChange={elegirProvincia}
          opciones={provincias}
          disabled={!provincias.length}
        />
        <CampoUbicacion
          id="chk-distrito"
          etiqueta="Distrito"
          valor={distritoId}
          onChange={elegirDistrito}
          opciones={distritos}
          disabled={!provinciaId}
        />
      </div>
      {errorCarga && (
        <p className="mt-1 text-xs text-berry-dark">
          No pudimos cargar las ubicaciones. Recarga la página e inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}
