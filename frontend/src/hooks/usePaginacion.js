import { useEffect, useState } from "react";

// Paginación en el cliente para listas que el backend devuelve completas.
export function usePaginacion(lista, porPagina = 10) {
  const [pagina, setPagina] = useState(1);
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  // Si la lista se achica (filtro, borrar un ítem), no quedarse en una página vacía
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [pagina, totalPaginas]);

  const actual = Math.min(pagina, totalPaginas);
  const items = lista.slice((actual - 1) * porPagina, actual * porPagina);

  return { items, pagina: actual, setPagina, total, porPagina };
}
