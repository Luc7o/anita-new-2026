import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconEye, IconEyeOff } from "../components/Icons.jsx";
import { soloTexto, soloNumeros, soloDni, soloRuc, soloCarnetExtranjeria } from "../validacion.js";
import { api } from "../api/client.js";

const ETIQUETAS_DOCUMENTO = { dni: "DNI", ruc: "RUC", ce: "Carné de Extranjería" };

export default function Registro() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "", apellido: "", email: "", password: "", password_confirmar: "", telefono: "",
    tipo_documento: "dni", numero_documento: "",
  });
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [validandoDoc, setValidandoDoc] = useState(false);
  const [docValidado, setDocValidado] = useState(false);
  const [mensajeDoc, setMensajeDoc] = useState("");

  const actualizar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const actualizarTexto = (campo) => (e) => setForm({ ...form, [campo]: soloTexto(e.target.value) });
  const actualizarTelefono = (e) => setForm({ ...form, telefono: soloNumeros(e.target.value) });

  const actualizarTipoDocumento = (e) => {
    setForm({ ...form, tipo_documento: e.target.value, numero_documento: "" });
    setDocValidado(false);
    setMensajeDoc("");
  };

  const actualizarNumeroDocumento = (e) => {
    const filtro = form.tipo_documento === "dni" ? soloDni
      : form.tipo_documento === "ruc" ? soloRuc
      : soloCarnetExtranjeria;
    setForm({ ...form, numero_documento: filtro(e.target.value) });
    setDocValidado(false);
    setMensajeDoc("");
  };

  const validarDocumento = async () => {
    setMensajeDoc("");
    setValidandoDoc(true);
    try {
      const datos = await api.consultarDocumento(form.tipo_documento, form.numero_documento);
      if (form.tipo_documento === "dni") {
        setForm((f) => ({
          ...f,
          nombre: datos.nombres || f.nombre,
          apellido: [datos.apellido_paterno, datos.apellido_materno].filter(Boolean).join(" ") || f.apellido,
        }));
        setMensajeDoc(`Documento válido: ${datos.nombres} ${datos.apellido_paterno || ""}`);
      } else {
        setMensajeDoc(`RUC válido: ${datos.nombre_o_razon_social || ""}`);
      }
      setDocValidado(true);
    } catch (err) {
      setDocValidado(false);
      setMensajeDoc(err.message);
    } finally {
      setValidandoDoc(false);
    }
  };

  const largoEsperado = { dni: 8, ruc: 11, ce: 6 };
  const puedeValidar =
    form.tipo_documento !== "ce" &&
    form.numero_documento.length >= largoEsperado[form.tipo_documento] &&
    !validandoDoc;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.password_confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const { password_confirmar, numero_documento, ...resto } = form;
      const payload = numero_documento
        ? { ...resto, numero_documento }
        : (() => { const { tipo_documento, ...sinDocumento } = resto; return sinDocumento; })();
      await registro(payload);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="glass rounded-3xl p-8 shadow-glass-lg">
        <h1 className="font-display text-2xl font-semibold text-plum">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-plum-soft">Únete a Anita New Style.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <select
              value={form.tipo_documento}
              onChange={actualizarTipoDocumento}
              className="rounded-2xl bg-white/70 px-3 py-2.5 text-plum shadow-glass focus:outline-none"
            >
              {Object.entries(ETIQUETAS_DOCUMENTO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>{etiqueta}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                placeholder={`Número de ${ETIQUETAS_DOCUMENTO[form.tipo_documento]} (opcional)`}
                value={form.numero_documento}
                onChange={actualizarNumeroDocumento}
                inputMode={form.tipo_documento === "ce" ? "text" : "numeric"}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              {form.tipo_documento !== "ce" && (
                <button
                  type="button"
                  onClick={validarDocumento}
                  disabled={!puedeValidar}
                  className="shrink-0 rounded-2xl bg-gold px-3 py-2.5 text-sm font-semibold text-plum shadow-glass transition hover:bg-gold/80 disabled:opacity-50"
                >
                  {validandoDoc ? "..." : "Validar"}
                </button>
              )}
            </div>
          </div>
          {mensajeDoc && (
            <p className={`-mt-2 text-xs ${docValidado ? "text-emerald-700" : "text-berry-dark"}`}>
              {mensajeDoc}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Nombre"
              required
              maxLength={80}
              value={form.nombre}
              onChange={actualizarTexto("nombre")}
              className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
            />
            <input
              placeholder="Apellido"
              required
              maxLength={80}
              value={form.apellido}
              onChange={actualizarTexto("apellido")}
              className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
            />
          </div>
          <input
            type="email"
            placeholder="Email"
            required
            maxLength={120}
            value={form.email}
            onChange={actualizar("email")}
            className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
          <input
            placeholder="Teléfono (opcional)"
            value={form.telefono}
            onChange={actualizarTelefono}
            inputMode="numeric"
            maxLength={9}
            className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />

          <div className="relative">
            <input
              type={verPassword ? "text" : "password"}
              placeholder="Contraseña"
              required
              minLength={6}
              maxLength={72}
              value={form.password}
              onChange={actualizar("password")}
              className="w-full rounded-2xl bg-white/70 px-4 py-2.5 pr-11 text-plum shadow-glass focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-plum-soft hover:text-berry"
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {verPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
          <input
            type={verPassword ? "text" : "password"}
            placeholder="Confirmar contraseña"
            required
            maxLength={72}
            value={form.password_confirmar}
            onChange={actualizar("password_confirmar")}
            className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />

          {error && <p className="text-sm text-berry-dark">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
          >
            {enviando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-plum-soft">
          ¿Ya tienes cuenta?{" "}
          <Link to="/ingresar" className="font-medium text-berry hover:underline">
            Ingresa
          </Link>
        </p>
      </div>
    </div>
  );
}
