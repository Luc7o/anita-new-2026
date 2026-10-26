import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import Spinner from "../components/Spinner.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import CuentaLayout from "../components/CuentaLayout.jsx";
import { IconLogout, IconCheck } from "../components/Icons.jsx";

const tarjeta = "glass rounded-2xl p-5 shadow-glass sm:p-6";
const campoTexto =
  "w-full rounded-xl bg-white px-4 py-2.5 text-sm text-plum ring-1 ring-plum/15 placeholder:text-plum-soft/60 focus:outline-none focus:ring-2 focus:ring-berry/40";
const botonPrimario =
  "rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60";
const botonSecundario =
  "rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-plum ring-1 ring-plum/15 transition hover:bg-berry/5 disabled:opacity-60";

function descargarArchivo(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Configuracion() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [estado, setEstado] = useState(null); // preferencias y seguridad de la cuenta
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    api.preferenciasCuenta().then(setEstado).catch((e) => setErrorCarga(e.message || "No se pudo cargar tu configuración."));
  }, []);

  const cerrarSesion = () => {
    logout();
    toast.info("Cerraste sesión");
    navigate("/");
  };

  return (
    <CuentaLayout>
      <div className="space-y-6">
        {errorCarga && <p role="alert" className="text-sm text-berry-dark">{errorCarga}</p>}
        {!estado && !errorCarga && <p className="text-sm text-plum-soft">Cargando tu configuración…</p>}

        {estado && (
          <>
            <Notificaciones estado={estado} setEstado={setEstado} />
            <DosPasos estado={estado} setEstado={setEstado} />
            <TusDatos />
            <EliminarCuenta estado={estado} />
          </>
        )}

        <button
          onClick={cerrarSesion}
          className="flex items-center gap-2 rounded-full border border-berry/40 px-6 py-2.5 text-sm font-semibold text-berry-dark transition hover:bg-berry/10"
        >
          <IconLogout size={16} />
          Cerrar sesión
        </button>
      </div>
    </CuentaLayout>
  );
}

// ------------------------------------------------------------ Notificaciones
function Notificaciones({ estado, setEstado }) {
  const toast = useToast();
  const [guardando, setGuardando] = useState(false);

  const alternar = async () => {
    const nuevo = !estado.acepta_promociones;
    setGuardando(true);
    setEstado({ ...estado, acepta_promociones: nuevo }); // se ve al instante
    try {
      const r = await api.actualizarPreferenciasCuenta({ acepta_promociones: nuevo });
      setEstado(r);
      toast.success(nuevo ? "Recibirás nuestras promociones por correo" : "Ya no recibirás promociones por correo");
    } catch (err) {
      setEstado({ ...estado, acepta_promociones: !nuevo });
      toast.error(err.message || "No se pudo guardar el cambio");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className={tarjeta} aria-labelledby="cfg-notificaciones">
      <h2 id="cfg-notificaciones" className="text-lg font-semibold text-plum">Notificaciones por correo</h2>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-plum">Promociones y novedades</p>
          <p className="mt-0.5 text-xs text-plum-soft">Ofertas de temporada y lanzamientos. Puedes cambiarlo cuando quieras.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={estado.acepta_promociones}
          aria-label="Recibir promociones y novedades por correo"
          onClick={alternar}
          disabled={guardando}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${estado.acepta_promociones ? "bg-berry" : "bg-plum/20"} disabled:opacity-70`}
        >
          <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${estado.acepta_promociones ? "translate-x-5" : ""}`} />
        </button>
      </div>
      <p className="mt-4 border-t border-plum/10 pt-3 text-xs text-plum-soft">
        Los correos sobre tus pedidos y los avisos de seguridad de tu cuenta se envían siempre.
      </p>
    </section>
  );
}

// -------------------------------------------------- Verificación en dos pasos
function DosPasos({ estado, setEstado }) {
  const toast = useToast();
  const [fase, setFase] = useState("inicio"); // inicio | configurar | respaldo | desactivar | regenerar
  const [config, setConfig] = useState(null); // { secreto, qr }
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [codigosRespaldo, setCodigosRespaldo] = useState([]);
  const [guardado, setGuardado] = useState(false);

  const volver = () => {
    setFase("inicio");
    setCodigo("");
    setError("");
    setConfig(null);
    setGuardado(false);
  };

  const empezar = async () => {
    setOcupado(true);
    setError("");
    try {
      const { secreto, uri } = await api.iniciar2fa();
      const QR = await import("qrcode"); // se carga solo cuando hace falta
      const qr = await QR.toDataURL(uri, { width: 200, margin: 1 });
      setConfig({ secreto, qr });
      setFase("configurar");
    } catch (err) {
      setError(err.message || "No se pudo preparar la verificación.");
    } finally {
      setOcupado(false);
    }
  };

  const activar = async (e) => {
    e.preventDefault();
    setOcupado(true);
    setError("");
    try {
      const { codigos_respaldo, ...nuevoEstado } = await api.activar2fa(codigo.replace(/\s/g, ""));
      setEstado(nuevoEstado);
      setCodigosRespaldo(codigos_respaldo);
      setCodigo("");
      setConfig(null);
      setFase("respaldo");
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(false);
    }
  };

  const desactivar = async (e) => {
    e.preventDefault();
    setOcupado(true);
    setError("");
    try {
      setEstado(await api.desactivar2fa(codigo.trim()));
      toast.success("Verificación en dos pasos desactivada");
      volver();
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(false);
    }
  };

  const regenerar = async (e) => {
    e.preventDefault();
    setOcupado(true);
    setError("");
    try {
      const { codigos_respaldo, ...nuevoEstado } = await api.codigosNuevos2fa(codigo.trim());
      setEstado(nuevoEstado);
      setCodigosRespaldo(codigos_respaldo);
      setCodigo("");
      setFase("respaldo");
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(false);
    }
  };

  const copiar = async (texto, mensaje) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(mensaje);
    } catch {
      toast.error("No se pudo copiar. Selecciónalo y cópialo a mano.");
    }
  };

  const entradaCodigo = (id, etiqueta, ayuda) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-plum-soft">{etiqueta}</label>
      <input
        id={id}
        autoFocus
        autoComplete="one-time-code"
        maxLength={12}
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.toLowerCase().replace(/[^a-z0-9 -]/g, ""))}
        placeholder="000000"
        className={`${campoTexto} max-w-[14rem] text-center text-lg tracking-[0.25em] placeholder:tracking-normal`}
      />
      {ayuda && <p className="mt-1 text-xs text-plum-soft">{ayuda}</p>}
    </div>
  );

  return (
    <section className={tarjeta} aria-labelledby="cfg-2fa">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="cfg-2fa" className="text-lg font-semibold text-plum">Verificación en dos pasos</h2>
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${estado.totp_activo ? "bg-green-100 text-green-700" : "bg-plum/10 text-plum-soft"}`}>
          {estado.totp_activo ? "Activada" : "Desactivada"}
        </span>
      </div>
      <p className="mt-1 text-xs text-plum-soft">
        Además de tu contraseña, te pediremos un código de tu celular al iniciar sesión. Protege tu cuenta aunque alguien conozca tu contraseña.
      </p>

      {error && <p role="alert" className="mt-3 text-sm text-berry-dark">{error}</p>}

      {fase === "inicio" && !estado.totp_activo && (
        <div className="mt-4">
          <button type="button" onClick={empezar} disabled={ocupado} className={botonPrimario}>
            {ocupado ? <><Spinner />Preparando...</> : "Activar verificación en dos pasos"}
          </button>
        </div>
      )}

      {fase === "inicio" && estado.totp_activo && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-plum">
            Te quedan <strong>{estado.codigos_respaldo_restantes}</strong> código{estado.codigos_respaldo_restantes === 1 ? "" : "s"} de respaldo.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setFase("regenerar"); setError(""); }} className={botonSecundario}>
              Generar códigos de respaldo nuevos
            </button>
            <button type="button" onClick={() => { setFase("desactivar"); setError(""); }} className={botonSecundario}>
              Desactivar
            </button>
          </div>
        </div>
      )}

      {fase === "configurar" && config && (
        <form onSubmit={activar} className="mt-5 space-y-5">
          <ol className="space-y-5 text-sm text-plum">
            <li>
              <p className="font-semibold">1. Instala una app de autenticación</p>
              <p className="mt-0.5 text-xs text-plum-soft">Google Authenticator, Microsoft Authenticator o Authy (gratis).</p>
            </li>
            <li>
              <p className="font-semibold">2. Escanea este código QR con la app</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <img src={config.qr} alt="Código QR para configurar la app de autenticación" width={200} height={200} className="rounded-xl bg-white p-2 ring-1 ring-plum/10" />
                <div className="min-w-0 text-xs text-plum-soft">
                  <p>¿No puedes escanearlo? Escribe esta clave en la app:</p>
                  <p className="mt-1 break-all font-mono text-sm tracking-wider text-plum">{config.secreto.match(/.{1,4}/g).join(" ")}</p>
                  <button type="button" onClick={() => copiar(config.secreto, "Clave copiada")} className="mt-2 font-semibold text-berry hover:underline">
                    Copiar clave
                  </button>
                </div>
              </div>
            </li>
            <li>
              <p className="mb-2 font-semibold">3. Escribe el código de 6 dígitos que muestra la app</p>
              {entradaCodigo("cfg-2fa-codigo", "Código", "Si no funciona, revisa que la hora de tu celular esté en automático.")}
            </li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={ocupado || codigo.replace(/\s/g, "").length < 6} className={botonPrimario}>
              {ocupado ? <><Spinner />Verificando...</> : "Confirmar y activar"}
            </button>
            <button type="button" onClick={volver} className={botonSecundario}>Cancelar</button>
          </div>
        </form>
      )}

      {fase === "respaldo" && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-white p-4 ring-1 ring-berry/30">
            <p className="text-sm font-semibold text-plum">Guarda tus códigos de respaldo</p>
            <p className="mt-1 text-xs text-plum-soft">
              Si pierdes tu celular, cada uno de estos códigos te permite entrar una sola vez. <strong>No volverán a mostrarse.</strong> Guárdalos en un lugar seguro.
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-sm text-plum">
              {codigosRespaldo.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
              <button type="button" onClick={() => copiar(codigosRespaldo.join("\n"), "Códigos copiados")} className="text-berry hover:underline">Copiar</button>
              <button
                type="button"
                onClick={() => descargarArchivo("anita-new-style-codigos-de-respaldo.txt", `Anita New Style - códigos de respaldo\n(cada uno sirve una sola vez)\n\n${codigosRespaldo.join("\n")}\n`, "text/plain")}
                className="text-berry hover:underline"
              >
                Descargar
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-plum">
            <input type="checkbox" checked={guardado} onChange={(e) => setGuardado(e.target.checked)} />
            Ya guardé mis códigos en un lugar seguro
          </label>
          <button type="button" disabled={!guardado} onClick={volver} className={botonPrimario}>
            <IconCheck size={14} className="mr-1 inline" /> Listo
          </button>
        </div>
      )}

      {fase === "desactivar" && (
        <form onSubmit={desactivar} className="mt-5 space-y-4">
          {entradaCodigo("cfg-2fa-off", "Código de tu app (o un código de respaldo)", "Para desactivarla necesitamos confirmar que eres tú.")}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={ocupado || codigo.trim().length < 6} className={botonPrimario}>
              {ocupado ? <><Spinner />Desactivando...</> : "Desactivar verificación"}
            </button>
            <button type="button" onClick={volver} className={botonSecundario}>Cancelar</button>
          </div>
        </form>
      )}

      {fase === "regenerar" && (
        <form onSubmit={regenerar} className="mt-5 space-y-4">
          {entradaCodigo("cfg-2fa-nuevos", "Código de tu app (o un código de respaldo)", "Los códigos de respaldo anteriores dejarán de servir.")}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={ocupado || codigo.trim().length < 6} className={botonPrimario}>
              {ocupado ? <><Spinner />Generando...</> : "Generar códigos nuevos"}
            </button>
            <button type="button" onClick={volver} className={botonSecundario}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  );
}

// ------------------------------------------------------------ Descargar datos
function TusDatos() {
  const toast = useToast();
  const [descargando, setDescargando] = useState(false);

  const descargar = async () => {
    setDescargando(true);
    try {
      const datos = await api.misDatos();
      const fecha = new Date().toISOString().slice(0, 10);
      descargarArchivo(`anita-new-style-mis-datos-${fecha}.json`, JSON.stringify(datos, null, 2), "application/json");
      toast.success("Tus datos se descargaron");
    } catch (err) {
      toast.error(err.message || "No se pudieron descargar tus datos");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <section className={tarjeta} aria-labelledby="cfg-datos">
      <h2 id="cfg-datos" className="text-lg font-semibold text-plum">Descargar mis datos</h2>
      <p className="mt-1 text-xs text-plum-soft">
        Un archivo con tu información de cuenta, dirección, pedidos, favoritos y reseñas.
      </p>
      <div className="mt-4">
        <button type="button" onClick={descargar} disabled={descargando} className={botonSecundario}>
          {descargando ? <><Spinner />Preparando...</> : "Descargar mis datos"}
        </button>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ Eliminar cuenta
function EliminarCuenta({ estado }) {
  const toast = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [password, setPassword] = useState("");
  const [codigo2fa, setCodigo2fa] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [eliminando, setEliminando] = useState(false);

  const listo =
    confirmacion.trim().toUpperCase() === "ELIMINAR" &&
    (!estado.requiere_password || password.length > 0) &&
    (!estado.totp_activo || codigo2fa.trim().length >= 6);

  const eliminar = async (e) => {
    e.preventDefault();
    setEliminando(true);
    setError("");
    try {
      await api.eliminarCuenta({
        confirmacion,
        ...(estado.requiere_password ? { password } : {}),
        ...(estado.totp_activo ? { codigo_2fa: codigo2fa.trim() } : {}),
      });
      logout(); // limpia la sesión local
      toast.success("Tu cuenta fue eliminada");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <section className={`${tarjeta} border border-berry/20`} aria-labelledby="cfg-eliminar">
      <h2 id="cfg-eliminar" className="text-lg font-semibold text-berry-dark">Eliminar mi cuenta</h2>
      <p className="mt-1 text-xs text-plum-soft">
        Se borran tus datos personales, tu carrito y tus favoritos, y ya no podrás iniciar sesión. No se puede deshacer.
      </p>

      {!abierto ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="rounded-full bg-berry/10 px-5 py-2.5 text-sm font-semibold text-berry-dark transition hover:bg-berry/20"
          >
            Quiero eliminar mi cuenta
          </button>
        </div>
      ) : (
        <form onSubmit={eliminar} className="mt-4 space-y-4">
          <ul className="list-disc space-y-1 pl-5 text-xs text-plum-soft">
            <li>Los pedidos que ya hiciste se conservan para fines contables y de postventa, sin tus datos de cuenta.</li>
            <li>Tus reseñas siguen publicadas, pero sin tu nombre.</li>
            <li>Si tienes pedidos en curso, podrás eliminar la cuenta cuando se entreguen o se cancelen.</li>
          </ul>

          {estado.requiere_password && (
            <div>
              <label htmlFor="cfg-del-pass" className="mb-1 block text-xs font-semibold text-plum-soft">Tu contraseña</label>
              <input id="cfg-del-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${campoTexto} max-w-sm`} />
            </div>
          )}
          {estado.totp_activo && (
            <div>
              <label htmlFor="cfg-del-2fa" className="mb-1 block text-xs font-semibold text-plum-soft">Código de tu app de autenticación</label>
              <input id="cfg-del-2fa" autoComplete="one-time-code" maxLength={12} value={codigo2fa} onChange={(e) => setCodigo2fa(e.target.value.toLowerCase().replace(/[^a-z0-9 -]/g, ""))} className={`${campoTexto} max-w-[14rem]`} />
            </div>
          )}
          <div>
            <label htmlFor="cfg-del-confirmar" className="mb-1 block text-xs font-semibold text-plum-soft">Escribe ELIMINAR para confirmar</label>
            <input id="cfg-del-confirmar" autoComplete="off" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} className={`${campoTexto} max-w-[14rem]`} />
          </div>

          {error && <p role="alert" className="text-sm text-berry-dark">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!listo || eliminando}
              className="rounded-full bg-berry-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-berry disabled:opacity-50"
            >
              {eliminando ? <><Spinner />Eliminando...</> : "Eliminar mi cuenta definitivamente"}
            </button>
            <button type="button" onClick={() => { setAbierto(false); setError(""); }} className={botonSecundario}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  );
}
