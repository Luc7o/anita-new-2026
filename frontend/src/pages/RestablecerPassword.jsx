import Spinner from "../components/Spinner.jsx";
import React, { useState } from "react";
import AuthLayout from "../components/AuthLayout.jsx";
import MedidorPassword from "../components/MedidorPassword.jsx";
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
import registroHero from "../assets/auth/registro-hero.webp";
import { claseInputAuth, claseLabel } from "../estilos.js";

const claseInput = `${claseInputAuth} pr-11`;

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
    <AuthLayout
      imagen={registroHero}
      altoMarca={280}
      anchoForm={420}
      padY={16}
      titulo={
        <>
          Crea tu Nueva
          <br />
          Contraseña
        </>
      }
      marca={
        <p className="mt-4 max-w-sm text-sm text-plum-soft sm:text-base">
          Elige una contraseña segura para proteger tu cuenta de Anita New Style.
        </p>
      }
    >
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
              <MedidorPassword password={password} />
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
              {confirmar && (
                <p
                  className={`mt-1.5 text-xs ${confirmar === password ? "font-medium text-green-700" : "text-berry-dark"}`}
                  aria-live="polite"
                >
                  {confirmar === password ? "✓ Las contraseñas coinciden." : "Las contraseñas aún no coinciden."}
                </p>
              )}
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
              {enviando ? <><Spinner />Guardando...</> : "Restablecer Contraseña"}
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
    </AuthLayout>
  );
}
