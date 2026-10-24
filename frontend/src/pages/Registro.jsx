import React, { useState } from "react";
import AuthLayout from "../components/AuthLayout.jsx";
import { Link, useLocation } from "react-router-dom";
import {
  IconMail,
} from "../components/Icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleButton from "../components/GoogleButton.jsx";
import { useNavigate } from "react-router-dom";
import registroHero from "../assets/auth/registro-hero.webp";
import { claseInputAuth as claseInput, claseLabel } from "../estilos.js";

// Registro mínimo: solo el correo. La cuenta se crea al instante con un nombre
// y una contraseña aleatorios y la persona queda con sesión iniciada para
// seguir comprando. Sus datos reales se piden recién al comprar (ver
// Checkout) y le llega un enlace por correo para elegir su contraseña cuando
// quiera.
export default function Registro() {
  const navigate = useNavigate();
  const location = useLocation();
  const { registroConEmail } = useAuth();
  const destino = location.state?.from || "/";
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await registroConEmail(email.trim());
      navigate(destino);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthLayout
      imagen={registroHero}
      conAtras
      altoMarca={280}
      anchoForm={460}
      padY={12}
      titulo={
        <>
          Regístrate
          <br />
          solo con tu correo
        </>
      }
      marca={
        <div className="mt-4 max-w-sm text-sm text-plum-soft sm:text-base">
          <p className="font-semibold text-berry">Beneficios ANITA NEW STYLE</p>
          <ul className="mt-2 space-y-1.5 list-disc pl-4">
            <li>Recibir notificaciones en tiempo real de tus pedidos.</li>
            <li>Revisar tus boletas online.</li>
            <li>Guardar medios de pago y direcciones favoritas.</li>
          </ul>
        </div>
      }
    >
      {(
        <>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-plum sm:text-4xl">
              Crear una Cuenta
            </h2>
            <p className="mt-2 text-sm text-plum-soft">
              Solo necesitas tu correo. Podrás seguir comprando de inmediato y elegir tu contraseña cuando quieras.
            </p>
          </div>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <>
              <GoogleButton
                texto="signup_with"
                onSuccess={(u) => navigate(u?.requiere2fa ? "/ingresar" : "/")}
                onError={setError}
              />
              <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-plum-soft/70">
                <span className="h-px flex-1 bg-plum/10" />
                o regístrate con tu correo
                <span className="h-px flex-1 bg-plum/10" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reg-email" className={claseLabel}>Correo electrónico</label>
              <div className="relative">
                <input
                  id="reg-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="maria.anita@gmail.com"
                  required
                  maxLength={120}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${claseInput} pr-11`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-plum-soft">
                  <IconMail size={18} />
                </span>
              </div>
            </div>

            {error && <p className="text-sm text-berry-dark" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-plum py-3.5 font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
            >
              {enviando ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </button>

            <p className="text-center text-xs text-plum-soft">
              Al continuar aceptas los{" "}
              <Link to="/terminos-y-condiciones" className="font-semibold text-berry hover:underline">
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link to="/politica-de-privacidad" className="font-semibold text-berry hover:underline">
                Política de Privacidad
              </Link>
              .
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-plum-soft">
            ¿Ya tienes cuenta?{" "}
            <Link to="/ingresar" className="font-bold text-berry hover:underline">
              Ingresa.
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
