"""
PDF de la Hoja de Reclamación virtual (Libro de Reclamaciones, Indecopi).

Reproduce la estructura de la hoja oficial de Indecopi, sección por sección:
  encabezado (fecha, N°, datos del proveedor)
  1. Identificación del consumidor reclamante
  2. Identificación del bien contratado
  3. Detalle de la reclamación y pedido del consumidor
  4. Observaciones y acciones adoptadas por el proveedor
y las notas al pie (definiciones de reclamo/queja y plazo de 15 días hábiles).

Se genera tanto al registrar el reclamo (sección 4 vacía) como al responderlo
(sección 4 completa), y es la copia que recibe el consumidor.
"""
from datetime import timedelta
from html import escape
from io import BytesIO

from flask import current_app
from xhtml2pdf import pisa

_CSS = """
    @page { size: A4; margin: 1.0cm 1.5cm; }
    body { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; color: #000; }
    table { width: 100%; border-collapse: collapse; }
    td { border: 1px solid #000; padding: 2px 6px; vertical-align: top; font-size: 9pt; }
    .sin-borde td { border: none; padding: 2px 4px; }
    .titulo { font-size: 13pt; font-weight: bold; }
    .seccion { background-color: #d9d9d9; font-weight: bold; font-size: 9pt; padding: 4px 6px; }
    .etq { font-weight: bold; }
    .caja { height: 52px; }
    .caja-resp { height: 70px; }
    .nota { font-size: 7.5pt; }
    .centro { text-align: center; }
"""


def _txt(valor):
    """Texto de usuario seguro para incrustar en el HTML del PDF."""
    if valor is None or str(valor).strip() == "":
        return "-"
    return escape(str(valor)).replace("\n", "<br/>")


def _lima(dt):
    # Las fechas se guardan en UTC; Perú es UTC-5 todo el año (sin horario de verano).
    return dt - timedelta(hours=5) if dt else None


def _marca(activo):
    return "[ X ]" if activo else "[&nbsp;&nbsp;&nbsp;]"


def generar_pdf_hoja(r):
    """Recibe una Reclamacion y devuelve los bytes de su hoja en PDF."""
    cfg = current_app.config
    razon = _txt(cfg.get("PROVEEDOR_RAZON_SOCIAL"))
    ruc = _txt(cfg.get("PROVEEDOR_RUC"))
    domicilio = _txt(cfg.get("PROVEEDOR_DOMICILIO"))

    fecha = _lima(r.fecha_registro)
    fecha_txt = fecha.strftime("%d/%m/%Y %H:%M") if fecha else "-"
    monto = f"S/ {float(r.monto_reclamado):,.2f}" if r.monto_reclamado is not None else "-"

    respondido = r.estado == "respondido"
    fecha_resp = _lima(r.fecha_respuesta)
    fecha_resp_txt = fecha_resp.strftime("%d/%m/%Y %H:%M") if (respondido and fecha_resp) else ""
    texto_resp = _txt(r.respuesta) if respondido else ""

    descripcion = _txt(r.bien_descripcion)
    if r.numero_pedido:
        descripcion += f"<br/><b>N&deg; de pedido:</b> {_txt(r.numero_pedido)}"

    html = f"""
    <html><head><meta charset="utf-8"><style>{_CSS}</style></head><body>

    <table>
      <tr>
        <td class="titulo" width="55%">LIBRO DE RECLAMACIONES</td>
        <td class="centro etq" width="45%">HOJA DE RECLAMACI&Oacute;N</td>
      </tr>
      <tr>
        <td><span class="etq">FECHA:</span> {fecha_txt}</td>
        <td><span class="etq">N&deg;</span> {_txt(r.codigo)}</td>
      </tr>
      <tr><td colspan="2"><span class="etq">PROVEEDOR:</span> {razon}</td></tr>
      <tr><td colspan="2"><span class="etq">RUC:</span> {ruc}</td></tr>
      <tr><td colspan="2"><span class="etq">DOMICILIO:</span> {domicilio}</td></tr>
    </table>

    <table style="margin-top:6px">
      <tr><td class="seccion" colspan="2">1. IDENTIFICACI&Oacute;N DEL CONSUMIDOR RECLAMANTE</td></tr>
      <tr><td colspan="2"><span class="etq">NOMBRE:</span> {_txt(r.consumidor_nombre)}</td></tr>
      <tr><td colspan="2"><span class="etq">{_txt(r.consumidor_doc_tipo)}:</span> {_txt(r.consumidor_documento)}</td></tr>
      <tr><td colspan="2"><span class="etq">DOMICILIO:</span> {_txt(r.consumidor_domicilio)}</td></tr>
      <tr>
        <td width="40%"><span class="etq">TEL&Eacute;FONO:</span> {_txt(r.consumidor_telefono)}</td>
        <td width="60%"><span class="etq">E-MAIL:</span> {_txt(r.consumidor_email)}</td>
      </tr>
      <tr><td colspan="2"><span class="etq">SI ES MENOR DE EDAD, NOMBRE DEL PADRE, MADRE O APODERADO:</span> {_txt(r.apoderado_nombre)}</td></tr>
    </table>

    <table style="margin-top:6px">
      <tr><td class="seccion" colspan="2">2. IDENTIFICACI&Oacute;N DEL BIEN CONTRATADO</td></tr>
      <tr>
        <td width="50%"><span class="etq">PRODUCTO</span> {_marca(r.bien_tipo == "producto")}
            &nbsp;&nbsp;&nbsp;<span class="etq">SERVICIO</span> {_marca(r.bien_tipo == "servicio")}</td>
        <td width="50%"><span class="etq">MONTO RECLAMADO:</span> {monto}</td>
      </tr>
      <tr><td colspan="2"><span class="etq">DESCRIPCI&Oacute;N:</span> {descripcion}</td></tr>
    </table>

    <table style="margin-top:6px">
      <tr>
        <td class="seccion" width="58%">3. DETALLE DE LA RECLAMACI&Oacute;N Y PEDIDO DEL CONSUMIDOR</td>
        <td class="seccion centro" width="42%">RECLAMO<sup>1</sup> {_marca(r.tipo == "reclamo")}
            &nbsp;&nbsp;QUEJA<sup>2</sup> {_marca(r.tipo == "queja")}</td>
      </tr>
      <tr><td colspan="2" class="caja"><span class="etq">DETALLE:</span><br/>{_txt(r.detalle)}</td></tr>
      <tr><td colspan="2" class="caja"><span class="etq">PEDIDO:</span><br/>{_txt(r.pedido_consumidor)}</td></tr>
      <tr><td colspan="2" class="centro"><span class="etq">FIRMA DEL CONSUMIDOR:</span>
          registro virtual con el correo {_txt(r.consumidor_email)}</td></tr>
    </table>

    <table style="margin-top:6px">
      <tr><td class="seccion" colspan="2">4. OBSERVACIONES Y ACCIONES ADOPTADAS POR EL PROVEEDOR</td></tr>
      <tr><td colspan="2"><span class="etq">FECHA DE COMUNICACI&Oacute;N DE LA RESPUESTA:</span> {fecha_resp_txt if respondido else "Pendiente"}</td></tr>
      <tr><td colspan="2" class="caja-resp">{texto_resp if respondido else "Respuesta pendiente. El proveedor responder&aacute; en un plazo no mayor a quince (15) d&iacute;as h&aacute;biles."}</td></tr>
      <tr><td colspan="2" class="centro"><span class="etq">FIRMA DEL PROVEEDOR:</span> {razon}</td></tr>
    </table>

    <table class="sin-borde" style="margin-top:8px">
      <tr>
        <td class="nota" width="50%"><sup>1</sup> <b>RECLAMO:</b> Disconformidad relacionada a los productos o servicios.</td>
        <td class="nota" width="50%"><sup>2</sup> <b>QUEJA:</b> Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atenci&oacute;n al p&uacute;blico.</td>
      </tr>
    </table>
    <p class="nota centro" style="margin-top:6px"><b>HOJA DE RECLAMACI&Oacute;N VIRTUAL</b></p>
    <p class="nota">* La formulaci&oacute;n del reclamo no impide acudir a otras v&iacute;as de soluci&oacute;n de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.<br/>
    * El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a quince (15) d&iacute;as h&aacute;biles, el cual es improrrogable.</p>
    </body></html>
    """
    buffer = BytesIO()
    resultado = pisa.CreatePDF(html, dest=buffer, encoding="utf-8")
    if resultado.err:
        raise RuntimeError(f"No se pudo generar la hoja de reclamación ({resultado.err} errores)")
    return buffer.getvalue()
