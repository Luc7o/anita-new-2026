import Link from "next/link";

export default function NoEncontrada() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-5xl font-bold">No encontramos esta página</p>
      <p className="mt-4 text-plum-soft">Puede que el producto ya no esté disponible.</p>
      <Link href="/tienda" className="btn-primary mt-8 inline-flex px-6">Ir a la tienda</Link>
    </div>
  );
}
