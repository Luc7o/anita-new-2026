from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, migrate, jwt, cors, limiter


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"], "supports_credentials": True}},
    )

    if not app.config.get("REDIS_URL"):
        app.logger.warning(
            "REDIS_URL no está configurado: el rate limiter está corriendo en "
            "memoria. En Vercel esto NO protege de verdad contra fuerza bruta "
            "(cada instancia serverless cuenta por su cuenta). Configura "
            "REDIS_URL en producción."
        )

    # Respuestas de error de JWT con un "code" distinguible, para que el
    # frontend sepa cuándo conviene intentar refrescar el token (token
    # expirado/ausente) y cuándo no (token inválido/manipulado -> a loguear
    # de nuevo directamente).
    @jwt.expired_token_loader
    def _token_expirado(jwt_header, jwt_payload):
        return jsonify({"error": "Tu sesión expiró", "code": "token_expirado"}), 401

    @jwt.invalid_token_loader
    def _token_invalido(motivo):
        return jsonify({"error": "Sesión inválida, vuelve a iniciar sesión", "code": "token_invalido"}), 401

    @jwt.unauthorized_loader
    def _token_faltante(motivo):
        return jsonify({"error": "Debes iniciar sesión", "code": "token_faltante"}), 401

    from app.routes import auth, productos, carrito, pedidos, documentos, favoritos, promociones, ubicaciones
    from app.routes import admin_productos, admin_categorias, admin_pedidos, admin_reportes
    from app.routes import admin_proveedores, admin_usuarios, admin_uploads, admin_configuracion
    from app.routes import admin_promociones
    app.register_blueprint(auth.bp)
    app.register_blueprint(productos.bp)
    app.register_blueprint(carrito.bp)
    app.register_blueprint(pedidos.bp)
    app.register_blueprint(documentos.bp)
    app.register_blueprint(favoritos.bp)
    app.register_blueprint(promociones.bp)
    app.register_blueprint(ubicaciones.bp)
    app.register_blueprint(admin_productos.bp)
    app.register_blueprint(admin_categorias.bp)
    app.register_blueprint(admin_pedidos.bp)
    app.register_blueprint(admin_reportes.bp)
    app.register_blueprint(admin_proveedores.bp)
    app.register_blueprint(admin_usuarios.bp)
    app.register_blueprint(admin_uploads.bp)
    app.register_blueprint(admin_configuracion.bp)
    app.register_blueprint(admin_promociones.bp)

    @app.get("/api/salud")
    def salud():
        return jsonify({"status": "ok", "app": "Anita New Style API"})

    @app.errorhandler(404)
    def no_encontrado(e):
        return jsonify({"error": "Recurso no encontrado"}), 404

    @app.errorhandler(429)
    def demasiadas_solicitudes(e):
        return jsonify({
            "error": "Demasiados intentos. Espera un momento antes de volver a intentar."
        }), 429

    @app.errorhandler(500)
    def error_servidor(e):
        return jsonify({"error": "Error interno del servidor"}), 500

    return app
