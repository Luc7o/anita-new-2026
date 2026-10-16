import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Datos de la tienda que edita el admin (GET /api/configuracion/tienda).
// Mientras carga, o si la petición falla, se devuelven valores vacíos: las
// páginas solo muestran un dato si tiene valor, así nunca se publica algo
// inventado. api.configuracionTienda() ya cachea 60 s, por lo que usar este
// hook en varios componentes a la vez no repite la consulta.
const VACIA = {
  nombre_comercial: "Anita New Style",
  logo_url: "", correo_contacto: "", telefono: "", whatsapp: "",
  direccion: "", referencia: "", ciudad: "", horario_atencion: "", maps_url: "",
  facebook_url: "", instagram_url: "", tiktok_url: "", moneda: "PEN",
};

export default function useConfigTienda() {
  const [config, setConfig] = useState(VACIA);
  useEffect(() => {
    let cancelado = false;
    api
      .configuracionTienda()
      .then((datos) => { if (!cancelado) setConfig({ ...VACIA, ...datos }); })
      .catch(() => {});
    return () => { cancelado = true; };
  }, []);
  return config;
}

// Link de wa.me a partir de lo que escribió el admin. Si son 9 dígitos
// (celular peruano sin código de país) se antepone 51. Devuelve null si el
// número no sirve, para ocultar el botón en vez de mostrar un link roto.
export function linkWhatsApp(numero) {
  const digitos = (numero || "").replace(/\D/g, "");
  if (digitos.length === 9) return `https://wa.me/51${digitos}`;
  if (digitos.length >= 11) return `https://wa.me/${digitos}`;
  return null;
}
