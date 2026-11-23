"use client";

import { useEffect, useState } from "react";
import { pedir } from "@/lib/api";
import { soloNumeros, soloTexto } from "@/lib/validacion";
import { Girando } from "@/componentes/acceso/Girando";
import { useSesion, type UsuarioCuenta } from "@/componentes/cuenta/Sesion";
import { SelectorUbicacion } from "@/componentes/cuenta/SelectorUbicacion";
import { FormularioContrasena } from "@/componentes/cuenta/FormularioContrasena";

type Perfil = UsuarioCuenta & {
  direccion?: string | null;
  referencia?: string | null;
  distrito_id?: number | null;
  provincia_id?: number | null;
  departamento_id?: number | null;
};

const claseCampo = "w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-hidden";

function CampoResumen({ etiqueta, valor, onEditar }: { etiqueta: string; valor: string; onEditar: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-plum-soft">{etiqueta}</p>
        <p className="truncate text-sm font-medium text-plum">{valor}</p>
      </div>
      <button type="button" onClick={onEditar} className="shrink-0 text-xs font-semibold text-berry-dark hover:underline">
        Editar
      </button>
    </div>
  );
}

export function VistaPerfil() {
  const { usuario, setUsuario, avisar } = useSesion();
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", direccion: "", distrito_id: "", referencia: "" });
  // Ids iniciales solo para precargar los 3 selects en cascada.
  const [ubicacion, setUbicacion] = useState<{ dep: number | null; prov: number | null; dist: number | null } | null>(null);
  const [editando, setEditando] = useState(false);
  const [tienePassword, setTienePassword] = useState<boolean | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    pedir<Perfil>("/auth/perfil", { auth: true })
      .then((d) => {
        setForm({
          nombre: d.nombre || "",
          apellido: d.apellido || "",
          telefono: d.telefono || "",
          direccion: d.direccion || "",
          distrito_id: d.distrito_id ? String(d.distrito_id) : "",
          referencia: d.referencia || "",
        });
        setUbicacion({ dep: d.departamento_id ?? null, prov: d.provincia_id ?? null, dist: d.distrito_id ?? null });
      })
      .catch(() => setUbicacion({ dep: null, prov: null, dist: null })); // sin datos el formulario queda vacío
    pedir<{ requiere_password: boolean }>("/auth/preferencias", { auth: true })
      .then((e) => setTienePassword(e.requiere_password))
      .catch(() => setTienePassword(true));
  }, []);

  const cambiar = (campo: keyof typeof form, filtro?: (v: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: filtro ? filtro(e.target.value) : e.target.value }));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const actualizado = await pedir<UsuarioCuenta>("/auth/perfil", {
        method: "PUT",
        body: { ...form, distrito_id: form.distrito_id || null },
        auth: true,
      });
      setUsuario(actualizado);
      avisar("success", "Tus datos se guardaron correctamente");
      setEditando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar tus datos");
    } finally {
      setGuardando(false);
    }
  };

  const nombreCompleto = usuario.nombre_completo || `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();
  const inicial = (usuario.nombre || usuario.email || "?").slice(0, 1).toUpperCase();
  const editar = () => setEditando(true);

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 shadow-glass sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-berry text-2xl font-semibold text-white" aria-hidden="true">
            {inicial}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-plum">{nombreCompleto || "Sin nombre registrado"}</h2>
            <p className="truncate text-sm text-plum-soft">{usuario.email}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-plum/10 pt-6 sm:grid-cols-2">
          <CampoResumen etiqueta="Nombre completo" valor={nombreCompleto || "—"} onEditar={editar} />
          <CampoResumen etiqueta="Teléfono celular" valor={usuario.telefono || "—"} onEditar={editar} />
          <CampoResumen etiqueta="Dirección de envío principal" valor={form.direccion || "—"} onEditar={editar} />
          <CampoResumen etiqueta="Correo electrónico" valor={usuario.email} onEditar={editar} />
        </div>
      </div>

      {editando && (
        <form onSubmit={guardar} className="glass space-y-4 rounded-3xl p-6 shadow-glass sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-plum">Editar datos personales</h2>
            <button type="button" onClick={() => setEditando(false)} className="text-sm font-medium text-plum-soft hover:text-berry">
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="perfil-nombre" className="sr-only">Nombre</label>
              <input id="perfil-nombre" placeholder="Nombre" required maxLength={80} autoComplete="given-name" value={form.nombre} onChange={cambiar("nombre", soloTexto)} className={claseCampo} />
            </div>
            <div>
              <label htmlFor="perfil-apellido" className="sr-only">Apellido</label>
              <input id="perfil-apellido" placeholder="Apellido" required maxLength={80} autoComplete="family-name" value={form.apellido} onChange={cambiar("apellido", soloTexto)} className={claseCampo} />
            </div>
          </div>
          <div>
            <label htmlFor="perfil-telefono" className="sr-only">Teléfono</label>
            <input id="perfil-telefono" placeholder="Teléfono" required inputMode="numeric" maxLength={9} autoComplete="tel-national" value={form.telefono} onChange={cambiar("telefono", (v) => soloNumeros(v))} className={claseCampo} />
          </div>
          <div>
            <label htmlFor="perfil-direccion" className="sr-only">Dirección</label>
            <input id="perfil-direccion" placeholder="Dirección" required maxLength={200} autoComplete="street-address" value={form.direccion} onChange={cambiar("direccion")} className={claseCampo} />
          </div>
          {ubicacion && (
            <SelectorUbicacion
              departamentoId={ubicacion.dep}
              provinciaId={ubicacion.prov}
              distritoId={ubicacion.dist}
              onChange={(id) => setForm((f) => ({ ...f, distrito_id: id }))}
            />
          )}
          <div>
            <label htmlFor="perfil-referencia" className="sr-only">Referencia</label>
            <input id="perfil-referencia" placeholder="Referencia" required maxLength={200} value={form.referencia} onChange={cambiar("referencia")} className={claseCampo} />
          </div>

          {error && <p className="text-sm text-berry-dark" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-full bg-berry px-6 py-2.5 font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
          >
            {guardando ? <><Girando />Guardando...</> : "Guardar datos"}
          </button>
        </form>
      )}

      <section aria-labelledby="perfil-seguridad">
        <h2 id="perfil-seguridad" className="mb-1 text-lg font-semibold text-plum">Seguridad</h2>
        {tienePassword === false ? (
          <p className="glass mt-3 rounded-2xl p-5 text-sm text-plum-soft shadow-glass">
            Tu cuenta no tiene contraseña: entras con Google o con un enlace enviado a tu correo. Si quieres usar
            contraseña, cierra sesión y usa «¿Olvidaste tu contraseña?» en la pantalla de ingreso.
          </p>
        ) : tienePassword ? (
          <FormularioContrasena />
        ) : null}
      </section>
    </div>
  );
}
