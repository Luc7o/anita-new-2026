import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconEye, IconEyeOff, IconFacebook, IconInstagram, IconWhatsApp, IconCheck, IconArrowRight } from "../components/Icons.jsx";
import { soloTexto, soloNumeros, soloDni, soloRuc, soloCarnetExtranjeria } from "../validacion.js";
import { api } from "../api/client.js";
import registroHero from "../assets/auth/registro-hero.jpg";

const ETIQUETAS_DOCUMENTO = { dni: "DNI", ruc: "RUC", ce: "Carné de Extranjería" };

const claseInput =
  "w-full rounded-md border border-plum/20 bg-white px-4 py-3 text-plum placeholder:text-plum-soft/50 focus:outline-none focus:border-berry";
const claseLabel = "mb-1.5 block text-sm font-semibold text-plum";

export default function Registro() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "", apellido: "", email: "", password: "", password_confirmar: "", telefono: "",
    tipo_documento: "dni", numero_documento: "",
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
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
    if (!aceptaTerminos) {
      setError("Debes aceptar los Términos y Condiciones de Uso.");
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
    <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
      {/* Flecha de regreso con tooltip */}
      <Link
        to="/"
        aria-label="Volver al inicio"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-plum transition hover:text-berry hover:bg-white/30 hover:shadow-glass sm:right-6 sm:top-6 group"
        title="Regresar a la tienda"
      >
        <IconArrowRight size={18} />
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-plum/80 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
          Regresar a la tienda
        </span>
      </Link>

      {/* Columna de marca */}
      <div
        className="relative flex min-h-[280px] flex-col justify-end gap-6 overflow-hidden bg-cover bg-center p-6 sm:p-10 lg:w-1/2"
        style={{ backgroundImage: `url(${registroHero})` }}
      >
        <div className="absolute inset-0 bg-plum/25" />
        <div className="glass relative z-10 rounded-2xl p-6 sm:p-8">
          <h1 className="text-4xl font-semibold leading-tight text-plum sm:text-5xl">
            Regístrate
            <br />
            para comprar
          </h1>
          <div className="mt-4 max-w-sm text-sm text-plum-soft sm:text-base">
            <p className="font-semibold text-berry">Beneficios ANITA NEW STYLE</p>
            <ul className="mt-2 space-y-1.5 list-disc pl-4">
              <li>Recibir notificaciones en tiempo real de tus pedidos.</li>
              <li>Revisar tus boletas online.</li>
              <li>Guardar medios de pago y direcciones favoritas.</li>
            </ul>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <a 
              href="https://www.facebook.com/anitanewstyle" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Facebook" 
              className="text-plum-soft transition hover:text-berry"
            >
              <IconFacebook />
            </a>
            <a href="#" aria-label="Instagram" className="text-plum-soft transition hover:text-berry">
              <IconInstagram />
            </a>
            <a href="#" aria-label="WhatsApp" className="text-plum-soft transition hover:text-berry">
              <IconWhatsApp />
            </a>
          </div>
        </div>
      </div>

      {/* Columna de formulario */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 sm:px-16 lg:w-1/2">
        <div className="w-full max-w-[560px]">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-plum sm:text-4xl">
              Crear una Cuenta
            </h2>
            <p className="mt-2 text-sm text-plum-soft">
              Únete a nosotros y descubre lo último en moda y accesorios.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-nombre" className={claseLabel}>Nombres</label>
                <input
                  id="reg-nombre"
                  placeholder="María Anita"
                  required
                  maxLength={80}
                  value={form.nombre}
                  onChange={actualizarTexto("nombre")}
                  className={claseInput}
                />
              </div>
              <div>
                <label htmlFor="reg-apellido" className={claseLabel}>Apellidos</label>
                <input
                  id="reg-apellido"
                  placeholder="Quispe Flores"
                  required
                  maxLength={80}
                  value={form.apellido}
                  onChange={actualizarTexto("apellido")}
                  className={claseInput}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className={claseLabel}>Email</label>
              <input
                id="reg-email"
                type="email"
                placeholder="maria.anita@gmail.com"
                required
                maxLength={120}
                value={form.email}
                onChange={actualizar("email")}
                className={claseInput}
              />
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-4">
              <div>
                <label htmlFor="reg-tipo-doc" className={claseLabel}>Tipo de Documento</label>
                <select
                  id="reg-tipo-doc"
                  value={form.tipo_documento}
                  onChange={actualizarTipoDocumento}
                  className="h-[50px] rounded-md border border-plum/20 bg-white px-3 text-plum focus:outline-none focus:border-berry"
                >
                  {Object.entries(ETIQUETAS_DOCUMENTO).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>{etiqueta}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="reg-num-doc" className={claseLabel}>
                  Número de {ETIQUETAS_DOCUMENTO[form.tipo_documento]} (opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    id="reg-num-doc"
                    placeholder="Número de documento"
                    value={form.numero_documento}
                    onChange={actualizarNumeroDocumento}
                    inputMode={form.tipo_documento === "ce" ? "text" : "numeric"}
                    className={claseInput}
                  />
                  {form.tipo_documento !== "ce" && (
                    <button
                      type="button"
                      onClick={validarDocumento}
                      disabled={!puedeValidar}
                      className="shrink-0 rounded-md bg-gold px-4 text-sm font-semibold text-plum transition hover:bg-gold/80 disabled:opacity-50"
                    >
                      {validandoDoc ? "..." : "Validar"}
                    </button>
                  )}
                </div>
              </div>
            </div>
            {mensajeDoc && (
              <p
                className={`-mt-3 text-xs ${docValidado ? "text-emerald-700" : "text-berry-dark"}`}
                role={docValidado ? "status" : "alert"}
                aria-live="polite"
              >
                {mensajeDoc}
              </p>
            )}

            <div>
              <label htmlFor="reg-telefono" className={claseLabel}>Teléfono (opcional)</label>
              <div className="flex overflow-hidden rounded-md border border-plum/20 focus-within:border-berry">
                <span className="flex items-center bg-lilac px-3 text-sm font-bold text-plum">+51</span>
                <input
                  id="reg-telefono"
                  placeholder="987654321"
                  value={form.telefono}
                  onChange={actualizarTelefono}
                  inputMode="numeric"
                  maxLength={9}
                  className="w-full px-4 py-3 text-plum focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-password" className={claseLabel}>Crear Contraseña</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={verPassword ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={72}
                    value={form.password}
                    onChange={actualizar("password")}
                    className={`${claseInput} pr-11`}
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
              </div>
              <div>
                <label htmlFor="reg-password-confirmar" className={claseLabel}>Confirmar Contraseña</label>
                <input
                  id="reg-password-confirmar"
                  type={verPassword ? "text" : "password"}
                  required
                  maxLength={72}
                  value={form.password_confirmar}
                  onChange={actualizar("password_confirmar")}
                  className={claseInput}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-plum">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                  aceptaTerminos ? "border-berry bg-berry text-white" : "border-plum bg-white"
                }`}
              >
                {aceptaTerminos && <IconCheck size={12} />}
              </span>
              Aceptar Términos y Condiciones de Uso
            </label>

            {error && <p className="text-sm text-berry-dark" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-lg bg-plum py-3.5 font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-plum-soft">
            ¿Ya tienes cuenta?{" "}
            <Link to="/ingresar" className="font-bold text-berry hover:underline">
              Ingresa.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}