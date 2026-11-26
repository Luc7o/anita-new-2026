"use client";

import { useEffect, useState } from "react";
import { pedir } from "@/lib/api";
import { soloNumeros, soloTexto } from "@/lib/validacion";
import { Girando } from "@/componentes/acceso/Girando";
import { useSesion, type UsuarioCuenta } from "@/componentes/cuenta/Sesion";
import { SelectorUbicacion } from "@/componentes/cuenta/SelectorUbicacion";
import { FormularioContrasena } from "@/componentes/cuenta/FormularioContrasena";

// Perfil: quién eres arriba, tus datos en una lista y un solo «Editar datos» que convierte
// esa misma lista en campos (sin un formulario aparte). La contraseña queda plegada hasta
// que se toca «Cambiar».

type Perfil = UsuarioCuenta & {
  direccion?: string | null;
  referencia?: string | null;
  distrito?: string | null;
  distrito_id?: number | null;
  provincia_id?: number | null;
  departamento_id?: number | null;
};

/** Una fila de la lista de datos: etiqueta a la izquierda, valor (o campo) a la derecha. Con
 *  campos abiertos la etiqueta se alinea con el primero. */
function Fila({ etiqueta, campos = false, children }: { etiqueta: React.ReactNode; campos?: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid gap-1 border-b border-plum/10 py-3.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6 ${campos ? "sm:items-start" : "sm:items-center"}`}>
      <dt className={`text-xs font-bold uppercase tracking-[0.12em] text-plum-soft ${campos ? "sm:pt-3.5" : ""}`}>{etiqueta}</dt>
      <dd className="min-w-0 text-[15px] text-plum">{children}</dd>
    </div>
  );
}

const vacio = <span className="text-plum-soft">Sin registrar</span>;

export function VistaPerfil() {
  const { usuario, setUsuario, avisar } = useSesion();
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", direccion: "", distrito_id: "", referencia: "" });
  const [guardado, setGuardado] = useState(form); // lo que está guardado (para «Cancelar»)
  // Ids iniciales solo para precargar los 3 selects en cascada.
  const [ubicacion, setUbicacion] = useState<{ dep: number | null; prov: number | null; dist: number | null } | null>(null);
  const [editando, setEditando] = useState(false);
  const [cambiandoClave, setCambiandoClave] = useState(false);
  const [tienePassword, setTienePassword] = useState<boolean | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    pedir<Perfil>("/auth/perfil", { auth: true })
      .then((d) => {
        const datos = {
          nombre: d.nombre || "",
          apellido: d.apellido || "",
          telefono: d.telefono || "",
          direccion: d.direccion || "",
          distrito_id: d.distrito_id ? String(d.distrito_id) : "",
          referencia: d.referencia || "",
        };
        setForm(datos);
        setGuardado(datos);
        setUbicacion({ dep: d.departamento_id ?? null, prov: d.provincia_id ?? null, dist: d.distrito_id ?? null });
      })
      .catch(() => setUbicacion({ dep: null, prov: null, dist: null })); // sin datos la lista queda vacía
    pedir<{ requiere_password: boolean }>("/auth/preferencias", { auth: true })
      .then((e) => setTienePassword(e.requiere_password))
      .catch(() => setTienePassword(true));
  }, []);

  const cambiar = (campo: keyof typeof form, filtro?: (v: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: filtro ? filtro(e.target.value) : e.target.value }));

  const cancelar = () => {
    setForm(guardado);
    setError("");
    setEditando(false);
  };

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
      setGuardado(form);
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
  const direccion = [guardado.direccion, guardado.referencia && `(${guardado.referencia})`].filter(Boolean).join(" ");

  return (
    <div className="space-y-10">
      <header className="flex items-center gap-4">
        <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-plum font-display text-2xl font-bold text-ivory">
          {inicial}
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-display text-3xl text-plum">{nombreCompleto || "Tu perfil"}</h2>
          <p className="truncate text-sm text-plum-soft">{usuario.email}</p>
        </div>
      </header>

      <section aria-labelledby="perfil-datos">
        <form onSubmit={guardar} className="compacto">
          <div className="flex items-center justify-between gap-4 border-b border-plum pb-2">
            <h2 id="perfil-datos" className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-plum">Datos personales</h2>
            {!editando && (
              <button type="button" onClick={() => setEditando(true)} className="text-sm font-semibold text-plum underline underline-offset-4 hover:text-berry">
                Editar datos
              </button>
            )}
          </div>

          <dl>
            <Fila campos={editando} etiqueta={editando ? <label htmlFor="perfil-nombre">Nombre</label> : "Nombre"}>
              {editando ? (
                <div className="grid grid-cols-2 gap-3">
                  <input id="perfil-nombre" placeholder="Nombre" required maxLength={80} autoComplete="given-name" value={form.nombre} onChange={cambiar("nombre", soloTexto)} className="campo-texto" />
                  <div>
                    <label htmlFor="perfil-apellido" className="sr-only">Apellido</label>
                    <input id="perfil-apellido" placeholder="Apellido" required maxLength={80} autoComplete="family-name" value={form.apellido} onChange={cambiar("apellido", soloTexto)} className="campo-texto" />
                  </div>
                </div>
              ) : (
                nombreCompleto || vacio
              )}
            </Fila>

            <Fila campos={editando} etiqueta={editando ? <label htmlFor="perfil-telefono">Teléfono</label> : "Teléfono"}>
              {editando ? (
                <input id="perfil-telefono" placeholder="9 dígitos" required inputMode="numeric" maxLength={9} autoComplete="tel-national" value={form.telefono} onChange={cambiar("telefono", (v) => soloNumeros(v))} className="campo-texto" />
              ) : (
                usuario.telefono || vacio
              )}
            </Fila>

            <Fila campos={editando} etiqueta={editando ? <label htmlFor="perfil-direccion">Dirección</label> : "Dirección de envío"}>
              {editando ? (
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input id="perfil-direccion" placeholder="Calle, número, piso" required maxLength={200} autoComplete="street-address" value={form.direccion} onChange={cambiar("direccion")} className="campo-texto" />
                    <div>
                      <label htmlFor="perfil-referencia" className="sr-only">Referencia</label>
                      <input id="perfil-referencia" placeholder="Referencia (ej. frente al parque)" required maxLength={200} value={form.referencia} onChange={cambiar("referencia")} className="campo-texto" />
                    </div>
                  </div>
                  {ubicacion && (
                    <SelectorUbicacion
                      departamentoId={ubicacion.dep}
                      provinciaId={ubicacion.prov}
                      distritoId={ubicacion.dist}
                      onChange={(id) => setForm((f) => ({ ...f, distrito_id: id }))}
                    />
                  )}
                </div>
              ) : (
                <span className="block truncate">{direccion || vacio}</span>
              )}
            </Fila>

            <Fila etiqueta="Correo">
              <span className="block truncate">{usuario.email}</span>
              {editando && <span className="mt-0.5 block text-xs text-plum-soft">El correo no se puede cambiar desde aquí.</span>}
            </Fila>
          </dl>

          {editando && (
            <div className="mt-5 space-y-3">
              {error && <p className="text-sm text-berry-dark" role="alert">{error}</p>}
              <div className="flex items-center gap-4">
                <button type="submit" disabled={guardando} className="btn-primary min-h-11! px-6 disabled:opacity-60">
                  {guardando ? <><Girando />Guardando...</> : "Guardar datos"}
                </button>
                <button type="button" onClick={cancelar} className="text-sm font-semibold text-plum-soft hover:text-plum">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </form>
      </section>

      <section aria-labelledby="perfil-seguridad">
        <div className="border-b border-plum pb-2">
          <h2 id="perfil-seguridad" className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-plum">Seguridad</h2>
        </div>
        {tienePassword === false ? (
          <p className="py-3.5 text-sm text-plum-soft">
            Tu cuenta no tiene contraseña: entras con Google o con un enlace enviado a tu correo. Si quieres usar
            contraseña, cierra sesión y usa «¿Olvidaste tu contraseña?» en la pantalla de ingreso.
          </p>
        ) : tienePassword ? (
          <dl>
            <Fila campos={cambiandoClave} etiqueta="Contraseña">
              {cambiandoClave ? (
                <FormularioContrasena onListo={() => setCambiandoClave(false)} onCancelar={() => setCambiandoClave(false)} />
              ) : (
                <span className="flex items-center justify-between gap-4">
                  <span aria-label="Contraseña guardada" className="tracking-[0.2em]">••••••••</span>
                  <button type="button" onClick={() => setCambiandoClave(true)} className="text-sm font-semibold text-plum underline underline-offset-4 hover:text-berry">
                    Cambiar
                  </button>
                </span>
              )}
            </Fila>
          </dl>
        ) : null}
      </section>
    </div>
  );
}
