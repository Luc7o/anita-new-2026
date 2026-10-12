import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";

const claseSelect =
  "w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none disabled:opacity-60";

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
        <div>
          <label htmlFor="chk-provincia" className="sr-only">Provincia</label>
          <select
            id="chk-provincia"
            required
            disabled={!provincias.length}
            value={provinciaId}
            onChange={elegirProvincia}
            className={claseSelect}
          >
            <option value="">Provincia</option>
            {provincias.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="chk-distrito" className="sr-only">Distrito</label>
          <select
            id="chk-distrito"
            required
            disabled={!provinciaId}
            value={distritoId}
            onChange={elegirDistrito}
            className={claseSelect}
          >
            <option value="">Distrito</option>
            {distritos.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>
      </div>
      {errorCarga && (
        <p className="mt-1 text-xs text-berry-dark">
          No pudimos cargar las ubicaciones. Recarga la página e inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}
