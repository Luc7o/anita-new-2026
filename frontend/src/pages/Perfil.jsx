import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import CuentaLayout from "../components/CuentaLayout.jsx";
import { soloTexto, soloNumeros } from "../validacion.js";

export default function Perfil() {
  const { usuario, setUsuario } = useAuth();
  const [form, setForm] = useState({
    nombre: "", apellido: "", telefono: "",
    direccion: "", distrito: "", provincia: "", departamento: "", referencia: "",
  });
  const [editando, setEditando] = useState(false);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [mensajeDatos, setMensajeDatos] = useState("");
  const [errorDatos, setErrorDatos] = useState("");

  useEffect(() => {
    api.perfil().then((data) => {
      setForm({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        telefono: data.telefono || "",
        direccion: data.direccion || "",
        distrito: data.distrito || "",
        provincia: data.provincia || "",
        departamento: data.departamento || "",
        referencia: data.referencia || "",
      });
    });
  }, []);

  const actualizarCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const actualizarTexto = (campo) => (e) => setForm({ ...form, [campo]: soloTexto(e.target.value) });
  const actualizarTelefono = (e) => setForm({ ...form, telefono: soloNumeros(e.target.value) });

  const guardarDatos = async (e) => {
    e.preventDefault();
    setErrorDatos("");
    setMensajeDatos("");
    setGuardandoDatos(true);
    try {
      const actualizado = await api.actualizarPerfil(form);
      setUsuario(actualizado);
      setMensajeDatos("Tus datos se guardaron correctamente.");
      setEditando(false);
    } catch (err) {
      setErrorDatos(err.message);
    } finally {
      setGuardandoDatos(false);
    }
  };

  if (!usuario) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-plum-soft">
        Ingresa para ver tu perfil.
        <div className="mt-4">
          <Link to="/ingresar" className="font-semibold text-berry-dark hover:underline">
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const nombreCompleto = usuario.nombre_completo || `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();
  const inicial = (usuario.nombre || usuario.email || "?").slice(0, 1).toUpperCase();

  return (
    <CuentaLayout>
      <div className="space-y-6">
        {/* Tarjeta resumen */}
        <div className="glass rounded-3xl p-6 shadow-glass sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-berry text-2xl font-semibold text-white">
              {inicial}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-plum">
                {nombreCompleto || "Sin nombre registrado"}
              </h2>
              <p className="text-sm text-plum-soft">{usuario.email}</p>
            </div>
          </div>

          {/* Información general (resumen de solo lectura) */}
          <div className="mt-6 grid gap-4 border-t border-plum/10 pt-6 sm:grid-cols-2">
            <CampoResumen etiqueta="Nombre completo" valor={nombreCompleto || "—"} onEditar={() => setEditando(true)} />
            <CampoResumen etiqueta="Teléfono celular" valor={usuario.telefono || "—"} onEditar={() => setEditando(true)} />
            <CampoResumen etiqueta="Dirección de envío principal" valor={form.direccion || "—"} onEditar={() => setEditando(true)} />
            <CampoResumen etiqueta="Correo electrónico" valor={usuario.email} onEditar={() => setEditando(true)} />
          </div>
        </div>

        {/* Datos personales: oculto hasta que se presiona "Editar" */}
        {editando && (
          <form
            onSubmit={guardarDatos}
            className="glass space-y-4 rounded-3xl p-6 shadow-glass sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-plum">Editar datos personales</h2>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="text-sm font-medium text-plum-soft hover:text-berry"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="perfil-nombre" className="sr-only">Nombre</label>
                <input
                  id="perfil-nombre"
                  placeholder="Nombre"
                  required
                  maxLength={80}
                  value={form.nombre}
                  onChange={actualizarTexto("nombre")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="perfil-apellido" className="sr-only">Apellido</label>
                <input
                  id="perfil-apellido"
                  placeholder="Apellido"
                  required
                  maxLength={80}
                  value={form.apellido}
                  onChange={actualizarTexto("apellido")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="perfil-telefono" className="sr-only">Teléfono</label>
              <input
                id="perfil-telefono"
                placeholder="Teléfono"
                required
                inputMode="numeric"
                maxLength={9}
                value={form.telefono}
                onChange={actualizarTelefono}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="perfil-direccion" className="sr-only">Dirección</label>
              <input
                id="perfil-direccion"
                placeholder="Dirección"
                required
                maxLength={200}
                value={form.direccion}
                onChange={actualizarCampo("direccion")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="perfil-distrito" className="sr-only">Distrito</label>
                <input
                  id="perfil-distrito"
                  placeholder="Distrito"
                  required
                  maxLength={100}
                  value={form.distrito}
                  onChange={actualizarTexto("distrito")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="perfil-provincia" className="sr-only">Provincia</label>
                <input
                  id="perfil-provincia"
                  placeholder="Provincia"
                  required
                  maxLength={100}
                  value={form.provincia}
                  onChange={actualizarTexto("provincia")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="perfil-departamento" className="sr-only">Departamento</label>
                <input
                  id="perfil-departamento"
                  placeholder="Departamento"
                  required
                  maxLength={100}
                  value={form.departamento}
                  onChange={actualizarTexto("departamento")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="perfil-referencia" className="sr-only">Referencia</label>
              <input
                id="perfil-referencia"
                placeholder="Referencia"
                required
                maxLength={200}
                value={form.referencia}
                onChange={actualizarCampo("referencia")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
            </div>

            <div aria-live="polite">
              {errorDatos && <p className="text-sm text-berry-dark" role="alert">{errorDatos}</p>}
              {mensajeDatos && <p className="text-sm text-berry-dark">{mensajeDatos}</p>}
            </div>

            <button
              type="submit"
              disabled={guardandoDatos}
              className="rounded-full bg-berry px-6 py-2.5 font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
            >
              {guardandoDatos ? "Guardando..." : "Guardar datos"}
            </button>
          </form>
        )}
      </div>
    </CuentaLayout>
  );
}

function CampoResumen({ etiqueta, valor, onEditar }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-plum-soft">{etiqueta}</p>
        <p className="truncate text-sm font-medium text-plum">{valor}</p>
      </div>
      <button
        type="button"
        onClick={onEditar}
        className="shrink-0 text-xs font-semibold text-berry-dark hover:underline"
      >
        Editar
      </button>
    </div>
  );
}
