const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("ans_token");
}
function getRefreshToken() {
  return localStorage.getItem("ans_refresh_token");
}
function setTokens(token, refreshToken) {
  localStorage.setItem("ans_token", token);
  if (refreshToken) localStorage.setItem("ans_refresh_token", refreshToken);
}
function clearTokens() {
  localStorage.removeItem("ans_token");
  localStorage.removeItem("ans_refresh_token");
}

// Cuando el refresh token también expiró (o no existe), no hay forma de
// recuperar la sesión sola: hay que avisarle a la app para que mande al
// usuario a loguearse de nuevo. AuthContext escucha este evento.
function notificarSesionExpirada() {
  clearTokens();
  window.dispatchEvent(new Event("ans:sesion-expirada"));
}

// Evita que, si varias llamadas fallan por token expirado casi al mismo
// tiempo, se disparen varios refrescos en paralelo — todas esperan el mismo.
let refrescoEnCurso = null;

async function refrescarAccessToken() {
  if (refrescoEnCurso) return refrescoEnCurso;

  refrescoEnCurso = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("Sin refresh token");

    const res = await fetch(`${BASE_URL}/auth/refrescar-token`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    if (!res.ok) throw new Error("El refresh token también expiró");

    const data = await res.json();
    setTokens(data.token, null);
    return data.token;
  })();

  try {
    return await refrescoEnCurso;
  } finally {
    refrescoEnCurso = null;
  }
}

// Wrapper de fetch para llamadas autenticadas: si el access token expiró
// (code "token_expirado"), pide uno nuevo con el refresh token UNA vez y
// reintenta la misma llamada. Si el refresh también falla, cierra la
// sesión localmente. Lo usan tanto `request()` (JSON) como las subidas de
// archivos (FormData) más abajo.
async function fetchAutenticado(url, construirInit) {
  let res = await fetch(url, construirInit(getToken()));

  if (res.status === 401) {
    const data = await res.clone().json().catch(() => null);
    if (data?.code === "token_expirado") {
      try {
        const nuevoToken = await refrescarAccessToken();
        res = await fetch(url, construirInit(nuevoToken));
      } catch {
        notificarSesionExpirada();
      }
    } else if (data?.code === "token_invalido") {
      notificarSesionExpirada();
    }
  }

  return res;
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const construirInit = (token) => ({
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const res = auth
    ? await fetchAutenticado(`${BASE_URL}${path}`, construirInit)
    : await fetch(`${BASE_URL}${path}`, construirInit());

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const mensaje = data?.error || "Ocurrió un error, intenta de nuevo.";
    throw new Error(mensaje);
  }
  return data;
}

// Para subidas multipart (comprobantes, imágenes) — misma lógica de
// refresco automático que request(), pero sin Content-Type manual porque
// el navegador arma el boundary del FormData.
async function subirArchivo(path, formData, mensajeError) {
  const construirInit = (token) => ({
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const res = await fetchAutenticado(`${BASE_URL}${path}`, construirInit);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || mensajeError);
  return data;
}

// Para descargar PDFs (boletas, reportes) — a diferencia de request(), la
// respuesta NO es JSON, así que arma su propio manejo de errores y dispara
// la descarga del blob directamente en el navegador.
async function descargarPdf(path, nombreArchivo) {
  const construirInit = (token) => ({
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const res = await fetchAutenticado(`${BASE_URL}${path}`, construirInit);

  if (!res.ok) {
    let mensaje = "No se pudo generar el PDF";
    try {
      const data = await res.json();
      mensaje = data?.error || mensaje;
    } catch {
      // La respuesta de error no vino en JSON — nos quedamos con el mensaje genérico.
    }
    throw new Error(mensaje);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(url);
}

export const api = {
  // Auth
  registro: (payload) => request("/auth/registro", { method: "POST", body: payload }),
  consultarDocumento: (tipo, numero) =>
    request(`/documentos/consultar?tipo=${encodeURIComponent(tipo)}&numero=${encodeURIComponent(numero)}`),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  perfil: () => request("/auth/perfil", { auth: true }),
  actualizarPerfil: (payload) =>
    request("/auth/perfil", { method: "PUT", body: payload, auth: true }),
  cambiarPassword: (payload) =>
    request("/auth/cambiar-password", { method: "PUT", body: payload, auth: true }),
  olvidePassword: (email) => request("/auth/olvide-password", { method: "POST", body: { email } }),
  restablecerPassword: (payload) =>
    request("/auth/restablecer-password", { method: "POST", body: payload }),

  // Catálogo
  categorias: () => request("/categorias"),
  productos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/productos${query ? `?${query}` : ""}`);
  },
  producto: (id) => request(`/productos/${id}`),
  resenas: (productoId) => request(`/productos/${productoId}/resenas`),
  guardarResena: (productoId, payload) =>
    request(`/productos/${productoId}/resenas`, { method: "POST", body: payload, auth: true }),
  eliminarResena: (productoId) =>
    request(`/productos/${productoId}/resenas`, { method: "DELETE", auth: true }),

  // Favoritos
  favoritos: () => request("/favoritos", { auth: true }),
  favoritosIds: () => request("/favoritos/ids", { auth: true }),
  agregarFavorito: (productoId) =>
    request(`/favoritos/${productoId}`, { method: "POST", auth: true }),
  quitarFavorito: (productoId) =>
    request(`/favoritos/${productoId}`, { method: "DELETE", auth: true }),

  // Promociones (carrusel del inicio)
  promocionesActivas: () => request("/promociones/activas"),

  // Carrito
  verCarrito: () => request("/carrito", { auth: true }),
  agregarAlCarrito: (payload) =>
    request("/carrito/agregar", { method: "POST", body: payload, auth: true }),
  actualizarItemCarrito: (itemId, payload) =>
    request(`/carrito/${itemId}`, { method: "PUT", body: payload, auth: true }),
  eliminarItemCarrito: (itemId) =>
    request(`/carrito/${itemId}`, { method: "DELETE", auth: true }),

  // Pedidos
  checkout: (payload) => request("/pedidos/checkout", { method: "POST", body: payload, auth: true }),
  misPedidos: () => request("/pedidos", { auth: true }),
  pedido: (id) => request(`/pedidos/${id}`, { auth: true }),
  pagarPedido: (pedidoId, payload) =>
    request(`/pedidos/${pedidoId}/pagar`, { method: "POST", body: payload, auth: true }),
  cancelarPedido: (id) => request(`/pedidos/${id}/cancelar`, { method: "POST", auth: true }),
  boletaPedido: (id, numeroPedido) =>
    descargarPdf(`/pedidos/${id}/boleta`, `boleta-${numeroPedido}.pdf`),

  // Admin — productos
  adminProductos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/productos${query ? `?${query}` : ""}`, { auth: true });
  },
  adminProducto: (id) => request(`/admin/productos/${id}`, { auth: true }),
  adminCrearProducto: (payload) =>
    request("/admin/productos", { method: "POST", body: payload, auth: true }),
  adminActualizarProducto: (id, payload) =>
    request(`/admin/productos/${id}`, { method: "PUT", body: payload, auth: true }),
  adminEliminarProducto: (id) =>
    request(`/admin/productos/${id}`, { method: "DELETE", auth: true }),

  // Admin — categorías
  adminCategorias: () => request("/admin/categorias", { auth: true }),
  adminCrearCategoria: (payload) =>
    request("/admin/categorias", { method: "POST", body: payload, auth: true }),
  adminActualizarCategoria: (id, payload) =>
    request(`/admin/categorias/${id}`, { method: "PUT", body: payload, auth: true }),
  adminEliminarCategoria: (id) =>
    request(`/admin/categorias/${id}`, { method: "DELETE", auth: true }),

  // Admin — pedidos
  adminPedidos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/pedidos${query ? `?${query}` : ""}`, { auth: true });
  },
  adminPedido: (id) => request(`/admin/pedidos/${id}`, { auth: true }),
  adminCambiarEstadoPedido: (id, estado) =>
    request(`/admin/pedidos/${id}/estado`, { method: "PUT", body: { estado }, auth: true }),
  adminActualizarEnvio: (id, payload) =>
    request(`/admin/pedidos/${id}/envio`, { method: "PUT", body: payload, auth: true }),
  adminRevisarPago: (id, estado_pago) =>
    request(`/admin/pedidos/${id}/pago`, { method: "PUT", body: { estado_pago }, auth: true }),
  adminEstadisticas: () => request("/admin/pedidos/resumen/estadisticas", { auth: true }),
  adminBoletaPedido: (id, numeroPedido) =>
    descargarPdf(`/admin/pedidos/${id}/boleta`, `boleta-${numeroPedido}.pdf`),
  adminVentaPresencial: (payload) =>
    request("/admin/pedidos/venta-presencial", { method: "POST", body: payload, auth: true }),

  // Admin — reportes
  adminReporteVentas: (desde, hasta) => {
    const query = new URLSearchParams({ ...(desde && { desde }), ...(hasta && { hasta }) }).toString();
    const nombre = `reporte-ventas${desde ? `-${desde}` : ""}${hasta ? `-a-${hasta}` : ""}.pdf`;
    return descargarPdf(`/admin/reportes/ventas${query ? `?${query}` : ""}`, nombre);
  },

  // Admin — configuración
  adminProbarCorreo: (email) =>
    request("/admin/configuracion/probar-correo", { method: "POST", body: { email }, auth: true }),

  // Admin — proveedores
  adminProveedores: () => request("/admin/proveedores", { auth: true }),
  adminCrearProveedor: (payload) =>
    request("/admin/proveedores", { method: "POST", body: payload, auth: true }),
  adminActualizarProveedor: (id, payload) =>
    request(`/admin/proveedores/${id}`, { method: "PUT", body: payload, auth: true }),
  adminEliminarProveedor: (id) =>
    request(`/admin/proveedores/${id}`, { method: "DELETE", auth: true }),
  adminProveedor: (id) => request(`/admin/proveedores/${id}`, { auth: true }),
  adminAgregarProductoProveedor: (proveedorId, payload) =>
    request(`/admin/proveedores/${proveedorId}/productos`, { method: "POST", body: payload, auth: true }),
  adminActualizarProductoProveedor: (proveedorId, relacionId, payload) =>
    request(`/admin/proveedores/${proveedorId}/productos/${relacionId}`, {
      method: "PUT",
      body: payload,
      auth: true,
    }),
  adminQuitarProductoProveedor: (proveedorId, relacionId) =>
    request(`/admin/proveedores/${proveedorId}/productos/${relacionId}`, {
      method: "DELETE",
      auth: true,
    }),

  // Admin — usuarios y roles (solo superadmin)
  adminRolesDisponibles: () => request("/admin/usuarios/roles", { auth: true }),
  adminUsuarios: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/usuarios${query ? `?${query}` : ""}`, { auth: true });
  },
  adminCrearUsuarioStaff: (payload) =>
    request("/admin/usuarios", { method: "POST", body: payload, auth: true }),
  adminCambiarRol: (id, rol) =>
    request(`/admin/usuarios/${id}/rol`, { method: "PUT", body: { rol }, auth: true }),
  adminCambiarEstadoUsuario: (id, activo) =>
    request(`/admin/usuarios/${id}/estado`, { method: "PUT", body: { activo }, auth: true }),

  // Admin — subida de imagen de producto
  adminSubirImagenProducto: (archivo) => {
    const formData = new FormData();
    formData.append("imagen", archivo);
    return subirArchivo("/admin/uploads/producto-imagen", formData, "No se pudo subir la imagen");
  },

  // Admin — promociones de temporada
  adminPromociones: () => request("/admin/promociones", { auth: true }),
  adminCrearPromocion: (payload) =>
    request("/admin/promociones", { method: "POST", body: payload, auth: true }),
  adminActualizarPromocion: (id, payload) =>
    request(`/admin/promociones/${id}`, { method: "PUT", body: payload, auth: true }),
  adminEliminarPromocion: (id) =>
    request(`/admin/promociones/${id}`, { method: "DELETE", auth: true }),
  adminSubirImagenPromocion: (archivo) => {
    const formData = new FormData();
    formData.append("imagen", archivo);
    return subirArchivo("/admin/uploads/promocion-imagen", formData, "No se pudo subir la imagen");
  },
};

export { getToken, setTokens, clearTokens };
