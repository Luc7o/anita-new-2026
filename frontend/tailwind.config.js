/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FBF7F3",
        lilac: "#F1E9F7",
        plum: {
          DEFAULT: "#2B1E29",
          soft: "#5A4756",
        },
        berry: {
          DEFAULT: "#A53694",
          dark: "#76266A",
          light: "#CA8AC0",
        },
        gold: {
          DEFAULT: "#C9A227",
          soft: "#E4C765",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Manrope'", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(140, 47, 91, 0.12)",
        "glass-lg": "0 12px 48px 0 rgba(140, 47, 91, 0.18)",
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
