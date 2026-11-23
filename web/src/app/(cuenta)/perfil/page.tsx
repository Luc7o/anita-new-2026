import type { Metadata } from "next";
import { VistaPerfil } from "./VistaPerfil";

export const metadata: Metadata = { title: "Mi cuenta" };

export default function PaginaPerfil() {
  return <VistaPerfil />;
}
