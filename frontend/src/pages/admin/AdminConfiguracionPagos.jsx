import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { IconUpload } from "../../components/Icons.jsx";
import { soloTexto, soloNumeros } from "../../validacion.js";

export default function AdminConfiguracionPagos() {
  const [form, setForm] = useState({ yape_numero: "", yape_titular: "", yape_qr_url: "" });
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [correoPrueba, setCorreoPrueba] = useState("");
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState(null); // { ok, texto }

  useEffect(() => {
    api.adminConfigPagos().then((data) =>
      setForm({
        yape_numero: data.yape_numero || "",
        yape_titular: data.yape_titular || "",
        yape_qr_url: data.yape_qr_url || "",
      })
    );
  }, []);

  const actualizarCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const actualizarNumeroYape = (e) => setForm({ ...form, yape_numero: soloNumeros(e.target.value) });
  const actualizarTitularYape = (e) => setForm({ ...form, yape_titular: soloTexto(e.target.value) });

  const subirQr = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    setError("");
    try {
      const { url } = await api.adminSubirQrPago(archivo);
      setForm((f) => ({ ...f, yape_qr_url: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setGuardando(true);
    try {
      await api.adminActualizarConfigPagos(form);
      setMensaje("Datos de Yape actualizados correctamente.");
    } catch (err) {
      setError(err.message);
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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-plum">Configuración de pagos</h1>

      <form onSubmit={guardar} className="glass max-w-md space-y-4 rounded-3xl p-6 shadow-glass sm:p-8">
        <h2 className="text-lg font-semibold text-plum">Yape</h2>
        <p className="text-sm text-plum-soft">
          Esto es lo que verán tus clientes en el checkout cuando elijan pagar con Yape.
        </p>

        <div className="flex items-center gap-4">
          {form.yape_qr_url ? (
            <img src={form.yape_qr_url} alt="QR de Yape" className="h-24 w-24 rounded-xl object-cover shadow-glass" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white/60 text-plum-soft shadow-glass">
              <IconUpload size={20} />
            </div>
          )}
          <label className="glass flex-1 cursor-pointer rounded-2xl px-4 py-2.5 text-center text-sm text-plum shadow-glass hover:bg-white">
            {subiendo ? "Subiendo..." : "Subir QR de Yape"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={subirQr}
              disabled={subiendo}
              className="hidden"
            />
          </label>
        </div>

        <input
          placeholder="Número de Yape"
          inputMode="numeric"
          maxLength={9}
          value={form.yape_numero}
          onChange={actualizarNumeroYape}
          className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
        />
        <input
          placeholder="Nombre del titular"
          maxLength={120}
          value={form.yape_titular}
          onChange={actualizarTitularYape}
          className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
        />

        {error && <p className="text-sm text-berry-dark">{error}</p>}
        {mensaje && <p className="text-sm text-berry-dark">{mensaje}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      <form onSubmit={probarCorreo} className="glass mt-6 max-w-md space-y-3 rounded-3xl p-6 shadow-glass sm:p-8">
        <h2 className="text-lg font-semibold text-plum">Probar envío de correo</h2>
        <p className="text-sm text-plum-soft">
          Manda un correo de prueba real con la configuración SMTP de tu <code>.env</code> del
          backend, para confirmar que la recuperación de contraseña realmente llega.
        </p>
        <input
          type="email"
          placeholder="Correo donde recibir la prueba"
          required
          maxLength={120}
          value={correoPrueba}
          onChange={(e) => setCorreoPrueba(e.target.value)}
          className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
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
    </div>
  );
}
