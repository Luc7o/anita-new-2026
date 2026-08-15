"""
Crea un usuario del staff con un rol administrativo, o le cambia el rol si el
email ya está registrado.

Roles disponibles: superadmin, moderador, editor, soporte, auditor
(y "cliente", aunque para eso no hace falta este script).

Uso:
    python crear_admin.py correo@ejemplo.com "Mi Password123" Nombre Apellido [rol]

Si no indicas el rol, se crea como "superadmin".
"""
import sys
from app import create_app
from app.extensions import db
from app.models import Usuario
from app.roles import ROLES

app = create_app()


def crear_admin(email, password, nombre="Admin", apellido="Anita", rol="superadmin"):
    if rol not in ROLES:
        print(f"❌ Rol inválido: {rol}. Usa uno de: {', '.join(ROLES.keys())}")
        sys.exit(1)

    with app.app_context():
        email = email.lower().strip()
        usuario = Usuario.query.filter_by(email=email).first()

        if usuario:
            usuario.rol = rol
            usuario.es_admin = rol != "cliente"
            db.session.commit()
            print(f"✅ {email} ya existía, ahora tiene el rol: {ROLES[rol]}")
            return

        usuario = Usuario(
            nombre=nombre, apellido=apellido, email=email,
            rol=rol, es_admin=rol != "cliente",
        )
        usuario.set_password(password)
        db.session.add(usuario)
        db.session.commit()
        print(f"✅ Usuario creado: {email} — rol: {ROLES[rol]}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print('Uso: python crear_admin.py correo@ejemplo.com "Password123" [Nombre] [Apellido] [rol]')
        print(f"Roles disponibles: {', '.join(ROLES.keys())}")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]
    nombre = sys.argv[3] if len(sys.argv) > 3 else "Admin"
    apellido = sys.argv[4] if len(sys.argv) > 4 else "Anita"
    rol = sys.argv[5] if len(sys.argv) > 5 else "superadmin"

    crear_admin(email, password, nombre, apellido, rol)
