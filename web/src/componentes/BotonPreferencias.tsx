"use client";

import { abrirPreferencias } from "@/lib/consentimiento";

export function BotonPreferencias({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={abrirPreferencias} className={className}>
      Preferencias de privacidad
    </button>
  );
}
