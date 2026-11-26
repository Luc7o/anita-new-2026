"use client";

import { useEffect, useState } from "react";
import { pedir } from "@/lib/api";

// Delivery solo en Huancayo: departamento y provincia fijos (no se muestran), el cliente
// elige el distrito.
// Se buscan por nombre (no por id);
// el backend vuelve a validar la zona al crear el pedido.
type Lugar = { id: number; nombre: string };
export type Ubicacion = { envio_dpto: string; envio_provincia: string; envio_distrito: string; distrito_id: number | null };

const normalizar = (t: string) => (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase();

export function UbicacionEntrega({ onChange }: { onChange: (u: Ubicacion) => void }) {
  const [dep, setDep] = useState<Lugar | null>(null);
  const [prov, setProv] = useState<Lugar | null>(null);
  const [distritos, setDistritos] = useState<Lugar[]>([]);
  const [distritoId, setDistritoId] = useState("");
  const [errorCarga, setErrorCarga] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const deps = await pedir<Lugar[]>("/ubicaciones/departamentos?zona=huancayo");
        const d = deps.find((x) => normalizar(x.nombre) === "JUNIN");
        if (!d) throw new Error();
        const provs = await pedir<Lugar[]>(`/ubicaciones/provincias?departamento_id=${d.id}&zona=huancayo`);
        const p = provs.find((x) => normalizar(x.nombre) === "HUANCAYO");
        if (!p) throw new Error();
        const lista = await pedir<Lugar[]>(`/ubicaciones/distritos?provincia_id=${p.id}&zona=huancayo`);
        if (!activo) return;
        setDep(d);
        setProv(p);
        setDistritos(lista);
        onChange({ envio_dpto: d.nombre, envio_provincia: p.nombre, envio_distrito: "", distrito_id: null });
      } catch {
        if (activo) setErrorCarga(true);
      }
    })();
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Departamento y provincia son fijos (Junín, Huancayo): solo se elige el distrito.
  return (
    <div>
      <label htmlFor="chk-distrito" className="mb-1 block text-xs font-semibold">Distrito <span className="font-normal text-plum-soft">(solo Huancayo)</span></label>
      <select
        id="chk-distrito"
        required
        disabled={!distritos.length}
        value={distritoId}
        onChange={(e) => {
          const id = e.target.value;
          setDistritoId(id);
          const elegido = distritos.find((x) => String(x.id) === id);
          onChange({
            envio_dpto: dep?.nombre ?? "",
            envio_provincia: prov?.nombre ?? "",
            envio_distrito: elegido?.nombre ?? "",
            distrito_id: id ? Number(id) : null,
          });
        }}
        className="campo-texto disabled:opacity-60"
      >
        <option value="">{distritos.length ? "Elige tu distrito" : "Cargando..."}</option>
        {distritos.map((x) => (
          <option key={x.id} value={x.id}>{x.nombre}</option>
        ))}
      </select>
      {errorCarga && <p className="mt-1 text-xs text-berry-dark">No pudimos cargar los distritos. Recarga la página e inténtalo de nuevo.</p>}
    </div>
  );
}
