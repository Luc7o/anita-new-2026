// Las cuentas creadas solo con el correo reciben un nombre provisional
// ("Cliente 3FA9"). Estas ayudas permiten no mostrarlo ni usarlo como si
// fuera un dato real de la persona.
export function esNombreProvisional(usuario) {
  return Boolean(
    usuario?.es_invitado && /^Cliente [0-9A-F]{4}$/.test(usuario?.nombre || "")
  );
}

// Lo que se muestra como "nombre" en la interfaz: el correo si el nombre es
// provisional, o el nombre completo si ya dio sus datos reales.
export function nombreVisible(usuario) {
  if (!usuario) return "";
  return esNombreProvisional(usuario) ? usuario.email : usuario.nombre_completo;
}
