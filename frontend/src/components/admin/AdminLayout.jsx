import { rutaAdmin, TIENDA_URL } from "../../lib/appMode.js";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Logo from "../Logo.jsx";
import {
  IconDashboard, IconBag, IconTag, IconPackage, IconStore, IconLogout, IconTruck, IconUsers, IconSettings,
  IconCart, IconGift, IconBook, IconUser, IconSun, IconMoon, IconReport, IconWarehouse, IconReceipt,
} from "../Icons.jsx";
import useTemaAdmin from "../../hooks/useTemaAdmin.js";
import useReducirMovimiento from "../../hooks/useReducirMovimiento.js";
import {
  PUEDE_VER_PRODUCTOS, PUEDE_GESTIONAR_CATEGORIAS, PUEDE_VER_PEDIDOS, PUEDE_REGISTRAR_VENTA, PUEDE_VER_INICIO, PUEDE_VER_PROVEEDORES,
  PUEDE_GESTIONAR_USUARIOS, PUEDE_VER_CONFIGURACION, PUEDE_VER_PROMOCIONES, PUEDE_VER_RECLAMACIONES, PUEDE_VER_COMPRAS, PUEDE_VER_ALMACEN,
  CAJERO, PUEDE_VER_RECOJOS, PUEDE_VER_REPORTES,
} from "../../roles.js";

// El menú va agrupado por sección (antes eran 14 opciones seguidas): cada grupo muestra su
// título solo si el rol ve al menos una de sus opciones.
const TODOS_LOS_ITEMS = [
  { to: rutaAdmin(), label: "Dashboard", Icon: IconDashboard, exact: true, roles: PUEDE_VER_INICIO, grupo: "General" },
  { to: rutaAdmin("/pedidos"), label: "Pedidos", Icon: IconPackage, exact: true, roles: PUEDE_VER_PEDIDOS, grupo: "Ventas" },
  { to: rutaAdmin("/pedidos/nueva-venta"), label: "Nueva venta", Icon: IconCart, roles: PUEDE_REGISTRAR_VENTA, grupo: "Ventas" },
  { to: rutaAdmin("/pedidos/recojos"), label: "Recojos en tienda", Icon: IconStore, roles: PUEDE_VER_RECOJOS, grupo: "Ventas" },
  { to: rutaAdmin("/reclamaciones"), label: "Reclamaciones", Icon: IconBook, roles: PUEDE_VER_RECLAMACIONES, grupo: "Ventas" },
  { to: rutaAdmin("/productos"), label: "Productos", Icon: IconBag, roles: PUEDE_VER_PRODUCTOS, grupo: "Catálogo" },
  { to: rutaAdmin("/categorias"), label: "Categorías", Icon: IconTag, roles: PUEDE_GESTIONAR_CATEGORIAS, grupo: "Catálogo" },
  { to: rutaAdmin("/promociones"), label: "Promociones", Icon: IconGift, roles: PUEDE_VER_PROMOCIONES, grupo: "Catálogo" },
  { to: rutaAdmin("/almacen"), label: "Almacén", Icon: IconWarehouse, roles: PUEDE_VER_ALMACEN, grupo: "Inventario" },
  { to: rutaAdmin("/compras"), label: "Compras", Icon: IconReceipt, roles: PUEDE_VER_COMPRAS, grupo: "Inventario" },
  { to: rutaAdmin("/proveedores"), label: "Proveedores", Icon: IconTruck, roles: PUEDE_VER_PROVEEDORES, grupo: "Inventario" },
  { to: rutaAdmin("/reportes"), label: "Reportes", Icon: IconReport, roles: PUEDE_VER_REPORTES, grupo: "Sistema" },
  { to: rutaAdmin("/usuarios"), label: "Usuarios y roles", Icon: IconUsers, roles: PUEDE_GESTIONAR_USUARIOS, grupo: "Sistema" },
  { to: rutaAdmin("/configuracion"), label: "Configuración", Icon: IconSettings, roles: PUEDE_VER_CONFIGURACION, grupo: "Sistema" },
];

// Qué opción del menú corresponde a la ruta actual: la de ruta más larga que coincida
// (así "/pedidos/nueva-venta" marca "Nueva venta" y "/pedidos/123" marca "Pedidos").
// Devuelve -1 si ninguna coincide.
function indiceActivo(items, ruta) {
  const raiz = rutaAdmin();
  let mejor = -1;
  let largo = -1;
  items.forEach((it, i) => {
    const coincide =
      it.to === raiz ? ruta === it.to || ruta === `${it.to}/` : ruta === it.to || ruta.startsWith(`${it.to}/`);
    if (coincide && it.to.length > largo) {
      mejor = i;
      largo = it.to.length;
    }
  });
  return mejor;
}

function TiendaLink() {
  const clases =
    "ml-2 flex items-center gap-2 rounded-[10px] border border-white/25 px-3 py-2 text-sm font-medium text-white hover:bg-white/10";
  const contenido = (
    <>
      <IconStore size={16} />
      <span className="hidden sm:inline">Ver tienda</span>
    </>
  );
  return (
    <a href={TIENDA_URL} target="_blank" rel="noopener noreferrer" className={clases} title="Abrir la tienda">
      {contenido}
    </a>
  );
}

export default function AdminLayout() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { tema, alternar } = useTemaAdmin();

  // Cambiar de cuenta = cerrar la sesión actual y quedar en el login para entrar con otra.
  const cambiarDeCuenta = () => {
    logout();
    navigate("/login", { replace: true });
  };
  const items = TODOS_LOS_ITEMS.filter((item) => !item.roles || item.roles.includes(usuario?.rol));
  const activo = indiceActivo(items, location.pathname);
  const reducir = useReducirMovimiento();
  const fecha = useMemo(
    () => new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" }),
    [],
  );

  // Indicador que se desliza hasta la opción activa del menú lateral.
  const botonesMenu = useRef([]);
  const [marca, setMarca] = useState(null);
  useLayoutEffect(() => {
    const medir = () => {
      const el = botonesMenu.current[activo];
      if (!el) {
        setMarca(null);
        return;
      }
      setMarca((previa) => ({ y: el.offsetTop, h: el.offsetHeight, anima: previa !== null }));
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [activo, items.length]);

  // Antes cada clic del menú esperaba 150 ms para una animación de salida: en una herramienta
  // de trabajo eso solo retrasa. Ahora se navega al instante y la sección nueva entra con un
  // fundido corto (ver .adm-page en admin-motion.css).

  // Modo oscuro: un círculo oscuro nace en el botón de la luna y crece hasta cubrir la pantalla.
  // Al volver a modo claro solo hay un fundido suave. Si el navegador no soporta View Transitions
  // (o la persona pidió menos movimiento), el cambio es directo.
  const cambiarTema = (e) => {
    const html = document.documentElement;
    if (!document.startViewTransition || reducir) {
      alternar();
      return;
    }
    const haciaOscuro = tema !== "oscuro";
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    if (haciaOscuro) html.classList.add("adm-circulo");
    const transicion = document.startViewTransition(() => {
      flushSync(() => alternar());
      html.classList.toggle("admin-dark", haciaOscuro);
    });
    transicion.ready
      .then(() => {
        if (!haciaOscuro) return;
        html.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
          { duration: 750, easing: "cubic-bezier(.7,0,.3,1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {});
    transicion.finished.catch(() => {}).then(() => html.classList.remove("adm-circulo"));
  };

  return (
    <div className="admin-ui admin-pagina flex min-h-screen flex-col">
      {/* Cabecera oscura fija (estructura de Malhu). Su alto total (contenido + borde) es
          --admin-header-h, que usan la barra lateral y las pestañas para pegarse justo debajo. */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-chrome">
        <div className="flex h-[calc(var(--admin-header-h)-1px)] items-center gap-3 px-4">
          <Link to={rutaAdmin()} aria-label="Panel de administración">
            <Logo tone="light" />
          </Link>
          <span className="rounded-sm bg-white/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white/80">
            {usuario?.rol === CAJERO ? "Cajero" : "Admin"}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <span className="hidden max-w-48 truncate text-sm font-semibold text-white sm:inline">
              {usuario?.rol_label}
            </span>
            {/* En el subdominio del admin no hay tienda propia: el botón solo
                aparece si se definió VITE_TIENDA_URL, y abre la tienda aparte. */}
            <button
              type="button"
              onClick={cambiarTema}
              className="flex h-11 w-11 items-center justify-center rounded-[10px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={tema === "oscuro" ? "Activar modo claro" : "Activar modo oscuro"}
              title={tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
            >
              {tema === "oscuro" ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
            {TIENDA_URL && (
              <TiendaLink />
            )}
            <button
              onClick={logout}
              className="rounded-[10px] p-2.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <IconLogout size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Barra lateral (pantallas grandes): ocupa todo el lado izquierdo, bajo la cabecera */}
        <aside className="sticky top-(--admin-header-h) hidden h-[calc(100dvh-var(--admin-header-h))] w-60 shrink-0 flex-col overflow-y-auto bg-carbon text-white lg:flex">
          <nav className="relative flex flex-1 flex-col gap-1 p-3" aria-label="Administración">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 right-3 top-0 rounded-[10px] bg-white"
              style={{
                height: marca?.h ?? 0,
                transform: `translateY(${marca?.y ?? 0}px)`,
                opacity: marca ? 1 : 0,
                transition: marca?.anima
                  ? "transform .35s cubic-bezier(.25,1,.5,1), height .3s"
                  : "none",
              }}
            />
            {items.map((item, i) => (
              <React.Fragment key={item.to}>
                {(i === 0 || items[i - 1].grupo !== item.grupo) && (
                  <span className={`px-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/55 ${i === 0 ? "pt-1" : "pt-4"} pb-1`}>
                    {item.grupo}
                  </span>
                )}
                <NavLink
                  ref={(el) => {
                    botonesMenu.current[i] = el;
                  }}
                  to={item.to}
                  end={item.exact}
                  className={`relative z-10 flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    i === activo ? "text-carbon" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.Icon size={18} />
                  {item.label}
                </NavLink>
              </React.Fragment>
            ))}
          </nav>

          {/* Cuenta: al final de la barra lateral */}
          <div className="border-t border-white/10 p-3">
            <div className="mb-2 px-3.5">
              <p className="truncate text-sm font-semibold text-white">
                {[usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ") || usuario?.email}
              </p>
              <p className="truncate text-xs text-white/60">{usuario?.rol_label}</p>
            </div>
            <button
              type="button"
              onClick={cambiarDeCuenta}
              className="flex w-full items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <IconUser size={18} />
              Cambiar de cuenta
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold text-[#e9a6dd] transition-colors hover:bg-white/10"
            >
              <IconLogout size={18} />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Pestañas horizontales (celular y tablet), donde no cabe la barra lateral */}
          <div className="sticky top-(--admin-header-h) z-30 border-b border-plum/10 bg-white lg:hidden">
            <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4" aria-label="Administración">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? "border-plum text-plum"
                        : "border-transparent text-plum-soft hover:text-plum"
                    }`
                  }
                >
                  <item.Icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            {/* key: al cambiar de sección el contenido se vuelve a montar y entra en cascada */}
            <div key={location.pathname} className="adm-page">
              <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-plum-soft">
                <span className="glass rounded-full px-3 py-1.5">
                  <span className="font-semibold text-plum">Anita</span> › {items[activo]?.label ?? "Panel"}
                </span>
                <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  <span className="first-letter:uppercase">{fecha}</span>
                </span>
              </div>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
