"""
Consulta de DNI / RUC / Carné de Extranjería contra una API de "APIs Perú"
(por defecto apunta a decolecta / apis.net.pe, pero cualquier proveedor con
el mismo patrón — GET + cabecera "Authorization: Bearer {token}" — funciona
solo cambiando API_PERU_BASE_URL en el .env).

Nota importante: por normativa de protección de datos personales en Perú,
varios proveedores (incluido apis.net.pe/decolecta) ya NO ofrecen consulta
pública de DNI/RENIEC, solo de RUC/SUNAT. Si tu proveedor no soporta DNI,
esta función simplemente devolverá un error claro y el registro sigue
funcionando igual (el campo queda sin autocompletar).
"""
import requests
from flask import current_app


def api_peru_configurada():
    return bool(current_app.config.get("API_PERU_TOKEN"))


def consultar_documento(tipo, numero):
    """
    tipo: "dni" | "ruc" | "ce"
    numero: número de documento, ya validado en formato (largo/dígitos) antes
            de llamar a esta función.

    Devuelve (ok: bool, datos: dict | None, error: str | None)
    """
    if not api_peru_configurada():
        return False, None, "La validación de documentos todavía no está configurada."

    base_url = current_app.config["API_PERU_BASE_URL"].rstrip("/")
    token = current_app.config["API_PERU_TOKEN"]
    headers = {"Accept": "application/json", "Authorization": f"Bearer {token}"}

    if tipo == "ruc":
        url = f"{base_url}/v1/sunat/ruc?numero={numero}"
    elif tipo == "dni":
        url = f"{base_url}/v1/reniec/dni?numero={numero}"
    else:
        return False, None, "La validación automática solo está disponible para DNI y RUC."

    try:
        resp = requests.get(url, headers=headers, timeout=8)
    except requests.RequestException as e:
        current_app.logger.error(f"Error de red consultando {tipo} {numero}: {e}")
        return False, None, "No se pudo contactar al servicio de validación, intenta de nuevo."

    if resp.status_code == 404:
        return False, None, "No se encontró ese documento."
    if resp.status_code == 401 or resp.status_code == 403:
        current_app.logger.error(f"Token de API Perú inválido/vencido (status {resp.status_code})")
        return False, None, "La validación de documentos no está disponible en este momento."
    if not resp.ok:
        current_app.logger.error(f"API Perú respondió {resp.status_code} para {tipo} {numero}: {resp.text[:200]}")
        return False, None, "No se pudo validar el documento en este momento."

    data = resp.json()

    if tipo == "ruc":
        resultado = {
            "numero": data.get("numero") or numero,
            "nombre_o_razon_social": data.get("razon_social") or data.get("nombre_o_razon_social"),
            "estado": data.get("estado"),
            "condicion": data.get("condicion"),
        }
    else:  # dni
        nombres = data.get("nombres") or data.get("first_name") or ""
        ap_paterno = data.get("apellido_paterno") or data.get("first_last_name") or ""
        ap_materno = data.get("apellido_materno") or data.get("second_last_name") or ""
        resultado = {
            "numero": data.get("numero") or data.get("dni") or numero,
            "nombres": nombres,
            "apellido_paterno": ap_paterno,
            "apellido_materno": ap_materno,
        }

    return True, resultado, None
