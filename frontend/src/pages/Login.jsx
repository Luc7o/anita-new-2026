import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { soloTexto } from "../validacion.js";
import {
  IconEye,
  IconEyeOff,
  IconFacebook,
  IconInstagram,
  IconWhatsApp,
  IconCheck,
  IconArrowRight,
} from "../components/Icons.jsx";
import loginHero from "../assets/auth/login-hero.jpg";

const CLAVE_RECORDAR = "ans_recordar_email";

export default function Login() {
  const { login, continuarComoInvitado } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => localStorage.getItem(CLAVE_RECORDAR) || "");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(() => Boolean(localStorage.getItem(CLAVE_RECORDAR)));
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Checkout como invitado: no exige contraseña, solo lo mínimo para poder
  // armar el pedido y avisarle cuando esté listo. Se ofrece como alternativa
  // al login/registro de siempre, no lo reemplaza.
  const [invitadoAbierto, setInvitadoAbierto] = useState(false);
  const [formInvitado, setFormInvitado] = useState({ nombre: "", apellido: "", email: "" });
  const [errorInvitado, setErrorInvitado] = useState("");
  const [enviandoInvitado, setEnviandoInvitado] = useState(false);

  const destino = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await login(email, password);
      if (recordar) {
        localStorage.setItem(CLAVE_RECORDAR, email);
      } else {
        localStorage.removeItem(CLAVE_RECORDAR);
      }
      navigate(destino);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const actualizarInvitado = (campo, filtro) => (e) => {
    const valor = filtro ? filtro(e.target.value) : e.target.value;
    setFormInvitado((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmitInvitado = async (e) => {
    e.preventDefault();
    setErrorInvitado("");
    setEnviandoInvitado(true);
    try {
      await continuarComoInvitado(formInvitado);
      navigate(destino);
    } catch (err) {
      setErrorInvitado(err.message);
    } finally {
      setEnviandoInvitado(false);
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
        className="relative flex min-h-[320px] flex-col justify-end gap-6 overflow-hidden bg-cover p-6 sm:p-10 lg:w-1/2"
        style={{ backgroundImage: `url(${loginHero})`, backgroundPosition: "18% 20%" }}
      >
        <div className="absolute inset-0 bg-plum/25" />
        <div className="glass relative z-10 rounded-2xl p-6 sm:p-8">
          <h1 className="text-4xl font-semibold leading-tight text-plum sm:text-5xl">
            Bienvenido a
            <br />
            Anita New Style
          </h1>
          <p className="mt-4 max-w-sm text-sm text-plum-soft sm:text-base">
            Tu tienda de moda en Huancayo. Encuentra carteras, mochilas, vestidos y accesorios con estilo.
            <span className="block mt-2 text-berry font-medium">¡Envíos a todo el Perú!</span>
          </p>
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
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 sm:px-16 lg:w-1/2">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-plum sm:text-4xl">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-sm text-plum-soft">
              ¡Qué bueno verte de nuevo! Ingresa tus datos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-plum">
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                required
                maxLength={120}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full rounded-md border border-plum/20 bg-white px-4 py-3 text-plum placeholder:text-plum-soft/50 focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="login-password" className="block text-sm font-semibold text-plum">
                  Contraseña
                </label>
                <Link to="/olvide-password" className="text-xs font-medium text-berry hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={verPassword ? "text" : "password"}
                  required
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-plum/20 bg-white px-4 py-3 pr-11 text-plum focus:outline-none"
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

            <label className="flex cursor-pointer items-center gap-2 text-sm text-plum hover:text-berry transition-colors">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
                className="w-4 h-4 accent-berry rounded border-plum/20"
              />
              Recordarme en este dispositivo
            </label>

            {error && (
              <p className="text-sm text-berry-dark" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-lg bg-plum py-3.5 font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-plum-soft">
            ¿No tienes una cuenta?{" "}
            <Link to="/registro" className="font-bold text-berry hover:underline">
              Crear cuenta.
            </Link>
          </p>

          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-plum-soft/70">
            <span className="h-px flex-1 bg-plum/10" />
            o
            <span className="h-px flex-1 bg-plum/10" />
          </div>

          {!invitadoAbierto ? (
            <button
              type="button"
              onClick={() => setInvitadoAbierto(true)}
              className="glass w-full rounded-full py-3 text-center text-sm font-semibold text-plum shadow-glass transition hover:bg-white/60"
            >
              Comprar sin crear cuenta
            </button>
          ) : (
            <form
              onSubmit={handleSubmitInvitado}
              className="glass space-y-3 rounded-3xl p-5 shadow-glass"
            >
              <div>
                <p className="font-display text-base font-semibold text-plum">Comprar como invitada</p>
                <p className="mt-0.5 text-xs text-plum-soft">
                  Solo lo necesario para armar tu pedido. Si quieres, más adelante puedes ponerle
                  contraseña a esta cuenta para volver a entrar.
                </p>
              </div>

              <div>
                <label htmlFor="inv-nombre" className="sr-only">Nombre</label>
                <input
                  id="inv-nombre"
                  placeholder="Nombre"
                  required
                  maxLength={80}
                  value={formInvitado.nombre}
                  onChange={actualizarInvitado("nombre", soloTexto)}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="inv-apellido" className="sr-only">Apellido</label>
                <input
                  id="inv-apellido"
                  placeholder="Apellido"
                  required
                  maxLength={80}
                  value={formInvitado.apellido}
                  onChange={actualizarInvitado("apellido", soloTexto)}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="inv-email" className="sr-only">Correo electrónico</label>
                <input
                  id="inv-email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  required
                  maxLength={120}
                  value={formInvitado.email}
                  onChange={actualizarInvitado("email")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>

              {errorInvitado && (
                <p className="text-sm text-berry-dark" role="alert">
                  {errorInvitado}
                </p>
              )}

              <button
                type="submit"
                disabled={enviandoInvitado}
                className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-glass-lg transition hover:bg-berry-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviandoInvitado ? "Un momento..." : "Continuar"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}