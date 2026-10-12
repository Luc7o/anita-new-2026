// Datos de la empresa en UN solo lugar. Completa lo que falte: las páginas
// (Quiénes somos, Tiendas, Mayoristas, Trabaja con nosotros) solo muestran
// un dato si aquí tiene valor, así nunca se publica algo vacío o falso.
export const EMPRESA = {
  nombre: "Anita New Style",
  ciudad: "Huancayo",

  // Tienda física
  direccion: "",        // ej: "Jr. Cajamarca 214, Huancayo"
  referencia: "",       // ej: "A media cuadra de la Plaza Constitución"
  horario: "Lunes a sábado de 10:00 a.m. a 8:00 p.m.",
  telefono: "",         // ej: "(064) 123456"
  mapsUrl: "",          // link de Google Maps de la tienda (opcional)

  // Correos (déjalos vacíos si todavía no existen)
  correoContacto: "",   // ej: "contacto@tudominio.com"
  correoMayoristas: "", // ej: "mayoristas@tudominio.com"
  correoEmpleo: "",     // ej: "rrhh@tudominio.com"

  // Redes sociales (links completos)
  facebook: "https://www.facebook.com/anitanewstyle",
  instagram: "",
  tiktok: "",

  // Mayoristas (déjalo vacío si lo coordinan caso por caso)
  mayoristaMinimo: "",  // ej: "S/ 500"
};
