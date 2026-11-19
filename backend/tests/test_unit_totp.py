"""Verificación en dos pasos (TOTP): códigos, ventana de reloj y no reutilización."""
from app.utils import totp

# Vector oficial de la RFC 6238 (SHA-1): secreto "12345678901234567890" en base32.
SECRETO_RFC = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"


def test_codigo_coincide_con_el_vector_de_la_rfc():
    # En t=59 s la RFC da 94287082 (8 dígitos); con 6 dígitos son los últimos seis.
    assert totp._codigo(SECRETO_RFC, totp.paso_actual(59)) == "287082"


def test_acepta_el_codigo_actual_y_devuelve_su_paso():
    ahora = 1_700_000_000
    codigo = totp._codigo(SECRETO_RFC, totp.paso_actual(ahora))
    assert totp.verificar_codigo(SECRETO_RFC, codigo, ahora=ahora) == totp.paso_actual(ahora)


def test_tolera_un_paso_de_desfase_de_reloj_pero_no_dos():
    ahora = 1_700_000_000
    paso = totp.paso_actual(ahora)
    anterior = totp._codigo(SECRETO_RFC, paso - 1)
    muy_viejo = totp._codigo(SECRETO_RFC, paso - 2)
    assert totp.verificar_codigo(SECRETO_RFC, anterior, ahora=ahora) == paso - 1
    assert totp.verificar_codigo(SECRETO_RFC, muy_viejo, ahora=ahora) is None


def test_un_codigo_ya_usado_no_se_puede_reutilizar():
    ahora = 1_700_000_000
    paso = totp.paso_actual(ahora)
    codigo = totp._codigo(SECRETO_RFC, paso)
    assert totp.verificar_codigo(SECRETO_RFC, codigo, ultimo_paso=paso, ahora=ahora) is None


def test_ignora_espacios_y_rechaza_longitudes_incorrectas():
    ahora = 1_700_000_000
    codigo = totp._codigo(SECRETO_RFC, totp.paso_actual(ahora))
    assert totp.verificar_codigo(SECRETO_RFC, f"{codigo[:3]} {codigo[3:]}", ahora=ahora) is not None
    assert totp.verificar_codigo(SECRETO_RFC, "12345", ahora=ahora) is None
    assert totp.verificar_codigo(SECRETO_RFC, "", ahora=ahora) is None
    assert totp.verificar_codigo(SECRETO_RFC, None, ahora=ahora) is None


def test_el_secreto_se_cifra_y_descifra(ctx):
    secreto = totp.generar_secreto()
    cifrado = totp.cifrar(secreto)
    assert cifrado != secreto
    assert totp.descifrar(cifrado) == secreto
    assert totp.descifrar("basura-que-no-es-fernet") is None


def test_codigos_de_respaldo_son_unicos_y_el_hash_ignora_formato():
    codigos, hashes = totp.generar_codigos_respaldo()
    assert len(codigos) == totp.CANTIDAD_CODIGOS_RESPALDO
    assert len(set(codigos)) == len(codigos)
    assert hashes[0] == totp.hash_codigo_respaldo(codigos[0].upper().replace("-", " "))


def test_uri_otpauth_lleva_emisor_y_secreto():
    uri = totp.uri_otpauth("ABC", "ana@prueba.test")
    assert uri.startswith("otpauth://totp/")
    assert "secret=ABC" in uri and "issuer=Anita%20New%20Style" in uri
