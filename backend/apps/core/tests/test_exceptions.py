from rest_framework.exceptions import NotAuthenticated, Throttled

from apps.core.exceptions import exception_handler


def test_throttled_devuelve_un_mensaje_en_espanol_con_los_segundos() -> None:
    response = exception_handler(Throttled(wait=58), {})

    assert response is not None
    assert response.data == {"detail": "Demasiados intentos. Vuelve a intentarlo en 58 segundos."}


def test_throttled_usa_singular_con_un_segundo() -> None:
    response = exception_handler(Throttled(wait=1), {})

    assert response is not None
    assert response.data == {"detail": "Demasiados intentos. Vuelve a intentarlo en 1 segundo."}


def test_otras_excepciones_no_se_tocan() -> None:
    response = exception_handler(NotAuthenticated(), {})

    assert response is not None
    assert response.data != {"detail": "Demasiados intentos. Vuelve a intentarlo más tarde."}
