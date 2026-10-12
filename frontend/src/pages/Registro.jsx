import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IconFacebook,
  IconInstagram,
  IconWhatsApp,
  IconMail,
  IconArrowLeft,
} from "../components/Icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleButton from "../components/GoogleButton.jsx";
import { useNavigate } from "react-router-dom";
import registroHero from "../assets/auth/registro-hero.jpg";

const claseInput =
  "w-full rounded-md border border-plum/20 bg-white px-4 py-3 text-plum placeholder:text-plum-soft/50 focus:outline-none focus:border-berry";
const claseLabel = "mb-1.5 block text-sm font-semibold text-plum";

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
    <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
      {/* Flecha de regreso con tooltip */}
      <Link
        to="/"
        aria-label="Volver al inicio"
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-plum shadow-glass backdrop-blur transition hover:bg-white hover:text-berry sm:left-6 sm:top-6 group"
        title="Regresar a la tienda"
      >
        <IconArrowLeft size={18} />
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
            solo con tu correo
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
        <div className="w-full max-w-[460px]">
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
                    onSuccess={() => navigate("/")}
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
        </div>
      </div>
    </div>
  );
}
