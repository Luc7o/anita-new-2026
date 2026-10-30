/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Estos colores leen variables CSS (ver styles/theme.css). En la tienda y
        // en el modo claro valen lo de siempre; el admin en modo oscuro las cambia.
        ivory: "rgb(var(--c-ivory) / <alpha-value>)",
        lilac: "rgb(var(--c-lilac) / <alpha-value>)",
        // Color fijo de la cabecera del admin (vino oscuro; no se invierte).
        chrome: "rgb(var(--c-chrome) / <alpha-value>)",
        plum: {
          DEFAULT: "rgb(var(--c-plum) / <alpha-value>)",
          soft: "rgb(var(--c-plum-soft) / <alpha-value>)",
        },
        berry: {
          DEFAULT: "#C42759",
          dark: "#550416",
          light: "#E58AA6",
        },
        gold: {
          DEFAULT: "#ABABAB",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"DM Serif Display"', "Georgia", "serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(85, 4, 22, 0.14)",
        "glass-lg": "0 12px 48px 0 rgba(85, 4, 22, 0.22)",
        pop: "0 12px 32px -8px rgba(44, 1, 7, 0.35)",
      },
      borderRadius: {
        "3xl": "1.75rem",
      },
      // Animaciones de la tienda. Las de ENTRADA usan fill-mode "backwards" (no
      // "both"): así, al terminar, el elemento vuelve a su estilo normal y no
      // queda con un `transform` pegado (un transform residual crearía un
      // "containing block" que rompe elementos position:fixed/sticky hijos).
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "slide-in-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out backwards",
        "fade-out": "fade-out 0.22s ease-in forwards",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards",
        "scale-in": "scale-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) backwards",
        "slide-in-right": "slide-in-right 0.32s cubic-bezier(0.22, 1, 0.36, 1) backwards",
        "slide-out-right": "slide-out-right 0.22s ease-in forwards",
        "slide-in-up": "slide-in-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) backwards",
        pop: "pop 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
