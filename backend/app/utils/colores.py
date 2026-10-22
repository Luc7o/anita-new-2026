"""
Nombres y códigos de color. El nombre se guarda con la primera letra en
mayúscula ("Negro", "Azul marino") y, si es un color conocido, con su código
hexadecimal. La tienda pinta los círculos de color con su propio mapa (el de
frontend/src/utils/colores.js): si agregas un color aquí, agrégalo también allá.
"""

HEX_POR_COLOR = {
    "negro": "#171717", "blanco": "#FFFFFF", "rojo": "#DC2626", "guindo": "#7C1D2E",
    "vino": "#7C1D2E", "borgoña": "#800020", "borgona": "#800020",
    "azul": "#2563EB", "azul marino": "#1E3A8A", "azul rey": "#1D4ED8",
    "verde": "#16A34A", "verde militar": "#4D5C36", "verde olivo": "#6B7A3A",
    "amarillo": "#EAB308", "mostaza": "#CA9A2E", "naranja": "#EA580C",
    "rosa": "#EC4899", "rosa palo": "#D8A6A6", "morado": "#9333EA", "violeta": "#7C3AED",
    "gris": "#6B7280", "gris claro": "#D1D5DB", "gris oscuro": "#4B5563",
    "beige": "#D6C7A1", "marron": "#78350F", "marrón": "#78350F", "café": "#6F4E37",
    "camel": "#C19A6B", "chocolate": "#4B2E1E", "celeste": "#38BDF8", "turquesa": "#14B8A6",
    "dorado": "#CA8A04", "plateado": "#9CA3AF", "crema": "#FDF6E3", "fucsia": "#DB2777",
    "lila": "#C4B5FD", "coral": "#FF6F61", "khaki": "#8B8355", "caqui": "#8B8355",
    "ocre": "#B5651D",
}


def normalizar_nombre_color(nombre):
    """Sin espacios de más y con la primera letra en mayúscula. El nombre vacío
    se respeta: es el marcador de "este producto no varía por color"."""
    nombre = " ".join((nombre or "").split())
    return nombre[:1].upper() + nombre[1:]


def hex_de_color(nombre):
    return HEX_POR_COLOR.get((nombre or "").strip().lower())
