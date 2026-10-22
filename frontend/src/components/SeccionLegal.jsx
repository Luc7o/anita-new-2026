import React from "react";

// Bloque con título para las páginas legales (términos y política de privacidad).
export default function SeccionLegal({ titulo, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-plum">{titulo}</h2>
      {children}
    </section>
  );
}
