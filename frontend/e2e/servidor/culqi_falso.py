"""
API de Culqi falsa para las pruebas E2E (solo /v2/charges y /v2/refunds).
El "token" que entrega el widget simulado decide el resultado:
  tkn_e2e_rechazo...  → tarjeta rechazada (objeto error de Culqi)
  cualquier otro      → cargo aprobado
"""
import json
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from entorno import PUERTO_CULQI


class Culqi(BaseHTTPRequestHandler):
    def _responder(self, codigo, cuerpo):
        datos = json.dumps(cuerpo).encode()
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def do_POST(self):  # noqa: N802
        largo = int(self.headers.get("Content-Length") or 0)
        pedido = json.loads(self.rfile.read(largo) or b"{}")
        if self.path.startswith("/v2/charges"):
            if str(pedido.get("source_id", "")).startswith("tkn_e2e_rechazo"):
                return self._responder(402, {
                    "object": "error", "type": "card_error", "code": "card_declined",
                    "decline_code": "insufficient_funds",
                    "user_message": "Tu tarjeta no tiene fondos suficientes.",
                })
            return self._responder(201, {"object": "charge", "id": f"chr_e2e_{uuid.uuid4().hex[:10]}"})
        if self.path.startswith("/v2/refunds"):
            return self._responder(201, {"object": "refund", "id": f"ref_e2e_{uuid.uuid4().hex[:10]}"})
        return self._responder(404, {"object": "error", "user_message": "Ruta no simulada"})

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", PUERTO_CULQI), Culqi).serve_forever()
