import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Las librerías casi no cambian entre despliegues: en un archivo
        // aparte el navegador las conserva en caché aunque el código de la
        // tienda se actualice.
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
        // Carpeta "r2": todos los archivos estrenan URL. Hasta ahora vercel.json mandaba
        // "guardar un año, inmutable" también en las respuestas 404 de /assets: si un archivo
        // faltó un momento durante un despliegue, el navegador guardó ese 404 por un año y la
        // tienda quedaba en blanco para esa persona aunque el archivo ya existiera. Con URLs
        // nuevas esos 404 guardados ya no se usan. Si alguna vez vuelve a pasar, sube el número.
        entryFileNames: "assets/r2/[name]-[hash].js",
        chunkFileNames: "assets/r2/[name]-[hash].js",
        assetFileNames: "assets/r2/[name]-[hash][extname]",
      },
    },
  },
  server: {
    port: 5173,
  },
});
