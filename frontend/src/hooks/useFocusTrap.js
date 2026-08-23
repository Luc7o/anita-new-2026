import { useEffect, useRef } from "react";

const SELECTOR_ENFOCABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hook de accesibilidad para diálogos/modales (carrito, formularios en
 * modal, etc.). Mientras `abierto` es true:
 *   - Atrapa el foco dentro del contenedor (Tab/Shift+Tab no se escapan).
 *   - Cierra el diálogo con Escape.
 *   - Al abrir, enfoca el primer elemento enfocable del diálogo.
 *   - Al cerrar, devuelve el foco al elemento que lo abrió (el botón que
 *     el usuario presionó), en vez de dejarlo perdido en el body.
 *
 * Uso:
 *   const refDialogo = useFocusTrap(abierto, cerrar);
 *   <div ref={refDialogo} role="dialog" aria-modal="true" aria-labelledby="titulo-id">
 */
export function useFocusTrap(abierto, cerrar) {
  const refContenedor = useRef(null);
  const refElementoPrevio = useRef(null);

  useEffect(() => {
    if (!abierto) return;

    // Guarda qué elemento tenía el foco antes de abrir, para devolvérselo al cerrar.
    refElementoPrevio.current = document.activeElement;

    const contenedor = refContenedor.current;
    if (!contenedor) return;

    const enfocables = () =>
      Array.from(contenedor.querySelectorAll(SELECTOR_ENFOCABLE)).filter(
        (el) => el.offsetParent !== null
      );

    const primerElemento = enfocables()[0];
    (primerElemento || contenedor).focus();

    const alPresionarTecla = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cerrar();
        return;
      }
      if (e.key !== "Tab") return;

      const elementos = enfocables();
      if (elementos.length === 0) return;
      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      refElementoPrevio.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  return refContenedor;
}
