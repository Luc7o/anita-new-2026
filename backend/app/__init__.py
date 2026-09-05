import os
from flask import Flask, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix
from app.config import Config
from app.extensions import db, migrate, jwt, cors, limiter


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Vercel es el único proxy delante de este backend: confía en UN solo
    # salto de X-Forwarded-For/Proto/Host (el que pone Vercel), no en toda
    # la cadena. Sin esto, get_remote_address() del rate limiter (#9 de la
    # auditoría) o ve la IP interna de Vercel para todos los requests
    # (limiter por IP inútil, todos comparten "IP"), o -si en algún punto
    # se leyera X-Forwarded-For a mano sin este límite- alguien podría
    # mandar su propio header falso y aparentar una IP distinta en cada
    # intento para saltarse el límite.
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"], "supports_credentials": True}},
    )

    es_produccion = os.environ.get("VERCEL_ENV") == "production" or os.environ.get("FLASK_ENV") == "production"

    # --- Fail closed: nunca arrancar en producción con secretos de
    # desarrollo o vacíos. Si esto revienta el deploy, es justamente lo que
    # tiene que pasar — la alternativa es firmar JWTs de producción con una
    # clave que cualquiera puede ver en este mismo repo (hallazgo crítico #4
    # de la auditoría de seguridad).
    if es_produccion:
        secretos_inseguros = {
            "SECRET_KEY": {"", "dev-secret-key"},
            "JWT_SECRET_KEY": {"", "dev-jwt-secret"},
        }
        for nombre, valores_prohibidos in secretos_inseguros.items():
            if app.config.get(nombre) in valores_prohibidos:
                raise RuntimeError(
                    f"{nombre} no está configurado (o sigue con el valor de desarrollo) en un "
                    f"entorno de producción. Configúralo como variable de entorno en Vercel antes "
                    f"de desplegar — con el valor por defecto, cualquiera podría forjar tokens de "
                    f"superadmin."
                )

    if not app.config.get("REDIS_URL"):
        if app.config.get("REQUIRE_REDIS_EN_PROD") and es_produccion:
            raise RuntimeError(
                "REDIS_URL no está configurado y REQUIRE_REDIS_EN_PROD=true. El rate limiter no "
                "puede correr en memoria en producción (cada instancia serverless cuenta por su "
                "cuenta, así que no protege nada de verdad). Configura REDIS_URL o, si de verdad "
                "quieres arrancar sin Redis, pon REQUIRE_REDIS_EN_PROD=false."
            )
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

    # Revocación de sesiones (ver Usuario.sesion_version): un token es
    # "revocado" si no trae el claim "sv", o si ese valor no coincide con
    # el sesion_version ACTUAL del usuario en base de datos — sin importar
    # que la firma y la fecha de expiración del token sigan siendo
    # válidas. Esto es lo que hace que logout / cambio de contraseña /
    # restablecer contraseña maten tokens ya emitidos al instante, en vez
    # de solo dejar de emitir nuevos.
    @jwt.token_in_blocklist_loader
    def _token_revocado(jwt_header, jwt_payload):
        from app.models import Usuario

        sv_token = jwt_payload.get("sv")
        if sv_token is None:
            # Tokens emitidos antes de este fix nunca tuvieron este claim:
            # los tratamos como revocados para forzar un solo re-login.
            return True

        usuario = Usuario.query.get(int(jwt_payload["sub"]))
        if not usuario:
            return True
        return sv_token != usuario.sesion_version

    @jwt.revoked_token_loader
    def _token_revocado_respuesta(jwt_header, jwt_payload):
        return jsonify({"error": "Tu sesión ya no es válida, vuelve a iniciar sesión", "code": "token_invalido"}), 401

    from app.routes import auth, productos, carrito, pedidos, documentos, favoritos, promociones, ubicaciones
    from app.routes import admin_productos, admin_categorias, admin_pedidos, admin_reportes
    from app.routes import admin_proveedores, admin_usuarios, admin_uploads, admin_configuracion
    from app.routes import admin_promociones, jobs
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
    app.register_blueprint(jobs.bp)

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
