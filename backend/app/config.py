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
    JWT_TOKEN_LOCATION = ["headers"]

    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

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

    # Pasarela de pago TuPay (Tu Multipay) — tarjeta (XACC) y Yape (XAYP).
    # Credenciales en Panel Tupay -> Settings -> API Access -> Deposit credentials.
    # Mientras TUPAY_API_KEY / TUPAY_API_SIGNATURE estén vacíos, iniciar un
    # pago devuelve un error claro en vez de romper el checkout.
    TUPAY_API_KEY = os.getenv("TUPAY_API_KEY", "")
    TUPAY_API_SIGNATURE = os.getenv("TUPAY_API_SIGNATURE", "")
    TUPAY_BASE_URL = os.getenv("TUPAY_BASE_URL", "https://api-stg.tupayonline.com")
    # URL pública (debe ser HTTPS y accesible desde internet) donde TuPay avisa
    # los cambios de estado del depósito. En desarrollo local usa un túnel
    # (ngrok/cloudflared) y pégalo aquí.
    TUPAY_NOTIFICATION_URL = os.getenv(
        "TUPAY_NOTIFICATION_URL", "http://localhost:5000/api/pedidos/tupay/notificacion"
    )
    # True mientras se prueba en STG: las transacciones "test" no afectan el
    # balance real del comercio. Poner en "false" recién al pasar a Producción.
    TUPAY_MODO_PRUEBA = os.getenv("TUPAY_MODO_PRUEBA", "true").lower() == "true"

    # Subida de imágenes de producto
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads", "productos")
    EXTENSIONES_PERMITIDAS = {"png", "jpg", "jpeg", "webp", "gif"}
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB
