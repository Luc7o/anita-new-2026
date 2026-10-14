import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PUEDE_GESTIONAR_CONFIGURACION } from "../../roles.js";

const CAMPOS_VACIOS = {
  nombre_comercial: "", logo_url: "",
  correo_contacto: "", telefono: "", whatsapp: "",
  direccion: "", referencia: "", ciudad: "", horario_atencion: "", maps_url: "",
  facebook_url: "", instagram_url: "", tiktok_url: "",
};

const claseInput =
  "w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none disabled:opacity-60";

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
  const { usuario } = useAuth();
  const puedeEditar = PUEDE_GESTIONAR_CONFIGURACION.includes(usuario?.rol);

  const [form, setForm] = useState(CAMPOS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // { ok, texto }

  const [correoPrueba, setCorreoPrueba] = useState("");
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState(null);

  useEffect(() => {
    api
      .adminConfiguracionTienda()
      .then((d) => {
        const limpio = {};
        Object.keys(CAMPOS_VACIOS).forEach((k) => { limpio[k] = d[k] || ""; });
        setForm(limpio);
      })
      .catch((err) => setAviso({ ok: false, texto: err.message }))
      .finally(() => setCargando(false));
  }, []);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setAviso(null);
    try {
      await api.adminActualizarConfiguracionTienda(form);
      setAviso({ ok: true, texto: "Configuración guardada. La tienda ya muestra los datos nuevos." });
    } catch (err) {
      setAviso({ ok: false, texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  const probarCorreo = async (e) => {
    e.preventDefault();
    setProbando(true);
    setResultadoPrueba(null);
    try {
      const data = await api.adminProbarCorreo(correoPrueba);
      setResultadoPrueba({ ok: true, texto: data.mensaje });
    } catch (err) {
      setResultadoPrueba({ ok: false, texto: err.message });
    } finally {
      setProbando(false);
    }
  };

  if (cargando) return <p className="text-plum-soft">Cargando configuración...</p>;

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

      <form onSubmit={guardar} className="glass max-w-2xl space-y-6 rounded-3xl p-6 shadow-glass sm:p-8">
        <fieldset disabled={!puedeEditar || guardando} className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-plum-soft">Datos de la tienda</h2>
            <Campo id="cfg-nombre" etiqueta="Nombre comercial" required maxLength={120}
              value={form.nombre_comercial} onChange={cambiar("nombre_comercial")} />
            <Campo id="cfg-logo" etiqueta="Logo (enlace a la imagen)" maxLength={400} placeholder="https://..."
              ayuda="Si lo dejas vacío, el encabezado muestra el nombre en texto."
              value={form.logo_url} onChange={cambiar("logo_url")} />
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
            <Campo id="cfg-maps" etiqueta="Enlace de Google Maps" maxLength={400} placeholder="https://..."
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
            className="rounded-full bg-berry px-6 py-2.5 font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar configuración"}
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

      {puedeEditar && (
        <form onSubmit={probarCorreo} className="glass max-w-md space-y-3 rounded-3xl p-6 shadow-glass sm:p-8">
          <h2 className="text-lg font-semibold text-plum">Probar envío de correo</h2>
          <p className="text-sm text-plum-soft">
            Manda un correo de prueba real con la configuración de Resend del backend, para confirmar
            que la recuperación de contraseña realmente llega.
          </p>
          <input
            type="email"
            placeholder="Correo donde recibir la prueba"
            required
            maxLength={120}
            value={correoPrueba}
            onChange={(e) => setCorreoPrueba(e.target.value)}
            className={claseInput}
          />
          <button
            type="submit"
            disabled={probando}
            className="rounded-full bg-white/70 px-6 py-2.5 text-sm font-semibold text-plum shadow-glass transition hover:bg-white disabled:opacity-60"
          >
            {probando ? "Enviando..." : "Enviar correo de prueba"}
          </button>
          {resultadoPrueba && (
            <p className={`text-sm ${resultadoPrueba.ok ? "text-berry-dark" : "text-red-600"}`}>
              {resultadoPrueba.ok ? "✅ " : "❌ "}
              {resultadoPrueba.texto}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
