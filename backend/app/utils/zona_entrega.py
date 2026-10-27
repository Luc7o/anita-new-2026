"""
Zona de delivery de Anita New Style: por ahora SOLO Huancayo (Junín).

Es la única fuente de verdad de a dónde se entrega. La usan:
  - el checkout (rechaza un delivery fuera de la zona, aunque alguien
    manipule lo que manda el navegador), y
  - el catálogo público de ubicaciones (solo ofrece Junín > Huancayo y los
    distritos de esa provincia).

Si algún día se amplía la zona, este es el único archivo que hay que tocar.
"""
import unicodedata

DEPARTAMENTO_ENTREGA = "JUNIN"
PROVINCIA_ENTREGA = "HUANCAYO"

MENSAJE_FUERA_DE_ZONA = (
    "Por ahora el delivery solo está disponible en Huancayo. "
    "Puedes elegir recojo en tienda."
)


def _norm(texto):
    """Mayúsculas y sin tildes, para comparar 'Junín' con 'JUNIN'."""
    sin_tildes = unicodedata.normalize("NFKD", texto or "")
    sin_tildes = "".join(c for c in sin_tildes if not unicodedata.combining(c))
    return sin_tildes.strip().upper()


def departamento_entrega():
    from app.models import UbigeoDepartamento

    for d in UbigeoDepartamento.query.all():
        if _norm(d.nombre) == DEPARTAMENTO_ENTREGA:
            return d
    return None


def provincia_entrega():
    from app.models import UbigeoProvincia

    dep = departamento_entrega()
    if dep is None:
        return None
    for p in UbigeoProvincia.query.filter_by(departamento_id=dep.id).all():
        if _norm(p.nombre) == PROVINCIA_ENTREGA:
            return p
    return None


def distritos_entrega():
    """Distritos de la provincia de entrega, ordenados por nombre."""
    from app.models import UbigeoDistrito

    prov = provincia_entrega()
    if prov is None:
        return []
    return (
        UbigeoDistrito.query.filter_by(provincia_id=prov.id)
        .order_by(UbigeoDistrito.nombre)
        .all()
    )


def distrito_de_entrega(nombre_distrito, distrito_id=None):
    """
    El distrito (de la zona de entrega) que corresponde a lo que mandó el
    cliente, o None si no está en la zona. Si viene distrito_id, debe ser de
    la zona y coincidir con el nombre.
    """
    nombre = _norm(nombre_distrito)
    for d in distritos_entrega():
        if _norm(d.nombre) != nombre:
            continue
        if isinstance(distrito_id, int) and distrito_id != d.id:
            return None
        return d
    return None
