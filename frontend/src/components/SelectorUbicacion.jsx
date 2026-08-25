import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";

const claseSelect =
  "w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none disabled:opacity-50";

// Selector de dirección en cascada: departamento -> provincia -> distrito,
// contra el catálogo normalizado (GET /api/ubicaciones/*). Lo único que
// realmente se guarda es distrito_id (el departamento y la provincia se
// obtienen después por join, ver migración 022) — por eso onChange solo
// manda ese id hacia arriba, aunque el componente sí necesita manejar los
// 3 niveles para armar los selects.
//
// Props:
//   departamentoId, provinciaId, distritoId: valores iniciales (para
//     precargar el formulario en modo edición, ej. Perfil ya guardado)
//   onChange(distritoId): se llama cuando el distrito elegido cambia
export default function SelectorUbicacion({ departamentoId, provinciaId, distritoId, onChange }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

  const [depSeleccionado, setDepSeleccionado] = useState(departamentoId || "");
  const [provSeleccionada, setProvSeleccionada] = useState(provinciaId || "");
  const [distSeleccionado, setDistSeleccionado] = useState(distritoId || "");

  // Carga inicial de departamentos, una sola vez.
  useEffect(() => {
    api.departamentos().then(setDepartamentos).catch(() => setDepartamentos([]));
  }, []);

  // Si vienen valores iniciales (editar un perfil ya guardado), precarga
  // también provincias y distritos para que los 3 selects abran con el
  // valor correcto en vez de vacíos.
  useEffect(() => {
    if (departamentoId) {
      api.provincias(departamentoId).then(setProvincias).catch(() => setProvincias([]));
    }
    if (provinciaId) {
      api.distritos(provinciaId).then(setDistritos).catch(() => setDistritos([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elegirDepartamento = (e) => {
    const nuevoId = e.target.value;
    setDepSeleccionado(nuevoId);
    setProvSeleccionada("");
    setDistSeleccionado("");
    setDistritos([]);
    onChange?.("");

    if (!nuevoId) {
      setProvincias([]);
      return;
    }
    api.provincias(nuevoId).then(setProvincias).catch(() => setProvincias([]));
  };

  const elegirProvincia = (e) => {
    const nuevoId = e.target.value;
    setProvSeleccionada(nuevoId);
    setDistSeleccionado("");
    onChange?.("");

    if (!nuevoId) {
      setDistritos([]);
      return;
    }
    api.distritos(nuevoId).then(setDistritos).catch(() => setDistritos([]));
  };

  const elegirDistrito = (e) => {
    const nuevoId = e.target.value;
    setDistSeleccionado(nuevoId);
    onChange?.(nuevoId);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label htmlFor="ubic-departamento" className="sr-only">Departamento</label>
        <select
          id="ubic-departamento"
          required
          value={depSeleccionado}
          onChange={elegirDepartamento}
          className={claseSelect}
        >
          <option value="">Departamento</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ubic-provincia" className="sr-only">Provincia</label>
        <select
          id="ubic-provincia"
          required
          disabled={!depSeleccionado}
          value={provSeleccionada}
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
        <label htmlFor="ubic-distrito" className="sr-only">Distrito</label>
        <select
          id="ubic-distrito"
          required
          disabled={!provSeleccionada}
          value={distSeleccionado}
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
  );
}
