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
    },
  },
  plugins: [],
};
