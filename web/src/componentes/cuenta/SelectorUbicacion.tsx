"use client";

import { useEffect, useState } from "react";
import { pedir } from "@/lib/api";

// Departamento -> provincia -> distrito (catálogo de /ubicaciones, zona Huancayo, igual
// que la SPA). Solo se guarda el distrito: onChange manda ese id hacia arriba.
type Opcion = { id: number; nombre: string };
type Id = number | string | null | undefined;

const consultar = (ruta: string) => pedir<Opcion[]>(ruta).catch(() => [] as Opcion[]);

function Campo({ id, etiqueta, valor, onChange, opciones, disabled = false }: {
  id: string;
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: Opcion[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{etiqueta}</label>
      <select
        id={id}
        required
        disabled={disabled}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="campo-texto disabled:opacity-60"
      >
        <option value="">{etiqueta}</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>{o.nombre}</option>
        ))}
      </select>
    </div>
  );
}

export function SelectorUbicacion({ departamentoId, provinciaId, distritoId, onChange }: {
  departamentoId: Id;
  provinciaId: Id;
  distritoId: Id;
  onChange: (distritoId: string) => void;
}) {
  const [departamentos, setDepartamentos] = useState<Opcion[]>([]);
  const [provincias, setProvincias] = useState<Opcion[]>([]);
  const [distritos, setDistritos] = useState<Opcion[]>([]);
  const [dep, setDep] = useState(String(departamentoId ?? ""));
  const [prov, setProv] = useState(String(provinciaId ?? ""));
  const [dist, setDist] = useState(String(distritoId ?? ""));

  // Carga inicial; con valores guardados se precargan también provincias y distritos.
  useEffect(() => {
    consultar("/ubicaciones/departamentos?zona=huancayo").then(setDepartamentos);
    if (departamentoId) consultar(`/ubicaciones/provincias?departamento_id=${departamentoId}&zona=huancayo`).then(setProvincias);
    if (provinciaId) consultar(`/ubicaciones/distritos?provincia_id=${provinciaId}&zona=huancayo`).then(setDistritos);
    // Solo al montar: los valores iniciales no cambian mientras se edita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elegirDepartamento = (v: string) => {
    setDep(v);
    setProv("");
    setDist("");
    setDistritos([]);
    setProvincias([]);
    onChange("");
    if (v) consultar(`/ubicaciones/provincias?departamento_id=${v}&zona=huancayo`).then(setProvincias);
  };

  const elegirProvincia = (v: string) => {
    setProv(v);
    setDist("");
    setDistritos([]);
    onChange("");
    if (v) consultar(`/ubicaciones/distritos?provincia_id=${v}&zona=huancayo`).then(setDistritos);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <Campo id="ubic-departamento" etiqueta="Departamento" valor={dep} onChange={elegirDepartamento} opciones={departamentos} />
      <Campo id="ubic-provincia" etiqueta="Provincia" valor={prov} onChange={elegirProvincia} opciones={provincias} disabled={!dep} />
      <Campo
        id="ubic-distrito"
        etiqueta="Distrito"
        valor={dist}
        onChange={(v) => {
          setDist(v);
          onChange(v);
        }}
        opciones={distritos}
        disabled={!prov}
      />
    </div>
  );
}
