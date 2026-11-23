"""Levanta el backend real contra la base E2E (y la Culqi falsa en un hilo)."""
import threading
from http.server import ThreadingHTTPServer

from entorno import PUERTO_API, PUERTO_CULQI
from culqi_falso import Culqi

from app import create_app  # noqa: E402
from app.extensions import limiter  # noqa: E402

if __name__ == "__main__":
    servidor_culqi = ThreadingHTTPServer(("127.0.0.1", PUERTO_CULQI), Culqi)
    threading.Thread(target=servidor_culqi.serve_forever, daemon=True).start()
    app = create_app()
    limiter.enabled = False
    app.run(host="127.0.0.1", port=PUERTO_API, debug=False, use_reloader=False, threaded=True)
