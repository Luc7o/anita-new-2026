import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ThemeToggler } from "@animate-ui/react/primitives/effects/theme-toggler";
import { AnimateIcon } from "@animate-ui/react/icons";
import { IconMoon, IconSun } from "./Icons.jsx";
import useTemaTienda from "../hooks/useTemaTienda.js";

// Botón de modo claro/oscuro de la tienda. ThemeToggler (Animate UI) hace el barrido:
// el tema nuevo entra de izquierda a derecha sobre la página (View Transitions). Con
// "reducir movimiento" activado en el sistema, el cambio es inmediato.
export default function BotonTema({ className = "" }) {
  const { tema, resuelto, setTema } = useTemaTienda();

  return (
    <ThemeToggler theme={tema} resolvedTheme={resuelto} setTheme={setTema} direction="ltr">
      {({ resolved, toggleTheme }) => {
        const oscuro = resolved === "dark";
        return (
          <AnimateIcon animateOnHover animateOnTap asChild>
            <button
              type="button"
              onClick={() => toggleTheme(oscuro ? "light" : "dark")}
              aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={oscuro ? "Modo claro" : "Modo oscuro"}
              className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-plum/15 bg-white text-plum transition-colors hover:border-berry hover:text-berry ${className}`}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={oscuro ? "sol" : "luna"}
                  initial={{ y: 18, rotate: -90, opacity: 0 }}
                  animate={{ y: 0, rotate: 0, opacity: 1 }}
                  exit={{ y: -18, rotate: 90, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="flex"
                >
                  {oscuro ? <IconSun size={18} /> : <IconMoon size={18} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </AnimateIcon>
        );
      }}
    </ThemeToggler>
  );
}
