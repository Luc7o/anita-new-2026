import Link from "next/link";

// Maqueta de las páginas informativas (como frontend/src/pages/PaginaInfo.jsx).
export function PaginaInfo({ titulo, volver = "/", children }: { titulo: string; volver?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Link href={volver} className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-plum-soft transition hover:text-plum">
        <span aria-hidden="true">&larr;</span>
        Volver
      </Link>
      <div className="rounded-2xl border border-plum/10 bg-white p-6 sm:p-10">
        <h1 className="mb-6 text-2xl font-bold text-plum sm:text-3xl">{titulo}</h1>
        <div className="text-plum-soft">{children}</div>
      </div>
    </div>
  );
}

/** Bloque con título de las páginas legales. */
export function SeccionLegal({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-plum">{titulo}</h2>
      {children}
    </section>
  );
}

export function Tarjeta({ titulo, children, nota }: { titulo: string; children: React.ReactNode; nota?: string }) {
  return (
    <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
      <h3 className="font-semibold text-plum">{titulo}</h3>
      <div className="mt-1 text-sm text-plum-soft">{children}</div>
      {nota && <p className="text-xs text-plum-soft/70">{nota}</p>}
    </div>
  );
}
