import type { Metadata } from "next";
import { VistaFavoritos } from "./VistaFavoritos";

export const metadata: Metadata = { title: "Favoritos" };

export default function PaginaFavoritos() {
  return <VistaFavoritos />;
}
