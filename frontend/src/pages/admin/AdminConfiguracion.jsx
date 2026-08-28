import React, { useState } from "react";
import { api } from "../../api/client.js";

export default function AdminConfiguracion() {
  const [correoPrueba, setCorreoPrueba] = useState("");
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState(null); // { ok, texto }

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
      <h1 className="mb-6 text-2xl font-semibold text-plum">Configuración</h1>

      <form onSubmit={probarCorreo} className="glass max-w-md space-y-3 rounded-3xl p-6 shadow-glass sm:p-8">
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
