"""
Roles del sistema y qué grupos de roles pueden hacer qué.
Todo el control de permisos del backend se apoya en este archivo.
"""

SUPERADMIN = "superadmin"
MODERADOR = "moderador"
EDITOR = "editor"
CLIENTE = "cliente"
SOPORTE = "soporte"
AUDITOR = "auditor"
# "invitado" no se guarda en BD: es cualquiera que navega sin sesión.

ROLES = {
    SUPERADMIN: "Super administrador",
    MODERADOR: "Moderador",
    EDITOR: "Editor / Creador",
    CLIENTE: "Cliente",
    SOPORTE: "Soporte",
    AUDITOR: "Auditor",
}

# Roles que tienen acceso al panel admin (aunque sea limitado)
ROLES_ADMIN = [SUPERADMIN, MODERADOR, EDITOR, SOPORTE, AUDITOR]

# Quién puede crear/editar/eliminar productos y categorías
PUEDE_GESTIONAR_PRODUCTOS = [SUPERADMIN, MODERADOR, EDITOR]
# Quién puede solo ver productos/categorías (además de quien los gestiona)
PUEDE_VER_PRODUCTOS = PUEDE_GESTIONAR_PRODUCTOS + [AUDITOR]

# Quién puede ver y cambiar el estado de los pedidos
PUEDE_GESTIONAR_PEDIDOS = [SUPERADMIN, MODERADOR, SOPORTE]
PUEDE_VER_PEDIDOS = PUEDE_GESTIONAR_PEDIDOS + [AUDITOR]

# Quién puede gestionar proveedores
PUEDE_GESTIONAR_PROVEEDORES = [SUPERADMIN, EDITOR]
PUEDE_VER_PROVEEDORES = PUEDE_GESTIONAR_PROVEEDORES + [MODERADOR, AUDITOR]

# Quién puede gestionar las promociones de temporada del inicio (dashboard)
PUEDE_GESTIONAR_PROMOCIONES = [SUPERADMIN, MODERADOR, EDITOR]
PUEDE_VER_PROMOCIONES = PUEDE_GESTIONAR_PROMOCIONES + [AUDITOR]

# Quién puede ver el dashboard de métricas
PUEDE_VER_DASHBOARD = ROLES_ADMIN

# Gestión de usuarios y roles: exclusivo de superadmin
PUEDE_GESTIONAR_USUARIOS = [SUPERADMIN]
