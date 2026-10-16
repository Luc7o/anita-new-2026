import { useToast } from "../../context/ToastContext.jsx";
import Spinner from "../../components/Spinner.jsx";
import { SkeletonFilasAdmin, SkeletonPanelAdmin, SkeletonDetalleAdmin, SkeletonFormularioAdmin } from "../../components/admin/EsqueletosAdmin.jsx";
import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PUEDE_GESTIONAR_CONFIGURACION } from "../../roles.js";
import MapaTienda from "../../components/MapaTienda.jsx";
import { urlMapaEnlace } from "../../utils/mapa.js";

const CAMPOS_VACIOS = {
  nombre_comercial: "", logo_url: "",
  correo_contacto: "", telefono: "", whatsapp: "",
  direccion: "", referencia: "", ciudad: "", horario_atencion: "", maps_url: "",
  facebook_url: "", instagram_url: "", tiktok_url: "",
};

const claseInput =
  "w-full rounded-2xl bg-white px-4 py-2.5 text-plum focus:outline-none disabled:opacity-60";

function Campo({ id, etiqueta, ayuda, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-plum-soft">{etiqueta}</label>
      <input id={id} className={claseInput} {...props} />
      {ayuda && <p className="mt-1 text-xs text-plum-soft/70">{ayuda}</p>}
    </div>
  );
}

export default function AdminConfiguracion() {
  const toast = useToast();
  const { usuario } = useAuth();
  const puedeEditar = PUEDE_GESTIONAR_CONFIGURACION.includes(usuario?.rol);

  const [form, setForm] = useState(CAMPOS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // { ok, texto }
  const [errorCarga, setErrorCarga] = useState("");
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [errorLogo, setErrorLogo] = useState("");
  // El mapa se actualiza cuando el admin deja de escribir, no en cada tecla.
  const [dirMapa, setDirMapa] = useState({ direccion: "", ciudad: "", maps_url: "" });


  useEffect(() => {
    api
      .adminConfiguracionTienda()
      .then((d) => {
        const limpio = {};
        Object.keys(CAMPOS_VACIOS).forEach((k) => { limpio[k] = d[k] || ""; });
        setForm(limpio);
      })
      .catch((err) => setErrorCarga(err.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => setDirMapa({ direccion: form.direccion, ciudad: form.ciudad, maps_url: form.maps_url }),
      700
    );
    return () => clearTimeout(t);
  }, [form.direccion, form.ciudad, form.maps_url]);

  const subirLogo = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setErrorLogo("");
    if (archivo.size > 5 * 1024 * 1024) {
      setErrorLogo("La imagen pesa más de 5 MB. Elige una más liviana.");
      return;
    }
    setSubiendoLogo(true);
    try {
      const { url } = await api.adminSubirLogoTienda(archivo);
      setForm((f) => ({ ...f, logo_url: url }));
      setAviso({ ok: true, texto: "Logo cargado. Presiona «Guardar configuración» para publicarlo." });
    } catch (err) {
      setErrorLogo(err.message);
    } finally {
      setSubiendoLogo(false);
    }
  };

  const quitarLogo = () => {
    setForm((f) => ({ ...f, logo_url: "" }));
    setAviso({ ok: true, texto: "Logo quitado. Presiona «Guardar configuración» para aplicar el cambio." });
  };

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setAviso(null);
    try {
      await api.adminActualizarConfiguracionTienda(form);
      toast.success("Configuración guardada. La tienda ya muestra los datos nuevos.");
    } catch (err) {
      setAviso({ ok: false, texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <SkeletonFormularioAdmin etiqueta="Cargando configuración" />;

  if (errorCarga) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-plum">Configuración</h1>
        <p className="text-sm text-red-600" role="alert">{errorCarga}</p>
        <p className="text-sm text-plum-soft">Recarga la página; si sigue igual, avisa a quien administra el sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-plum">Configuración</h1>
        <p className="text-sm text-plum-soft">
          Estos datos se muestran en la tienda (Contacto, Nuestras Tiendas, pie de página y páginas
          legales). Lo que dejes vacío no se publica.
        </p>
        {!puedeEditar && (
          <p className="mt-2 text-sm text-berry-dark">Tu rol solo puede consultar esta configuración.</p>
        )}
      </div>

      <form onSubmit={guardar} className="glass max-w-2xl space-y-6 rounded-2xl p-6 sm:p-8">
        <fieldset disabled={!puedeEditar || guardando} className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-plum-soft">Datos de la tienda</h2>
            <Campo id="cfg-nombre" etiqueta="Nombre comercial" required maxLength={120}
              value={form.nombre_comercial} onChange={cambiar("nombre_comercial")} />
            <div>
              <span className="mb-1 block text-xs font-medium text-plum-soft">Logo</span>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-2xl bg-white">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo actual" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="px-2 text-center text-xs text-plum-soft/70">Sin logo</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-[10px] bg-white px-4 py-2 text-sm font-semibold text-plum transition hover:bg-white">
                    {subiendoLogo ? <><Spinner />Subiendo...</> : form.logo_url ? "Cambiar logo" : "Elegir imagen"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={subirLogo}
                      disabled={subiendoLogo}
                      className="hidden"
                    />
                  </label>
                  {form.logo_url && (
                    <button type="button" onClick={quitarLogo}
                      className="rounded-[10px] px-4 py-2 text-sm text-plum-soft hover:text-berry-dark">
                      Quitar
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs text-plum-soft/70">
                PNG, JPG o WEBP de hasta 5 MB (mejor con fondo transparente). Si no hay logo, el encabezado muestra el nombre en texto.
              </p>
              {errorLogo && <p className="mt-1 text-sm text-red-600" role="alert">{errorLogo}</p>}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-plum-soft">Contacto</h2>
            <Campo id="cfg-correo" etiqueta="Correo de contacto" type="email" maxLength={120}
              value={form.correo_contacto} onChange={cambiar("correo_contacto")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo id="cfg-telefono" etiqueta="Teléfono" maxLength={20} inputMode="tel"
                value={form.telefono} onChange={cambiar("telefono")} />
              <Campo id="cfg-whatsapp" etiqueta="WhatsApp" maxLength={20} inputMode="tel"
                ayuda="Con 9 dígitos se asume Perú (+51)."
                value={form.whatsapp} onChange={cambiar("whatsapp")} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-plum-soft">Tienda física</h2>
            <Campo id="cfg-direccion" etiqueta="Dirección" maxLength={200}
              value={form.direccion} onChange={cambiar("direccion")} />
            <Campo id="cfg-referencia" etiqueta="Referencia" maxLength={200}
              value={form.referencia} onChange={cambiar("referencia")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo id="cfg-ciudad" etiqueta="Ciudad" maxLength={80}
                value={form.ciudad} onChange={cambiar("ciudad")} />
              <Campo id="cfg-horario" etiqueta="Horario de atención" maxLength={120}
                value={form.horario_atencion} onChange={cambiar("horario_atencion")} />
            </div>
            {dirMapa.direccion || /maps\/embed/i.test(dirMapa.maps_url) ? (
              <div className="space-y-2">
                <MapaTienda {...dirMapa} />
                {urlMapaEnlace(dirMapa) && (
                  <a href={urlMapaEnlace(dirMapa)} target="_blank" rel="noopener noreferrer"
                    className="inline-block text-xs font-semibold text-berry hover:underline">
                    Abrir en Google Maps
                  </a>
                )}
                <p className="text-xs text-plum-soft/70">
                  Así verán el mapa los clientes. Se arma con la dirección y la ciudad; si el pin no queda exacto,
                  completa mejor la dirección o pega abajo el enlace «Insertar un mapa» de Google Maps.
                </p>
              </div>
            ) : (
              <p className="text-xs text-plum-soft/70">Escribe la dirección y aquí aparecerá el mapa de Google.</p>
            )}
            <Campo id="cfg-maps" etiqueta="Enlace de Google Maps (opcional)" maxLength={400} placeholder="https://..."
              ayuda="Solo si quieres un punto exacto. Acepta un enlace normal de Maps o la URL del código «Insertar un mapa»."
              value={form.maps_url} onChange={cambiar("maps_url")} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-plum-soft">Redes sociales</h2>
            <Campo id="cfg-facebook" etiqueta="Facebook" maxLength={200} placeholder="https://..."
              value={form.facebook_url} onChange={cambiar("facebook_url")} />
            <Campo id="cfg-instagram" etiqueta="Instagram" maxLength={200} placeholder="https://..."
              value={form.instagram_url} onChange={cambiar("instagram_url")} />
            <Campo id="cfg-tiktok" etiqueta="TikTok" maxLength={200} placeholder="https://..."
              value={form.tiktok_url} onChange={cambiar("tiktok_url")} />
          </section>

          <section>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-plum-soft">Moneda</h2>
            <p className="text-sm text-plum">Soles peruanos (S/)</p>
            <p className="text-xs text-plum-soft/70">
              Fija: los precios y el cobro con Culqi funcionan en soles.
            </p>
          </section>
        </fieldset>

        {puedeEditar && (
          <button
            type="submit"
            disabled={guardando}
            className="rounded-[10px] bg-berry px-6 py-2.5 font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
          >
            {guardando ? <><Spinner />Guardando...</> : "Guardar configuración"}
          </button>
        )}
        <div aria-live="polite">
          {aviso && (
            <p className={`text-sm ${aviso.ok ? "text-berry-dark" : "text-red-600"}`} role={aviso.ok ? undefined : "alert"}>
              {aviso.texto}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
