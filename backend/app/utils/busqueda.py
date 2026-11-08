from sqlalchemy import func


def contiene(columna, patron, escape=None):
    """Búsqueda de texto que ignora mayúsculas Y tildes ("polera" encuentra "Pólera").

    En MySQL eso lo hacía solo la colación de la base. En PostgreSQL hay que pedirlo:
    ilike ignora mayúsculas y la extensión unaccent quita las tildes."""
    return func.unaccent(columna).ilike(func.unaccent(patron), escape=escape)
