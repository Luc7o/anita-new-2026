import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";
import {
  IconEye,
  IconEyeOff,
  IconCheckCircle,
  IconArrowLeft,
  IconFacebook,
  IconInstagram,
  IconWhatsApp,
} from "../components/Icons.jsx";
import registroHero from "../assets/auth/registro-hero.jpg";

const claseInput =
  "w-full rounded-md border border-plum/20 bg-white px-4 py-3 pr-11 text-plum placeholder:text-plum-soft/50 focus:outline-none focus:border-berry";
const claseLabel = "mb-1.5 block text-sm font-semibold text-plum";

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("El enlace no es válido. Solicita uno nuevo.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      await api.restablecerPassword({ token, password_nueva: password });
      setExito(true);
      setTimeout(() => navigate("/ingresar"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Columna de marca */}
      <div
        className="relative flex min-h-[280px] flex-col justify-end gap-6 overflow-hidden bg-cover bg-center p-6 sm:p-10 lg:w-1/2"
        style={{ backgroundImage: `url(${registroHero})` }}
      >
        <div className="absolute inset-0 bg-plum/25" />
        <div className="glass relative z-10 rounded-2xl p-6 sm:p-8">
          <h1 className="text-4xl font-semibold leading-tight text-plum sm:text-5xl">
            Crea tu Nueva
            <br />
            Contraseña
          </h1>
          <p className="mt-4 max-w-sm text-sm text-plum-soft sm:text-base">
            Elige una contraseña segura para proteger tu cuenta de Anita New Style.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <a href="#" aria-label="Facebook" className="text-plum-soft transition hover:text-berry">
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
          {exito ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lilac text-berry">
                <IconCheckCircle size={32} />
              </div>
              <h2 className="mt-6 text-3xl font-semibold text-plum sm:text-4xl">
                ¡Contraseña Actualizada!
              </h2>
              <p className="mt-2 text-sm text-plum-soft">
                Tu contraseña se actualizó correctamente. Te llevamos a la página de
                ingreso...
              </p>
            </div>
          ) : !token ? (
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-plum sm:text-4xl">
                Enlace no Válido
              </h2>
              <p className="mt-2 text-sm text-plum-soft">
                Este enlace de recuperación no es válido o ya expiró. Solicita uno nuevo
                para continuar.
              </p>
              <Link
                to="/olvide-password"
                className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-plum py-3.5 font-semibold text-white transition hover:bg-berry-dark"
              >
                Solicitar Nuevo Enlace
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-semibold text-plum sm:text-4xl">
                  Nueva Contraseña
                </h2>
                <p className="mt-2 text-sm text-plum-soft">
                  Crea una contraseña nueva y segura para tu cuenta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="restablecer-password" className={claseLabel}>
                    Contraseña Nueva
                  </label>
                  <div className="relative">
                    <input
                      id="restablecer-password"
                      type={verPassword ? "text" : "password"}
                      required
                      minLength={6}
                      maxLength={72}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={claseInput}
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
                  <label htmlFor="restablecer-confirmar" className={claseLabel}>
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="restablecer-confirmar"
                      type={verPassword ? "text" : "password"}
                      required
                      maxLength={72}
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      className={claseInput}
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

                {error && (
                  <p className="text-sm text-berry-dark" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full rounded-lg bg-plum py-3.5 font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
                >
                  {enviando ? "Guardando..." : "Restablecer Contraseña"}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-sm text-plum-soft">
            <IconArrowLeft size={14} />
            <Link to="/ingresar" className="font-bold text-berry hover:underline">
              Volver a Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
