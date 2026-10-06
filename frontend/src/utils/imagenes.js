// Deduce la URL de una versión liviana (thumb / med / lg) a partir de la URL
// original guardada en la base de datos. El backend sube cada versión junto
// al original con el mismo nombre + sufijo, en WebP:
//   .../abc.png  ->  .../abc_thumb.webp
// Solo aplica a imágenes alojadas en Vercel Blob; cualquier otra URL (assets
// locales, enlaces externos) se devuelve igual.
export function urlVariante(url, variante) {
  if (!url || !url.includes("blob.vercel-storage.com")) return url;
  return url.replace(/\.[A-Za-z0-9]+(\?.*)?$/, `_${variante}.webp`);
}
