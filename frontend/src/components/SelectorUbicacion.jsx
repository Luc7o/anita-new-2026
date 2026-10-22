import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import CampoUbicacion from "./CampoUbicacion.jsx";

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
      <CampoUbicacion
        id="ubic-departamento"
        etiqueta="Departamento"
        valor={depSeleccionado}
        onChange={elegirDepartamento}
        opciones={departamentos}
      />
      <CampoUbicacion
        id="ubic-provincia"
        etiqueta="Provincia"
        valor={provSeleccionada}
        onChange={elegirProvincia}
        opciones={provincias}
        disabled={!depSeleccionado}
      />
      <CampoUbicacion
        id="ubic-distrito"
        etiqueta="Distrito"
        valor={distSeleccionado}
        onChange={elegirDistrito}
        opciones={distritos}
        disabled={!provSeleccionada}
      />
    </div>
  );
}
