"""
Version vigente de los Terminos y Condiciones y de la Politica de Privacidad.

Se guarda en usuarios.version_terminos al aceptar. CAMBIALA cada vez que se modifique
el texto de esas dos paginas (frontend/src/pages/TerminosCondiciones.jsx y
PoliticaPrivacidad.jsx; su constante gemela es VERSION_TERMINOS en frontend/src/legal.js)
para saber que version vio cada persona.
"""

VERSION_TERMINOS = "2026-11"

# Versión del consentimiento de ESTADÍSTICAS DE USO (banner de privacidad). Cámbiala cuando
# cambie qué datos se miden, para qué o por cuánto tiempo: a quien aceptó una versión
# anterior se le vuelve a preguntar. Su gemela en el frontend es VERSION_CONSENTIMIENTO
# (frontend/src/legal.js).
VERSION_CONSENTIMIENTO = "2026-11"