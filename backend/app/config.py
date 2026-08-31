import os
from datetime import timedelta
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_NAME = os.getenv("DB_NAME", "anita_new_style")

    # Escapamos usuario y password por si tienen caracteres especiales (@, :, /, etc.)
    _usuario_escapado = quote_plus(DB_USER)
    _password_escapado = quote_plus(DB_PASSWORD)

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{_usuario_escapado}:{_password_escapado}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    # Access token de corta duración: se usa en cada request y se refresca
    # solo, sin que el usuario tenga que volver a loguearse. El refresh
    # token dura mucho más y solo se usa para pedir accesos nuevos.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # El access token sigue viajando por header Authorization (el frontend lo
    # guarda solo en memoria, nunca en localStorage). El refresh token en
    # cambio va en una cookie httpOnly: así, aunque haya un XSS en el
    # frontend, JavaScript no puede leerlo ni robarlo — es el navegador quien
    # lo adjunta solo, y solo al único endpoint que lo necesita.
    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_REFRESH_COOKIE_NAME = "ans_refresh_token"
    JWT_REFRESH_COOKIE_PATH = "/api/auth/refrescar-token"
    # No usamos cookie para el access token: solo seteamos la de refresh.
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_REFRESH_CSRF_HEADER_NAME = "X-CSRF-Token"

    # Cross-site en producción (frontend y backend son dos apps distintas en
    # Vercel, con dominios distintos) -> SameSite=None + Secure es
    # obligatorio para que el navegador mande la cookie. En local (mismo
    # "site" localhost, solo cambia el puerto) SameSite=Lax basta y no
    # requiere HTTPS.
    _es_produccion = os.getenv("VERCEL_ENV") == "production" or os.getenv("FLASK_ENV") == "production"
    JWT_COOKIE_SECURE = _es_produccion
    JWT_COOKIE_SAMESITE = "None" if _es_produccion else "Lax"

    # Acepta uno o varios orígenes separados por coma (útil durante la
    # migración al dominio propio, mientras el frontend puede estar servido
    # tanto desde *.vercel.app como desde el dominio custom). Ejemplo:
    # "https://anita-new-2026.vercel.app,https://www.anita-new-style.xyz"
    _frontend_origin_raw = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    FRONTEND_ORIGIN = [origen.strip() for origen in _frontend_origin_raw.split(",") if origen.strip()]

    # Backend de almacenamiento para Flask-Limiter (cuenta los intentos de
    # login, registro, recuperación de contraseña, etc.). En Vercel el
    # backend corre como funciones serverless: cada invocación puede caer en
    # una instancia distinta, así que guardar los contadores en memoria
    # (el default de Flask-Limiter) NO funciona ahí — cada instancia cuenta
    # por su cuenta y los límites dejan de cumplirse de verdad. Por eso en
    # producción esto debe apuntar a un Redis compartido (ej. el add-on de
    # Railway) vía REDIS_URL. Si REDIS_URL no está seteado, cae a memoria
    # (memory://), que sigue sirviendo para desarrollo local.
    REDIS_URL = os.getenv("REDIS_URL", "")
    RATELIMIT_STORAGE_URI = REDIS_URL or "memory://"

    # Correo transaccional (registro, confirmación, recuperación de contraseña)
    # vía Resend (https://resend.com). Si dejas RESEND_API_KEY vacío, el
    # contenido del correo se imprime en la consola en vez de enviarse de
    # verdad — útil mientras desarrollas, sin necesidad de tener la cuenta lista.
    RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
    RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "no-responder@anitanewstyle.com")

    # Validación de DNI / RUC / Carné de Extranjería vía una API de APIs Perú
    # (ej. decolecta / apis.net.pe, apiperu.dev, u otro proveedor compatible:
    # GET {base}/... con cabecera "Authorization: Bearer {token}").
    # Si dejas API_PERU_TOKEN vacío, el botón "validar" del registro
    # simplemente no autocompleta nada — el usuario puede seguir escribiendo
    # su documento a mano sin que el registro se bloquee.
    API_PERU_TOKEN = os.getenv("API_PERU_TOKEN", "")
    API_PERU_BASE_URL = os.getenv("API_PERU_BASE_URL", "https://api.decolecta.com")

    # Pasarela de pago Culqi — tarjeta y Yape se cobran en el momento
    # (síncrono: no hay redirección ni webhook, a diferencia de TuPay).
    # Llave secreta: Panel Culqi -> Desarrollo -> API Keys -> Llave privada.
    # Mientras CULQI_SECRET_KEY esté vacío, cobrar devuelve un error claro en
    # vez de romper el checkout.
    CULQI_SECRET_KEY = os.getenv("CULQI_SECRET_KEY", "")
    CULQI_BASE_URL = os.getenv("CULQI_BASE_URL", "https://api.culqi.com")

    # Subida de imágenes de producto
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads", "productos")
    EXTENSIONES_PERMITIDAS = {"png", "jpg", "jpeg", "webp", "gif"}
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB